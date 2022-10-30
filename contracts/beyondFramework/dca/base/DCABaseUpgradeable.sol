//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { InvestQueueLib } from "../libraries/InvestQueueLib.sol";
import { DcaHistoryLib } from "../libraries/DcaHistoryLib.sol";
import { IDcaStrategy } from "../interfaces/IDcaStrategy.sol";
import { SwapLib } from "../libraries/SwapLib.sol";

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
    using SwapLib for SwapLib.Router;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    DepositFee public depositFee;

    address public dcaInvestor;
    address[] public portfolios;

    TokenInfo public depositTokenInfo;
    uint256 private depositTokenScale;

    uint256 public investmentPeriod;
    uint256 public lastInvestmentTimestamp;

    uint16 public positionsLimit;

    address[] public depositToBluechipSwapPath;
    address[] public bluechipToDepositSwapPath;

    BluechipInvestmentState public bluechipInvestmentState;

    InvestQueueLib.InvestQueue public globalInvestQueue;
    DcaHistoryLib.DcaHistory public dcaHistory;
    SwapLib.Router public router;

    TokenInfo public emergencyExitDepositToken;
    uint256 public emergencySellDepositPrice;
    TokenInfo public emergencyExitBluechipToken;
    uint256 public emergencySellBluechipPrice;

    mapping(address => DcaDepositor) private depositors;

    // solhint-disable-next-line
    function __DCABaseUpgradeable_init(DcaStrategyInitArgs calldata args)
        internal
        onlyInitializing
    {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        // TODO: declare setters
        depositFee = args.depositFee;
        dcaInvestor = args.dcaInvestor;
        depositTokenInfo = args.depositTokenInfo;
        depositTokenScale = 10**args.depositTokenInfo.decimals;
        investmentPeriod = args.investmentPeriod;
        lastInvestmentTimestamp = args.lastInvestmentTimestamp;
        positionsLimit = args.positionsLimit;
        bluechipInvestmentState = BluechipInvestmentState.Investing;
        router = args.router;
        depositToBluechipSwapPath = args.depositToBluechipSwapPath;
        bluechipToDepositSwapPath = args.bluechipToDepositSwapPath;
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

    modifier nonEmergencyExited() {
        require(
            bluechipInvestmentState != BluechipInvestmentState.EmergencyExited,
            "Strategy is blocked due to emergency exit"
        );
        _;
    }

    modifier emergencyWithdrawOnEmergencyExitedStatus(address sender) {
        // if emergency exited then user should receive everything in deposit asset
        if (isEmergencyExited()) {
            _emergencyWithdrawUserDeposit(sender);
            return;
        }

        _;
    }

    // ----- Base Class Methods -----
    function deposit(uint256 amount, uint8 amountSplit)
        public
        virtual
        nonReentrant
        nonEmergencyExited
    {
        _deposit(_msgSender(), amount, amountSplit);
    }

    function depositFor(
        address sender,
        uint256 amount,
        uint8 amountSplit
    ) public virtual onlyPortfolio nonReentrant nonEmergencyExited {
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

        // transfer deposit token from portfolio
        depositTokenInfo.token.safeTransferFrom(
            _msgSender(),
            address(this),
            amount
        );

        // compute actual deposit and transfer fee to receiver
        amount = _takeFee(amount);

        DcaDepositor storage depositor = depositors[sender];

        // assert positions limit is not reached
        if (depositor.positions.length == positionsLimit) {
            revert PositionsLimitReached();
        }

        // add splitted amounts to the queue
        globalInvestQueue.splitUserInvestmentAmount(amount, amountSplit);

        // if not started position with the same split exists - increase deposit amount
        for (uint256 i = 0; i < depositor.positions.length; i++) {
            // calculate amount of passed investment epochs
            uint256 passedInvestPeriods = (lastInvestmentTimestamp -
                depositor.positions[i].investedAt) / investmentPeriod;

            bool isInvestmentStarted = passedInvestPeriods != 0 ? true : false;
            if (
                !isInvestmentStarted ||
                depositor.positions[i].amountSplit == amountSplit
            ) {
                depositor.positions[i].depositAmount += amount;
                return;
            }
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
        nonEmergencyExited
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

            // nobody invested in the queue, just skip this period
            if (depositedAmount == 0) {
                continue;
            }

            // swap deposit amount into invest token
            uint256 receivedBluechip = _swapIntoBluechipAsset(depositedAmount);

            if (bluechipInvestmentState == BluechipInvestmentState.Investing) {
                // invest exchanged amount
                _invest(receivedBluechip);
            }

            // make historical gauge
            dcaHistory.addHistoricalGauge(depositedAmount, receivedBluechip);
        }

        if (bluechipInvestmentState == BluechipInvestmentState.Investing) {
            // claim rewards
            uint256 claimedBluechipRewards = _claimRewards();

            // if something was claimed invest rewards and increase current gauge
            if (claimedBluechipRewards > 0) {
                _invest(claimedBluechipRewards);
                dcaHistory.increaseCurrentGauge(claimedBluechipRewards);
            }
        }

        // update last invest timestamp
        lastInvestmentTimestamp += passedInvestPeriods * investmentPeriod;
    }

    function withdrawAll(bool convertBluechipIntoDepositAsset)
        public
        virtual
        nonReentrant
        emergencyWithdrawOnEmergencyExitedStatus(_msgSender())
    {
        _withdrawAll(_msgSender(), convertBluechipIntoDepositAsset);
    }

    function withdrawAllFor(
        address sender,
        bool convertBluechipIntoDepositAsset
    )
        public
        virtual
        onlyPortfolio
        nonReentrant
        emergencyWithdrawOnEmergencyExitedStatus(sender)
    {
        _withdrawAll(sender, convertBluechipIntoDepositAsset);
    }

    function _withdrawAll(address sender, bool convertBluechipIntoDepositAsset)
        private
    {
        uint256 notInvestedYet;
        uint256 investedIntoBluechip;

        DcaDepositor storage depositor = depositors[sender];
        for (uint256 i = 0; i < depositor.positions.length; i++) {
            (
                uint256 positionBluechipInvestment,
                uint256 positionNotInvestedYet
            ) = _computePositionWithdrawAll(depositor.positions[i]);

            investedIntoBluechip += positionBluechipInvestment;
            notInvestedYet += positionNotInvestedYet;
        }

        // since depositor withdraws everything
        // we can remove his data completely
        delete depositors[sender];

        // withdraw user deposit
        _withdrawDepositorInvestment(
            sender,
            notInvestedYet,
            investedIntoBluechip,
            convertBluechipIntoDepositAsset
        );
    }

    function withdrawAll(
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    )
        public
        virtual
        nonReentrant
        emergencyWithdrawOnEmergencyExitedStatus(_msgSender())
    {
        _withdrawAll(
            _msgSender(),
            positionIndex,
            convertBluechipIntoDepositAsset
        );
    }

    function withdrawAllFor(
        address sender,
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    )
        public
        virtual
        onlyPortfolio
        nonReentrant
        emergencyWithdrawOnEmergencyExitedStatus(sender)
    {
        _withdrawAll(sender, positionIndex, convertBluechipIntoDepositAsset);
    }

    function _withdrawAll(
        address sender,
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    ) private {
        DcaDepositor storage depositor = depositors[sender];

        (
            uint256 positionBluechipInvestment,
            uint256 positionNotInvestedYet
        ) = _computePositionWithdrawAll(depositor.positions[positionIndex]);

        // remove position from user data
        depositor.positions[positionIndex] = depositor.positions[
            depositor.positions.length - 1
        ];
        depositor.positions.pop();

        // withdraw user deposit
        _withdrawDepositorInvestment(
            sender,
            positionNotInvestedYet,
            positionBluechipInvestment,
            convertBluechipIntoDepositAsset
        );
    }

    function _computePositionWithdrawAll(Position memory position)
        private
        returns (uint256 investedIntoBluechip, uint256 notInvestedYet)
    {
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

        // if investment is not started yet we remove whole deposit token amount
        if (passedInvestPeriods == 0) {
            notInvestedYet += position.depositAmount;
        } else {
            // otherwise we need to additionally calculate bluechip investment
            (
                uint256 bluechipInvestment,
                uint256 depositAssetInvestment
            ) = _removeUserInvestmentFromHistory(
                    position,
                    passedInvestPeriods,
                    perPeriodInvestment
                );

            investedIntoBluechip += bluechipInvestment;
            notInvestedYet += position.depositAmount - depositAssetInvestment;
        }
    }

    function withdrawBluechip(bool convertBluechipIntoDepositAsset)
        public
        virtual
        nonReentrant
        emergencyWithdrawOnEmergencyExitedStatus(_msgSender())
    {
        _withdrawBluechip(_msgSender(), convertBluechipIntoDepositAsset);
    }

    function withdrawBluechipFor(
        address sender,
        bool convertBluechipIntoDepositAsset
    )
        public
        virtual
        onlyPortfolio
        nonReentrant
        emergencyWithdrawOnEmergencyExitedStatus(sender)
    {
        _withdrawBluechip(sender, convertBluechipIntoDepositAsset);
    }

    function _withdrawBluechip(
        address sender,
        bool convertBluechipIntoDepositAsset
    ) private {
        uint256 investedIntoBluechip;
        uint256 i = 0;

        DcaDepositor storage depositor = depositors[sender];

        // since we might remove position we use while loop to iterate over all positions
        while (i < depositor.positions.length) {
            (
                uint256 positionInvestedIntoBluechip,
                uint256 positionNotInvestedYet,
                uint8 newPositionSplit
            ) = _computePositionWithdrawBluechip(depositor.positions[i]);

            // investment not started yet, skip
            if (positionInvestedIntoBluechip == 0) {
                i++;
                continue;
            }

            investedIntoBluechip += positionInvestedIntoBluechip;
            _updateOrRemovePosition(
                depositor,
                i,
                positionNotInvestedYet,
                newPositionSplit
            );

            i++;
        }

        if (investedIntoBluechip == 0) {
            revert NothingToWithdraw();
        }

        // withdraw bluechip asset and transfer to depositor
        _withdrawDepositorInvestment(
            sender,
            0,
            investedIntoBluechip,
            convertBluechipIntoDepositAsset
        );
    }

    function withdrawBluechip(
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    )
        public
        virtual
        nonReentrant
        emergencyWithdrawOnEmergencyExitedStatus(_msgSender())
    {
        _withdrawBluechip(
            _msgSender(),
            positionIndex,
            convertBluechipIntoDepositAsset
        );
    }

    function withdrawBluechipFor(
        address sender,
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    )
        public
        virtual
        onlyPortfolio
        nonReentrant
        emergencyWithdrawOnEmergencyExitedStatus(sender)
    {
        _withdrawBluechip(
            sender,
            positionIndex,
            convertBluechipIntoDepositAsset
        );
    }

    function _withdrawBluechip(
        address sender,
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    ) private {
        DcaDepositor storage depositor = depositors[sender];

        (
            uint256 positionInvestedIntoBluechip,
            uint256 positionNotInvestedYet,
            uint8 newPositionSplit
        ) = _computePositionWithdrawBluechip(
                depositor.positions[positionIndex]
            );

        if (positionInvestedIntoBluechip == 0) {
            revert NothingToWithdraw();
        }

        _updateOrRemovePosition(
            depositor,
            positionIndex,
            positionNotInvestedYet,
            newPositionSplit
        );

        // withdraw bluechip asset and transfer to depositor
        _withdrawDepositorInvestment(
            sender,
            0,
            positionInvestedIntoBluechip,
            convertBluechipIntoDepositAsset
        );
    }

    function _computePositionWithdrawBluechip(Position memory position)
        private
        returns (
            uint256 investedIntoBluechip,
            uint256 notInvestedYet,
            uint8 newPositionSplit
        )
    {
        // calculate amount of passed investment epochs
        uint256 passedInvestPeriods = (lastInvestmentTimestamp -
            position.investedAt) / investmentPeriod;

        if (passedInvestPeriods != 0) {
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

            newPositionSplit =
                position.amountSplit -
                uint8(passedInvestPeriods);

            // remove not invested yet amount from invest queue
            globalInvestQueue.removeUserInvestment(
                perPeriodInvestment,
                newPositionSplit
            );

            investedIntoBluechip = bluechipInvestment;
            notInvestedYet = position.depositAmount - depositAssetInvestment;
        }
    }

    function withdrawBluechipFromPool() external onlyOwner {
        require(
            bluechipInvestmentState == BluechipInvestmentState.Investing,
            "Invalid investment state"
        );

        _withdrawInvestedBluechip(_totalBluechipInvested());
        bluechipInvestmentState = BluechipInvestmentState.Withdrawn;
    }

    function reInvestBluchipIntoPool() external onlyOwner {
        require(
            bluechipInvestmentState == BluechipInvestmentState.Withdrawn,
            "Invalid investment state"
        );

        _invest(_totalBluechipInvested());
        bluechipInvestmentState = BluechipInvestmentState.Investing;
    }

    function emergencyWithdrawIntoDepositAsset(
        TokenInfo calldata emergencyExitDepositToken_,
        address[] calldata depositSwapPath,
        TokenInfo calldata emergencyExitBluechipToken_,
        address[] calldata bluechipSwapPath
    ) external onlyOwner nonEmergencyExited {
        // if status Investing we should first withdraw bluechip from pool
        uint256 currentBluechipBalance;
        if (bluechipInvestmentState == BluechipInvestmentState.Investing) {
            currentBluechipBalance = _totalBluechipInvested();
            _withdrawInvestedBluechip(currentBluechipBalance);
        }

        // set status to withdrawn to refetch actual bluechip balance
        bluechipInvestmentState = BluechipInvestmentState.Withdrawn;
        currentBluechipBalance = _totalBluechipInvested();

        // store emergency exit token info
        emergencyExitDepositToken = emergencyExitDepositToken_;
        emergencyExitBluechipToken = emergencyExitBluechipToken_;

        // if deposit token != emergency exit token then swap it
        if (depositTokenInfo.token != emergencyExitDepositToken.token) {
            // swap deposit into emergency exit token
            uint256 depositTokenBalance = depositTokenInfo.token.balanceOf(
                address(this)
            );
            uint256 receivedEmergencyExitDepositAsset = router
                .swapTokensForTokens(depositTokenBalance, depositSwapPath);

            // store token price for future conversions
            emergencySellDepositPrice =
                (_scaleAmount(
                    receivedEmergencyExitDepositAsset,
                    emergencyExitDepositToken.decimals,
                    depositTokenInfo.decimals
                ) * depositTokenScale) /
                depositTokenBalance;
        }

        // if bluechip token != emergency exit token then swap it
        if (_bluechipAddress() != address(emergencyExitBluechipToken.token)) {
            // swap bluechip into emergency exit token
            uint256 receivedEmergencyExitBluechipAsset = router
                .swapTokensForTokens(currentBluechipBalance, bluechipSwapPath);

            // store token price for future conversions
            emergencySellBluechipPrice =
                (_scaleAmount(
                    receivedEmergencyExitBluechipAsset,
                    emergencyExitBluechipToken.decimals,
                    _bluechipDecimals()
                ) * _bluechipTokenScale()) /
                currentBluechipBalance;
        }

        // set proper strategy state
        bluechipInvestmentState = BluechipInvestmentState.EmergencyExited;
    }

    function _emergencyWithdrawUserDeposit(address sender) private {
        uint256 notInvestedYet;
        uint256 investedIntoBluechip;

        DcaDepositor storage depositor = depositors[sender];
        for (uint256 i = 0; i < depositor.positions.length; i++) {
            (
                uint256 positionBluechipInvestment,
                uint256 positionNotInvestedYet
            ) = _computePositionWithdrawAll(depositor.positions[i]);

            investedIntoBluechip += positionBluechipInvestment;
            notInvestedYet += positionNotInvestedYet;
        }

        // since depositor withdraws everything
        // we can remove his data completely
        delete depositors[sender];

        // if deposit token != emergency exit token compute share
        if (depositTokenInfo.token != emergencyExitDepositToken.token) {
            uint256 convertedDepositShare = (notInvestedYet *
                emergencySellDepositPrice) / depositTokenScale;

            if (convertedDepositShare != 0) {
                emergencyExitDepositToken.token.safeTransfer(
                    sender,
                    convertedDepositShare
                );
            }
        } else {
            // otherwise send deposit token
            if (notInvestedYet != 0) {
                depositTokenInfo.token.safeTransfer(sender, notInvestedYet);
            }
        }

        // if bluechip != emergency exit token compute share
        if (_bluechipAddress() != address(emergencyExitBluechipToken.token)) {
            uint256 convertedBluechipShare = (investedIntoBluechip *
                emergencySellBluechipPrice) / _bluechipTokenScale();

            if (convertedBluechipShare != 0) {
                emergencyExitBluechipToken.token.safeTransfer(
                    sender,
                    convertedBluechipShare
                );
            }
        } else {
            // otherwise send bluechip token
            if (investedIntoBluechip != 0) {
                _transferBluechip(sender, investedIntoBluechip);
            }
        }
    }

    // ----- Base Class Setters -----
    function addPortfolio(address newPortfolio) public virtual onlyOwner {
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == newPortfolio) {
                revert PortfolioAlreadyWhitelisted();
            }
        }

        portfolios.push(newPortfolio);
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
        return _getPassedInvestPeriods() > 0 && !isEmergencyExited();
    }

    function depositorInfo(address depositor)
        public
        view
        virtual
        returns (DcaDepositor memory)
    {
        return depositors[depositor];
    }

    function isEmergencyExited() public view virtual returns (bool) {
        return
            bluechipInvestmentState == BluechipInvestmentState.EmergencyExited;
    }

    function depositToken() public view returns (IERC20Upgradeable) {
        return depositTokenInfo.token;
    }

    // ----- Private Base Class Helper Functions -----
    function _takeFee(uint256 amount) private returns (uint256 actualDeposit) {
        // if fee is set to 0 then skip it
        if (depositFee.fee == 0) {
            return amount;
        }

        // actual deposit = amount * (100% - fee%)
        actualDeposit = (amount * (100 - depositFee.fee)) / 100;

        uint256 feeAmount = amount - actualDeposit;
        if (feeAmount != 0) {
            depositTokenInfo.token.safeTransfer(
                depositFee.feeReceiver,
                feeAmount
            );
        }
    }

    function _swapIntoBluechipAsset(uint256 amountIn)
        private
        returns (uint256)
    {
        return router.swapTokensForTokens(amountIn, depositToBluechipSwapPath);
    }

    function _swapIntoDepositAsset(uint256 amountIn) private returns (uint256) {
        return router.swapTokensForTokens(amountIn, bluechipToDepositSwapPath);
    }

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

    function _withdrawDepositorInvestment(
        address sender,
        uint256 depositAssetAmount,
        uint256 bluechipAssetAmount,
        bool convertBluechipIntoDepositAsset
    ) private {
        // if state is Withdrawn then bluechip is already on the contract balance
        if (bluechipInvestmentState == BluechipInvestmentState.Investing) {
            _withdrawInvestedBluechip(bluechipAssetAmount);
        }

        // if convertion requested swap bluechip -> deposit asset
        if (convertBluechipIntoDepositAsset) {
            depositAssetAmount += _swapIntoDepositAsset(bluechipAssetAmount);
            bluechipAssetAmount = 0;
        }

        if (depositAssetAmount != 0) {
            depositTokenInfo.token.safeTransfer(sender, depositAssetAmount);
        }

        if (bluechipAssetAmount != 0) {
            _transferBluechip(sender, bluechipAssetAmount);
        }
    }

    function _bluechipTokenScale() private view returns (uint256) {
        return 10**_bluechipDecimals();
    }

    function _scaleAmount(
        uint256 amount,
        uint8 decimals,
        uint8 scaleToDecimals
    ) internal pure returns (uint256) {
        if (decimals < scaleToDecimals) {
            return amount * uint256(10**uint256(scaleToDecimals - decimals));
        } else if (decimals > scaleToDecimals) {
            return amount / uint256(10**uint256(decimals - scaleToDecimals));
        }
        return amount;
    }

    // ----- Functions For Child Contract -----
    function _invest(uint256 amount) internal virtual;

    function _claimRewards() internal virtual returns (uint256);

    function _withdrawInvestedBluechip(uint256 amount) internal virtual;

    function _transferBluechip(address to, uint256 amount) internal virtual;

    function _totalBluechipInvested() internal view virtual returns (uint256);

    function _bluechipAddress() internal view virtual returns (address);

    function _bluechipDecimals() internal view virtual returns (uint8);
}
