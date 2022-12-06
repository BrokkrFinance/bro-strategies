// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./TraderJoeStorageLib.sol";
import "../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../../common/libraries/SwapServiceLib.sol";
import "../../dependencies/traderjoe/ITraderJoeLBPair.sol";
import "../../dependencies/traderjoe/ITraderJoeLBRouter.sol";
import "../../dependencies/traderjoe/ITraderJoeMasterChef.sol";
import "../../dependencies/traderjoe/ITraderJoeRouter.sol";
import "../../dependencies/traderjoe/ITraderJoePair.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TraderJoe is UUPSUpgradeable, StrategyOwnablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidTraderJoeLBPair();

    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName =
        "brokkr.traderjoe_strategy.traderjoe_strategy_v1.1.1";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "TraderJoe Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.1.1";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        ITraderJoeLBPair lbPair,
        ITraderJoeLBRouter lbRouter,
        uint256 binStep,
        uint256[] calldata binIds,
        uint256[] calldata binAllocationsX,
        uint256[] calldata binAllocationsY
    ) external initializer {
        __UUPSUpgradeable_init();
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);

        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        strategyStorage.lbPair = lbPair;
        strategyStorage.lbRouter = lbRouter;
        strategyStorage.tokenX = IERC20Upgradeable(lbPair.tokenX());
        strategyStorage.tokenY = IERC20Upgradeable(lbPair.tokenY());
        strategyStorage.binStep = binStep;
        strategyStorage.binIds = binIds;
        strategyStorage.binAllocationsX = binAllocationsX;
        strategyStorage.binAllocationsY = binAllocationsY;

        if (strategyStorage.tokenX == depositToken) {
            strategyStorage.pairDepositToken = IERC20Upgradeable(
                strategyStorage.tokenY
            );
        } else if (strategyStorage.tokenY == depositToken) {
            strategyStorage.pairDepositToken = IERC20Upgradeable(
                strategyStorage.tokenX
            );
        } else {
            revert InvalidTraderJoeLBPair();
        }
    }

    function reinitialize(
        ITraderJoeLBPair lbPair,
        ITraderJoeLBRouter lbRouter,
        uint256 binStep,
        uint256[] calldata binIds,
        uint256[] calldata binAllocationsX,
        uint256[] calldata binAllocationsY,
        NameValuePair[] calldata params
    ) external reinitializer(2) {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        // Initialization.
        strategyStorage.lbPair = lbPair;
        strategyStorage.lbRouter = lbRouter;
        strategyStorage.tokenX = IERC20Upgradeable(lbPair.tokenX());
        strategyStorage.tokenY = IERC20Upgradeable(lbPair.tokenY());
        strategyStorage.binStep = binStep;
        strategyStorage.binIds = binIds;
        strategyStorage.binAllocationsX = binAllocationsX;
        strategyStorage.binAllocationsY = binAllocationsY;

        if (strategyStorage.tokenX == depositToken) {
            strategyStorage.pairDepositToken = IERC20Upgradeable(
                strategyStorage.tokenY
            );
        } else if (strategyStorage.tokenY == depositToken) {
            strategyStorage.pairDepositToken = IERC20Upgradeable(
                strategyStorage.tokenX
            );
        } else {
            revert InvalidTraderJoeLBPair();
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _deposit(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        // Swap half of depositToken to pairDepositToken.
        uint256 swapAmount = amount / 2;
        address[] memory path = new address[](2);
        path[0] = address(depositToken);
        path[1] = address(strategyStorage.pairDepositToken);

        uint256 pairDepositTokenAmount = SwapServiceLib
            .swapExactTokensForTokens(swapService, swapAmount, 0, path);
        uint256 depositTokenAmount = amount - swapAmount;

        uint256 amountX;
        uint256 amountY;
        if (strategyStorage.tokenX == depositToken) {
            amountX = depositTokenAmount;
            amountY = pairDepositTokenAmount;
        } else {
            amountX = pairDepositTokenAmount;
            amountY = depositTokenAmount;
        }

        // Prepare params.
        uint256 binsAmount = strategyStorage.binIds.length;
        uint256[] memory distributionX = new uint256[](binsAmount);
        uint256[] memory distributionY = new uint256[](binsAmount);

        for (uint256 i; i < binsAmount; ++i) {
            // Bin allocation has precision of 1e3 and TraderJoe V2 has 1e18.
            distributionX[i] = strategyStorage.binAllocationsX[i] * 1e15;
            distributionY[i] = strategyStorage.binAllocationsY[i] * 1e15;
        }

        int256[] memory deltaIds = new int256[](binsAmount);
        (, , uint256 activeId) = strategyStorage.lbPair.getReservesAndId();

        for (uint256 i; i < binsAmount; ++i) {
            deltaIds[i] = int256(strategyStorage.binIds[i]) - int256(activeId);
        }

        // Deposit.
        ITraderJoeLBRouter.LiquidityParameters memory liquidityParameters = ITraderJoeLBRouter
            .LiquidityParameters(
                address(strategyStorage.tokenX),
                address(strategyStorage.tokenY),
                strategyStorage.binStep,
                amountX,
                amountY,
                0, // Base contracts take care of min amount.
                0, // Base contracts take care of min amount.
                activeId,
                0,
                deltaIds,
                distributionX,
                distributionY,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            );

        strategyStorage.tokenX.approve(
            address(strategyStorage.lbRouter),
            amountX
        );
        strategyStorage.tokenY.approve(
            address(strategyStorage.lbRouter),
            amountY
        );

        strategyStorage.lbRouter.addLiquidity(liquidityParameters);

        // Since the amount of remaining pairDepositToken is nearly zero, skip swapping it back to depositToken.
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        // Calculate LP token balance to withdraw per bin.
        uint256 binsAmount = strategyStorage.binIds.length;
        uint256[] memory amounts = new uint256[](binsAmount);
        uint256 investmentTokenSupply = getInvestmentTokenSupply();

        for (uint256 i; i < binsAmount; ++i) {
            uint256 lpTokenBalance = strategyStorage.lbPair.balanceOf(
                address(this),
                strategyStorage.binIds[i]
            );

            amounts[i] = (lpTokenBalance * amount) / investmentTokenSupply;
        }

        // Withdraw.
        uint256 pairdepositTokenBefore = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        strategyStorage.lbPair.setApprovalForAll(
            address(strategyStorage.lbRouter),
            true
        );

        strategyStorage.lbRouter.removeLiquidity(
            address(strategyStorage.tokenX),
            address(strategyStorage.tokenY),
            uint16(strategyStorage.binStep),
            0, // Base contracts take care of min amount.
            0, // Base contracts take care of min amount.
            strategyStorage.binIds,
            amounts,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );

        uint256 pairDepositTokenAfter = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        // Swap withdrawn pairDepositToken to depositToken.
        uint256 pairDepositIncrement = pairDepositTokenAfter -
            pairdepositTokenBefore;

        address[] memory path = new address[](2);
        path[0] = address(strategyStorage.pairDepositToken);
        path[1] = address(depositToken);

        SwapServiceLib.swapExactTokensForTokens(
            swapService,
            pairDepositIncrement,
            0,
            path
        );
    }

    function _reapReward(NameValuePair[] calldata) internal virtual override {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        strategyStorage.lbPair.collectFees(
            address(this),
            strategyStorage.binIds
        );

        address[] memory path = new address[](2);
        path[0] = address(strategyStorage.pairDepositToken);
        path[1] = address(depositToken);

        SwapServiceLib.swapExactTokensForTokens(
            swapService,
            strategyStorage.pairDepositToken.balanceOf(address(this)),
            0,
            path
        );
    }

    function _getAssetBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {}

    function _getLiabilityBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory)
    {}

    function _getAssetValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory assetValuations)
    {}

    function _getLiabilityValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory)
    {}
}
