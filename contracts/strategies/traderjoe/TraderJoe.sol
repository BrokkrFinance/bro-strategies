// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./TraderJoeStorageLib.sol";
import "../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../../common/libraries/SwapServiceLib.sol";
import "../../dependencies/traderjoe/ITraderJoeLBPair.sol";
import "../../dependencies/traderjoe/ITraderJoeLBRouter.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TraderJoe is UUPSUpgradeable, StrategyOwnablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidTraderJoeLBPair();
    error TooBigValuationLoss();

    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName =
        "brokkr.traderjoe_strategy.traderjoe_strategy_v1.2.1";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "TraderJoe Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.2.1";

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
        uint256[] calldata binAllocations
    ) external initializer {
        __checkBinIdsAndAllocations(binIds, binAllocations);

        __UUPSUpgradeable_init();
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);

        __initialize(lbPair, lbRouter, binStep, binIds, binAllocations);
    }

    function reinitialize(
        ITraderJoeLBPair lbPair,
        ITraderJoeLBRouter lbRouter,
        uint256 binStep,
        uint256[] calldata binIds,
        uint256[] calldata binAllocations,
        uint256 mimValuation
    ) external reinitializer(2) {
        __checkBinIdsAndAllocations(binIds, binAllocations);

        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        // Initialization.
        __initialize(lbPair, lbRouter, binStep, binIds, binAllocations);

        // Use V2 router to swap.
        setSwapService(SwapServiceProvider.TraderJoeV2, address(lbRouter));

        // Migration from V1 to V2 consists of three steps.
        // 0. Withdraw all depositToken and pairDepositToken from V1.
        // 1. Deposit all withdrawn depositToken and pairDepositToken into V2.
        // 2. Check if valuation after migration is greater than or equal to minValuation.

        // 0. Withdraw all depositToken and pairDepositToken from V1.
        uint256 depositTokenBefore = depositToken.balanceOf(address(this));
        uint256 pairDepositTokenBefore = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        uint256 lpBalanceToWithdraw = strategyStorage
            .masterChef
            .userInfo(strategyStorage.farmId, address(this))
            .amount;

        strategyStorage.masterChef.withdraw(
            strategyStorage.farmId,
            lpBalanceToWithdraw
        );

        strategyStorage.lpToken.approve(
            address(strategyStorage.router),
            lpBalanceToWithdraw
        );

        strategyStorage.router.removeLiquidity(
            address(strategyStorage.pairDepositToken),
            address(depositToken),
            lpBalanceToWithdraw,
            0,
            0,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );

        uint256 depositTokenAfter = depositToken.balanceOf(address(this));
        uint256 pairDepositTokenAfter = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        // 1. Deposit all withdrawn depositToken and pairDepositToken into V2.
        uint256 depositTokenIncrement = depositTokenAfter - depositTokenBefore;
        uint256 pairDepositTokenIncrement = pairDepositTokenAfter -
            pairDepositTokenBefore;

        __deposit(depositTokenIncrement, pairDepositTokenIncrement);

        // 2. Check if valuation after migration is greater than or equal to minValuation.
        Valuation[] memory assetValuations = _getAssetValuations(true, false);
        uint256 valuationsAmount = assetValuations.length;
        uint256 valuation;

        for (uint256 i; i < valuationsAmount; i++) {
            valuation += assetValuations[i].valuation;
        }

        if (valuation < mimValuation) {
            revert TooBigValuationLoss();
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _deposit(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        __deposit(amount, 0);
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        // Withdraw.
        uint256 pairdepositTokenBefore = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        __withdraw(amount);

        uint256 pairDepositTokenAfter = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        // Swap withdrawn pairDepositToken to depositToken.
        uint256 pairDepositTokenIncrement = pairDepositTokenAfter -
            pairdepositTokenBefore;

        __swapTokens(
            pairDepositTokenIncrement,
            strategyStorage.pairDepositToken,
            depositToken
        );
    }

    function _reapReward(NameValuePair[] calldata) internal virtual override {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        uint256 pairdepositTokenBefore = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        strategyStorage.lbPair.collectFees(
            address(this),
            strategyStorage.binIds
        );

        uint256 pairDepositTokenAfter = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        uint256 pairDepositTokenIncrement = pairDepositTokenAfter -
            pairdepositTokenBefore;

        __swapTokens(
            pairDepositTokenIncrement,
            strategyStorage.pairDepositToken,
            depositToken
        );
    }

    function _getAssetBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        uint256 binsAmount = strategyStorage.binIds.length;
        assetBalances = new Balance[](binsAmount);

        for (uint256 i; i < binsAmount; ++i) {
            uint256 balance = strategyStorage.lbPair.balanceOf(
                address(this),
                strategyStorage.binIds[i]
            );

            assetBalances[i] = Balance(
                address(strategyStorage.lbPair),
                balance
            );
        }
    }

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
    {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        uint256 binsAmount = strategyStorage.binIds.length;
        assetValuations = new Valuation[](binsAmount);

        for (uint256 i; i < binsAmount; ++i) {
            uint256 lpTokenBalance = strategyStorage.lbPair.balanceOf(
                address(this),
                strategyStorage.binIds[i]
            );

            (uint256 reserveX, uint256 reserveY) = strategyStorage
                .lbPair
                .getBin(uint24(strategyStorage.binIds[i]));

            uint256 totalSupply = strategyStorage.lbPair.totalSupply(
                strategyStorage.binIds[i]
            );

            // Assume that USDC.e price equals to USDC price.
            uint256 valuation = (lpTokenBalance * (reserveX + reserveY)) /
                totalSupply;

            assetValuations[i] = Valuation(
                address(strategyStorage.lbPair),
                valuation
            );
        }
    }

    function _getLiabilityValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory)
    {}

    function adjustBins(
        uint256[] calldata binIds,
        uint256[] calldata binAllocations
    ) public onlyOwner {
        __checkBinIdsAndAllocations(binIds, binAllocations);

        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        // Withdraw from all bins.
        uint256 depositTokenBefore = depositToken.balanceOf(address(this));

        __withdraw(getInvestmentTokenSupply());

        uint256 depositTokenAfter = depositToken.balanceOf(address(this));

        // Set bin IDs and allocations to the given ones.
        strategyStorage.binIds = binIds;
        strategyStorage.binAllocations = binAllocations;

        // Deposit into the new bins with the new allocations.
        uint256 depositTokenIncrement = depositTokenAfter - depositTokenBefore;

        __deposit(depositTokenIncrement, 0);
    }

    function __checkBinIdsAndAllocations(
        uint256[] calldata binIds,
        uint256[] calldata binAllocations
    ) private pure {
        uint256 binsAmount = binIds.length;
        uint256 allocationsAmount = binAllocations.length;
        // solhint-disable-next-line reason-string
        require(
            binsAmount == allocationsAmount,
            "TraderJoe: the number of bin IDs and allocations are different"
        );

        // solhint-disable-next-line reason-string
        require(
            binsAmount >= 1 && binsAmount <= 51,
            "TraderJoe: too few or too many bin ID"
        );
        // No need to check the number of allocations.

        uint256 allocations;

        for (uint256 i; i < binsAmount; i++) {
            require(binIds[i] <= type(uint24).max, "TraderJoe: too big bin ID");
            allocations += binAllocations[i];
        }

        // solhint-disable-next-line reason-string
        require(
            allocations == 1e3,
            "TraderJoe: the sum of allocations must be 1e3"
        );
    }

    function __initialize(
        ITraderJoeLBPair lbPair,
        ITraderJoeLBRouter lbRouter,
        uint256 binStep,
        uint256[] calldata binIds,
        uint256[] calldata binAllocations
    ) private {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        strategyStorage.lbPair = lbPair;
        strategyStorage.lbRouter = lbRouter;
        strategyStorage.tokenX = IERC20Upgradeable(lbPair.tokenX());
        strategyStorage.tokenY = IERC20Upgradeable(lbPair.tokenY());
        strategyStorage.binStep = binStep;
        strategyStorage.binIds = binIds;
        strategyStorage.binAllocations = binAllocations;

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

    function __deposit(
        uint256 depositTokenAmount,
        uint256 pairDepositTokenAmount
    ) private {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        uint256 pairDepositTokenBefore = strategyStorage
            .pairDepositToken
            .balanceOf(address(this)) - pairDepositTokenAmount;

        uint256 amountXIn;
        uint256 amountYIn;

        if (strategyStorage.tokenX == depositToken) {
            amountXIn = depositTokenAmount;
            amountYIn = pairDepositTokenAmount;
        } else {
            amountXIn = pairDepositTokenAmount;
            amountYIn = depositTokenAmount;
        }

        uint256 binsAmount = strategyStorage.binIds.length;

        (, , uint256 activeId) = strategyStorage.lbPair.getReservesAndId();

        // Assume that USDC.e price equals to USDC price.
        uint256 totalAmount = amountXIn + amountYIn;
        uint256 amountX;
        uint256 amountY;

        // Distributions.
        uint256[] memory distributionX = new uint256[](binsAmount);
        uint256[] memory distributionY = new uint256[](binsAmount);

        for (uint256 i; i < binsAmount; ++i) {
            // Bin allocation has precision of 1e3.
            uint256 amount = (totalAmount * strategyStorage.binAllocations[i]) /
                1e3;

            if (strategyStorage.binIds[i] <= activeId) {
                distributionY[i] = amount;
                amountY += amount;
            } else if (strategyStorage.binIds[i] > activeId) {
                distributionX[i] = amount;
                amountX += amount;
            }
        }

        for (uint256 i; i < binsAmount; ++i) {
            // TraderJoe V2 has precision of 1e18. Calibrate distributions so that the sum of them equals to 1e18.
            if (strategyStorage.binIds[i] <= activeId) {
                distributionY[i] = (distributionY[i] * 1e18) / amountY;
            } else if (strategyStorage.binIds[i] > activeId) {
                distributionX[i] = (distributionX[i] * 1e18) / amountX;
            }
        }

        // Swap only as much as is needed.
        if (amountXIn > amountX) {
            amountY =
                amountYIn +
                __swapTokens(
                    amountXIn - amountX,
                    strategyStorage.tokenX,
                    strategyStorage.tokenY
                );
        } else if (amountYIn > amountY) {
            amountX =
                amountXIn +
                __swapTokens(
                    amountYIn - amountY,
                    strategyStorage.tokenY,
                    strategyStorage.tokenX
                );
        }

        // Delta IDs.
        int256[] memory deltaIds = new int256[](binsAmount);

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

        uint256 pairDepositTokenAfter = strategyStorage
            .pairDepositToken
            .balanceOf(address(this));

        uint256 pairDepositTokenIncrement = pairDepositTokenAfter -
            pairDepositTokenBefore;

        // Swap back remaining pairDepositToken to depositToken if possible.
        __swapBack(pairDepositTokenIncrement);
    }

    function __withdraw(uint256 amount) private {
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
    }

    function __swapTokens(
        uint256 amountIn,
        IERC20Upgradeable tokenIn,
        IERC20Upgradeable tokenOut
    ) private returns (uint256 amountOut) {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        address[] memory path = new address[](2);
        path[0] = address(tokenIn);
        path[1] = address(tokenOut);

        uint256[] memory binSteps = new uint256[](1);
        binSteps[0] = strategyStorage.binStep;

        amountOut = SwapServiceLib.swapExactTokensForTokens(
            swapService,
            amountIn,
            0,
            path,
            binSteps
        );
    }

    function __swapBack(uint256 amountIn) private {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        address[] memory path = new address[](2);
        path[0] = address(strategyStorage.pairDepositToken);
        path[1] = address(depositToken);
        uint256[] memory binSteps = new uint256[](1);
        binSteps[0] = strategyStorage.binStep;

        try
            strategyStorage.lbRouter.swapExactTokensForTokens(
                amountIn,
                0,
                binSteps,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )
        returns (uint256) {} catch {}
    }
}
