//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { DCABaseUpgradeable } from "../base/DCABaseUpgradeable.sol";
import { IAltPool } from "../../../dependencies/platypus/IAltPool.sol";
import { IMasterPlatypusV4 } from "../../../dependencies/platypus/IMasterPlatypusV4.sol";
import { SwapLib } from "../libraries/SwapLib.sol";
import { InvestableLib } from "../../../common/libraries/InvestableLib.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract WBTCBluechip is UUPSUpgradeable, DCABaseUpgradeable {
    using SwapLib for SwapLib.Router;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct PlatypusInfo {
        IAltPool altPoolBTC;
        IMasterPlatypusV4 masterPlatypusV4;
        IERC20Upgradeable altBtcLpToken;
        IERC20Upgradeable platypusToken;
        uint256 poolId;
    }

    TokenInfo public bluechipTokenInfo;

    PlatypusInfo public platypusInfo;

    address[] public ptpIntoBluechipSwapPath;
    address[] public avaxIntoBluechipSwapPath;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        DcaStrategyInitArgs calldata args,
        TokenInfo calldata bluechipTokenInfo_,
        PlatypusInfo calldata platypusInfo_,
        address[] calldata ptpIntoBluechipSwapPath_,
        address[] calldata avaxIntoBluechipSwapPath_
    ) external initializer {
        __UUPSUpgradeable_init();
        __DCABaseUpgradeable_init(args);

        setBluechipTokenInfo(bluechipTokenInfo_);
        setPlatypusInfo(platypusInfo_);
        _setRewardsSwapPath(
            ptpIntoBluechipSwapPath_,
            avaxIntoBluechipSwapPath_
        );
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // ----- Setter Functions -----
    function setBluechipTokenInfo(TokenInfo memory newBluechipTokenInfo)
        private
    {
        require(
            address(newBluechipTokenInfo.token) != address(0),
            "Invalid bluechip token address"
        );
        bluechipTokenInfo = newBluechipTokenInfo;
    }

    function setPlatypusInfo(PlatypusInfo memory newPlatypusInfo) private {
        require(
            address(newPlatypusInfo.altPoolBTC) != address(0) &&
                address(newPlatypusInfo.masterPlatypusV4) != address(0) &&
                address(newPlatypusInfo.altBtcLpToken) != address(0) &&
                address(newPlatypusInfo.platypusToken) != address(0),
            "Invalid Platypus info"
        );
        platypusInfo = newPlatypusInfo;
    }

    function setRewardsSwapPath(
        address[] memory newPtpIntoAvaxSwapPath,
        address[] memory newAvaxIntoBluechipSwapPath
    ) external onlyOwner {
        _setRewardsSwapPath(
            newPtpIntoAvaxSwapPath,
            newAvaxIntoBluechipSwapPath
        );
    }

    function _setRewardsSwapPath(
        address[] memory newPtpIntoAvaxSwapPath,
        address[] memory newAvaxIntoBluechipSwapPath
    ) private {
        require(
            newPtpIntoAvaxSwapPath[0] == address(platypusInfo.platypusToken) &&
                newPtpIntoAvaxSwapPath[newPtpIntoAvaxSwapPath.length - 1] ==
                address(bluechipTokenInfo.token) &&
                newAvaxIntoBluechipSwapPath[0] == InvestableLib.WAVAX &&
                newAvaxIntoBluechipSwapPath[
                    newAvaxIntoBluechipSwapPath.length - 1
                ] ==
                address(bluechipTokenInfo.token),
            "Invalid swap path"
        );

        ptpIntoBluechipSwapPath = newPtpIntoAvaxSwapPath;
        avaxIntoBluechipSwapPath = newAvaxIntoBluechipSwapPath;
    }

    // ----- Base Contract Overrides -----
    function _invest(uint256 amount)
        internal
        virtual
        override
        returns (uint256 receivedAltLp)
    {
        // 1. Approve bluechip to alt pool
        bluechipTokenInfo.token.safeIncreaseAllowance(
            address(platypusInfo.altPoolBTC),
            amount
        );

        // 2. Deposit bluechip into alt pool. Receive minted alt pool lp token
        receivedAltLp = platypusInfo.altPoolBTC.deposit(
            address(bluechipTokenInfo.token),
            amount,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );

        // 3. Approve alt lp token to master platypus
        platypusInfo.altBtcLpToken.safeIncreaseAllowance(
            address(platypusInfo.masterPlatypusV4),
            receivedAltLp
        );

        // 4. Deposit alt lp into master platypus
        platypusInfo.masterPlatypusV4.deposit(
            platypusInfo.poolId,
            receivedAltLp
        );
    }

    function _claimRewards() internal virtual override returns (uint256) {
        // fetch earned rewards
        (
            uint256 pendingPtp,
            ,
            ,
            uint256[] memory pendingBonusTokens
        ) = platypusInfo.masterPlatypusV4.pendingTokens(
                platypusInfo.poolId,
                address(this)
            );

        // check if we can claim something
        if (pendingPtp == 0 && pendingBonusTokens[0] == 0) {
            return 0;
        }

        uint256[] memory pids = new uint256[](1);
        pids[0] = platypusInfo.poolId;

        // 1. Claim rewards from master platypus
        platypusInfo.masterPlatypusV4.multiClaim(pids);

        // 2. Receive native avax + ptp token rewards
        uint256 receivedPtp = platypusInfo.platypusToken.balanceOf(
            address(this)
        );

        // 3. Swap received rewawrds into bluechip
        return _swapRewards(receivedPtp);
    }

    function _withdrawInvestedBluechip(uint256 amount)
        internal
        virtual
        override
        returns (uint256 receivedBluechip)
    {
        // 1. Unstake alp lp from master platypus
        platypusInfo.masterPlatypusV4.withdraw(platypusInfo.poolId, amount);

        // 2. Approve alt lp to alt pool btc
        platypusInfo.altBtcLpToken.safeIncreaseAllowance(
            address(platypusInfo.altPoolBTC),
            amount
        );

        // 3. Withdraw bluechip from alt pool btc
        receivedBluechip = platypusInfo.altPoolBTC.withdraw(
            address(bluechipTokenInfo.token),
            amount,
            0,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );
    }

    function _transferBluechip(address to, uint256 amount)
        internal
        virtual
        override
    {
        bluechipTokenInfo.token.safeTransfer(to, amount);
    }

    function _totalBluechipInvested()
        internal
        view
        virtual
        override
        returns (uint256)
    {
        if (bluechipInvestmentState == BluechipInvestmentState.Investing) {
            // in case of investing all bluechip funds are invested into master platypus
            return
                platypusInfo
                    .masterPlatypusV4
                    .getUserInfo(platypusInfo.poolId, address(this))
                    .amount;
        }

        if (bluechipInvestmentState == BluechipInvestmentState.Withdrawn) {
            // in case of withdrawn all bluechip is hodling on contract balance
            return bluechipTokenInfo.token.balanceOf(address(this));
        }

        // When emergency exit was triggered the strategy
        // no longer holds any bluechip asset
        return 0;
    }

    function _bluechipAddress()
        internal
        view
        virtual
        override
        returns (address)
    {
        return address(bluechipTokenInfo.token);
    }

    function _bluechipDecimals()
        internal
        view
        virtual
        override
        returns (uint8)
    {
        return bluechipTokenInfo.decimals;
    }

    // ----- Private Helper Functions -----
    function _swapRewards(uint256 ptpReward)
        private
        returns (uint256 receivedBleuchip)
    {
        uint256 ptpToBluechip = router.getAmountOut(
            ptpReward,
            ptpIntoBluechipSwapPath
        );
        if (ptpToBluechip > 0) {
            receivedBleuchip += router.swapTokensForTokens(
                ptpReward,
                ptpIntoBluechipSwapPath
            );
        }

        uint256 avaxToBluechip = router.getAmountOut(
            address(this).balance,
            avaxIntoBluechipSwapPath
        );
        if (avaxToBluechip > 0) {
            receivedBleuchip += router.swapAvaxForTokens(
                address(this).balance,
                avaxIntoBluechipSwapPath
            );
        }
    }
}
