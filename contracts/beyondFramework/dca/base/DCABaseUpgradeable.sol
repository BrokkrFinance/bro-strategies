//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { InvestQueueLib } from "../libraries/InvestQueueLib.sol";
import { DcaHistoryLib } from "../libraries/DcaHistoryLib.sol";
import { IDcaStrategy } from "../interfaces/IDcaStrategy.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

abstract contract DCABaseUpgradeable is
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IDcaStrategy
{
    using InvestQueueLib for InvestQueueLib.InvestQueue;
    using DcaHistoryLib for DcaHistoryLib.DcaHistory;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public dcaInvestor;
    address[] public portfolios;

    IERC20Upgradeable public depositToken;
    uint256 private depositTokenScale;

    uint256 public investmentPeriod;
    uint256 public lastInvestmentTimestamp;

    uint16 public positionsLimit;

    InvestQueueLib.InvestQueue private globalInvestQueue;
    DcaHistoryLib.DcaHistory private dcaHistory;

    mapping(address => DcaDepositor) private depositors;

    // solhint-disable-next-line
    function __DCABaseUpgradeable_init(DcaStrategyInitArgs calldata args)
        internal
        onlyInitializing
    {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        dcaInvestor = args.dcaInvestor;
        depositToken = args.depositToken;
        depositTokenScale = 10**6; // TODO: pass or calculate?
        investmentPeriod = args.investmentPeriod;
        lastInvestmentTimestamp = args.lastInvestmentTimestamp;
        positionsLimit = args.positionsLimit;
    }

    modifier onlyDcaInvestor() {
        require(_msgSender() == dcaInvestor, "Unauthorized");
        _;
    }

    modifier onlyPortfolio() {
        bool authorized;
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == _msgSender()) {
                authorized = true;
            }
        }

        require(authorized, "Unauthorized");
        _;
    }

    // ----- Base Class Methods -----
    function deposit(uint256 amount, uint8 amountSplit)
        public
        virtual
        nonReentrant
    {
        _deposit(_msgSender(), amount, amountSplit);
    }

    function depositFor(
        address sender,
        uint256 amount,
        uint8 amountSplit
    ) public virtual onlyPortfolio nonReentrant {
        _deposit(sender, amount, amountSplit);
    }

    function _deposit(
        address sender,
        uint256 amount,
        uint8 amountSplit
    ) private {
        // assert valid amount sent
        if (amount == 0) {
            revert ZeroDeposit();
        }

        DcaDepositor storage depositor = depositors[sender];

        // assert positions limit is not reached
        if (depositor.positions.length == positionsLimit) {
            revert PositionsLimitReached();
        }

        // add splitted amounts to the queue
        globalInvestQueue.splitUserInvestmentAmount(amount, amountSplit);

        // transfer deposit token from portfolio
        depositToken.safeTransferFrom(_msgSender(), address(this), amount);

        // if not started position with the same split exists - increase deposit amount
        for (uint256 i = 0; i < depositor.positions.length; i++) {
            // calculate amount of passed investment epochs
            uint256 passedInvestPeriods = (lastInvestmentTimestamp -
                depositor.positions[i].investedAt) / investmentPeriod;

            bool isInvestmentStarted = passedInvestPeriods != 0 ? true : false;
            if (
                isInvestmentStarted ||
                depositor.positions[i].amountSplit != amountSplit
            ) continue;

            depositor.positions[i].depositAmount += amount;
            return;
        }

        // otherwise create new position
        depositor.positions.push(
            Position(
                amount,
                amountSplit,
                lastInvestmentTimestamp,
                dcaHistory.currentHistoricalIndex()
            )
        );
    }

    function exchangeDepositsAndInvestRewards()
        public
        virtual
        onlyDcaInvestor
        nonReentrant
    {
        // assert triggered at valid period
        uint256 passedInvestPeriods = _getPassedInvestPeriods();
        if (passedInvestPeriods == 0) {
            revert NothingToInvest();
        }

        // get amount for exchange
        for (uint256 i = 0; i < passedInvestPeriods; i++) {
            uint256 depositedAmount = globalInvestQueue
                .getCurrentInvestmentAmountAndMoveNext();

            // nobody invested in the queue, just skip this periods
            if (depositedAmount == 0) {
                break;
            }

            // swap deposit amount into invest token
            uint256 receivedBluechip = _swapIntoBluechipAsset(
                depositToken,
                depositedAmount
            );

            // invest exchanged amount
            _investRewards(receivedBluechip);

            // make historical gauge
            dcaHistory.addHistoricalGauge(depositedAmount, receivedBluechip);
        }

        // claim rewards
        uint256 claimedBluechipRewards = _claimRewards();

        // invest rewards and increase current gauge
        _investRewards(claimedBluechipRewards);
        dcaHistory.increaseCurrentGauge(claimedBluechipRewards);

        // update last invest timestamp
        lastInvestmentTimestamp += passedInvestPeriods * investmentPeriod;
    }

    function withdrawAll() public virtual nonReentrant {
        _withdrawAll(_msgSender());
    }

    function withdrawAllFor(address sender)
        public
        virtual
        onlyPortfolio
        nonReentrant
    {
        _withdrawAll(sender);
    }

    function _withdrawAll(address sender) private {
        uint256 notInvestedYet;
        uint256 investedIntoBluechip;

        DcaDepositor storage depositor = depositors[sender];
        for (uint256 i = 0; i < depositor.positions.length; i++) {
            // calculate amount of passed investment epochs
            uint256 passedInvestPeriods = (lastInvestmentTimestamp -
                depositor.positions[i].investedAt) / investmentPeriod;

            // compute per period investment - depositAmount / split
            uint256 perPeriodInvestment = depositor.positions[i].depositAmount /
                depositor.positions[i].amountSplit;

            uint8 futureInvestmentsToRemove = depositor
                .positions[i]
                .amountSplit - uint8(passedInvestPeriods);

            // remove not invested yet amount from invest queue
            globalInvestQueue.removeUserInvestment(
                perPeriodInvestment,
                futureInvestmentsToRemove
            );

            // if investment is not started yet we remove whole deposit token amount
            if (passedInvestPeriods == 0) {
                notInvestedYet += depositor.positions[i].depositAmount;
            } else {
                // otherwise we need to additionally calculate bluechip investment
                (
                    uint256 bluechipInvestment,
                    uint256 depositAssetInvestment
                ) = _removeUserInvestmentFromHistory(
                        depositor.positions[i],
                        passedInvestPeriods,
                        perPeriodInvestment
                    );

                investedIntoBluechip += bluechipInvestment;
                notInvestedYet +=
                    depositor.positions[i].depositAmount -
                    depositAssetInvestment;
            }
        }

        // since depositor withdraws everything
        // we can remove his data completely
        delete depositors[sender];

        if (investedIntoBluechip != 0) {
            // withdraw bluechip asset and transfer to depositor
            _withdrawDepositorBluechip(sender, investedIntoBluechip);
        }

        if (notInvestedYet != 0) {
            // transfer not invested yet deposit asset back to depositor
            depositToken.safeTransfer(sender, notInvestedYet);
        }
    }

    function withdrawAll(uint256 positionIndex) public virtual nonReentrant {
        _withdrawAll(_msgSender(), positionIndex);
    }

    function withdrawAllFor(address sender, uint256 positionIndex)
        public
        virtual
        onlyPortfolio
        nonReentrant
    {
        _withdrawAll(sender, positionIndex);
    }

    function _withdrawAll(address sender, uint256 positionIndex) private {
        DcaDepositor storage depositor = depositors[sender];
        Position memory position = depositor.positions[positionIndex];

        // calculate amount of passed investment epochs
        uint256 passedInvestPeriods = (lastInvestmentTimestamp -
            position.investedAt) / investmentPeriod;

        // compute per period investment - depositAmount / split
        uint256 perPeriodInvestment = position.depositAmount /
            position.amountSplit;

        uint8 futureInvestmentsToRemove = position.amountSplit -
            uint8(passedInvestPeriods);

        // remove not invested yet amount from invest queue
        globalInvestQueue.removeUserInvestment(
            perPeriodInvestment,
            futureInvestmentsToRemove
        );

        uint256 notInvestedYet;
        uint256 investedIntoBluechip;
        if (passedInvestPeriods == 0) {
            notInvestedYet = position.depositAmount;
        } else {
            (
                uint256 bluechipInvestment,
                uint256 depositAssetInvestment
            ) = _removeUserInvestmentFromHistory(
                    position,
                    passedInvestPeriods,
                    perPeriodInvestment
                );

            investedIntoBluechip = bluechipInvestment;
            notInvestedYet = position.depositAmount - depositAssetInvestment;
        }

        // remove position from user data
        depositor.positions[positionIndex] = depositor.positions[
            depositor.positions.length - 1
        ];
        depositor.positions.pop();

        if (investedIntoBluechip != 0) {
            // withdraw bluechip asset and transfer to depositor
            _withdrawDepositorBluechip(sender, investedIntoBluechip);
        }

        if (notInvestedYet != 0) {
            // transfer not invested yet deposit asset back to depositor
            depositToken.safeTransfer(sender, notInvestedYet);
        }
    }

    function withdrawBluechip() public virtual nonReentrant {
        _withdrawBluechip(_msgSender());
    }

    function withdrawBluechipFor(address sender)
        public
        virtual
        onlyPortfolio
        nonReentrant
    {
        _withdrawBluechip(sender);
    }

    function _withdrawBluechip(address sender) private {
        uint256 investedIntoBluechip;
        uint256 i = 0;

        DcaDepositor storage depositor = depositors[sender];
        while (i < depositor.positions.length) {
            // calculate amount of passed investment epochs
            uint256 passedInvestPeriods = (lastInvestmentTimestamp -
                depositor.positions[i].investedAt) / investmentPeriod;

            if (passedInvestPeriods == 0) continue;

            // compute per period investment - depositAmount / split
            uint256 perPeriodInvestment = depositor.positions[i].depositAmount /
                depositor.positions[i].amountSplit;

            (
                uint256 bluechipInvestment,
                uint256 depositAssetInvestment
            ) = _removeUserInvestmentFromHistory(
                    depositor.positions[i],
                    passedInvestPeriods,
                    perPeriodInvestment
                );

            uint8 newPositionSplit = depositor.positions[i].amountSplit -
                uint8(passedInvestPeriods);

            // remove not invested yet amount from invest queue
            globalInvestQueue.removeUserInvestment(
                perPeriodInvestment,
                newPositionSplit
            );

            investedIntoBluechip += bluechipInvestment;
            uint256 notInvestedYet = depositor.positions[i].depositAmount -
                depositAssetInvestment;

            _updateOrRemovePosition(
                depositor,
                i,
                notInvestedYet,
                newPositionSplit
            );

            i++;
        }

        if (investedIntoBluechip == 0) {
            revert NothingToWithdraw();
        }

        // withdraw bluechip asset and transfer to depositor
        _withdrawDepositorBluechip(sender, investedIntoBluechip);
    }

    function withdrawBluechip(uint256 positionIndex)
        public
        virtual
        nonReentrant
    {
        _withdrawBluechip(_msgSender(), positionIndex);
    }

    function withdrawBluechipFor(address sender, uint256 positionIndex)
        public
        virtual
        onlyPortfolio
        nonReentrant
    {
        _withdrawBluechip(sender, positionIndex);
    }

    function _withdrawBluechip(address sender, uint256 positionIndex) private {
        DcaDepositor storage depositor = depositors[sender];
        Position storage position = depositor.positions[positionIndex];

        // calculate amount of passed investment epochs
        uint256 passedInvestPeriods = (lastInvestmentTimestamp -
            position.investedAt) / investmentPeriod;

        if (passedInvestPeriods == 0) {
            revert NothingToWithdraw();
        }

        // compute per period investment - depositAmount / split
        uint256 perPeriodInvestment = position.depositAmount /
            position.amountSplit;

        (
            uint256 bluechipInvestment,
            uint256 depositAssetInvestment
        ) = _removeUserInvestmentFromHistory(
                position,
                passedInvestPeriods,
                perPeriodInvestment
            );

        uint8 newPositionSplit = position.amountSplit -
            uint8(passedInvestPeriods);

        // remove not invested yet amount from invest queue
        globalInvestQueue.removeUserInvestment(
            perPeriodInvestment,
            newPositionSplit
        );

        uint256 notInvestedYet = position.depositAmount -
            depositAssetInvestment;

        _updateOrRemovePosition(
            depositor,
            positionIndex,
            notInvestedYet,
            newPositionSplit
        );

        // withdraw bluechip asset and transfer to depositor
        _withdrawDepositorBluechip(sender, bluechipInvestment);
    }

    // ----- Base Class Setters -----
    function addPortfolio(address newPortfolio) public virtual onlyOwner {
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == newPortfolio) {
                revert PortfolioAlreadyWhitelisted();
            }
        }
    }

    function removePortfolio(address portfolio) public virtual onlyOwner {
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == portfolio) {
                portfolios[i] = portfolios[portfolios.length - 1];
                portfolios.pop();

                return;
            }
        }

        revert PortfolioNotFound();
    }

    // ----- Pausable -----
    function pause() external onlyOwner {
        super._pause();
    }

    function unpause() external onlyOwner {
        super._unpause();
    }

    // ----- Query Methods -----
    function canInvest() public view virtual returns (bool) {
        return _getPassedInvestPeriods() > 0;
    }

    // ----- Private Base Class Helper Functions -----
    function _getPassedInvestPeriods() private view returns (uint256) {
        // solhint-disable-next-line not-rely-on-time
        return (block.timestamp - lastInvestmentTimestamp) / investmentPeriod;
    }

    function _removeUserInvestmentFromHistory(
        Position memory position,
        uint256 passedInvestPeriods,
        uint256 perPeriodInvestment
    )
        private
        returns (uint256 bluechipInvestment, uint256 depositAssetInvestment)
    {
        // iterate over historical gauges since initial deposit
        for (
            uint256 j = position.investedAtHistoricalIndex;
            j < position.investedAtHistoricalIndex + passedInvestPeriods;
            j++
        ) {
            // total spent and received at selected investment day
            (uint256 amountSpent, uint256 amountExchanged) = dcaHistory
                .gaugeByIndex(j);

            // calculate user share for specified gauge
            uint256 depositorBluechipShare = (perPeriodInvestment *
                depositTokenScale) / amountSpent;
            uint256 depositorOwnedBluechip = (amountExchanged /
                depositTokenScale) * depositorBluechipShare;

            bluechipInvestment += depositorOwnedBluechip;
            depositAssetInvestment += perPeriodInvestment;

            // decrease gauge info
            dcaHistory.decreaseGaugeByIndex(
                j,
                perPeriodInvestment,
                depositorOwnedBluechip
            );
        }

        return (bluechipInvestment, depositAssetInvestment);
    }

    function _updateOrRemovePosition(
        DcaDepositor storage depositor,
        uint256 positionIndex,
        uint256 notInvestedYet,
        uint8 newPositionSplit
    ) private {
        // if not invested yet amount is > 0 then update position
        if (notInvestedYet > 0) {
            // add newly splitted amounts to the queue
            globalInvestQueue.splitUserInvestmentAmount(
                notInvestedYet,
                newPositionSplit
            );

            depositor.positions[positionIndex].depositAmount = notInvestedYet;
            depositor.positions[positionIndex].amountSplit = newPositionSplit;
            depositor
                .positions[positionIndex]
                .investedAt = lastInvestmentTimestamp;
            depositor
                .positions[positionIndex]
                .investedAtHistoricalIndex = dcaHistory
                .currentHistoricalIndex();
        } else {
            // otherwise remove position
            depositor.positions[positionIndex] = depositor.positions[
                depositor.positions.length - 1
            ];
            depositor.positions.pop();
        }
    }

    // ----- Functions For Child Contract -----
    function _swapIntoBluechipAsset(
        IERC20Upgradeable depositToken,
        uint256 amount
    ) internal virtual returns (uint256);

    function _investRewards(uint256 amount) internal virtual;

    function _claimRewards() internal virtual returns (uint256);

    function _withdrawDepositorBluechip(address depositor, uint256 amount)
        internal
        virtual;
}
