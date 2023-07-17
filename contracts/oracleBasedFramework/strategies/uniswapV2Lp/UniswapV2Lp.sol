// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { UniswapV2LpStorage, UniswapV2LpStorageLib } from "./UniswapV2LpStorageLib.sol";
import { StrategyRoleablePausableBaseUpgradeable } from "../../bases/strategy/StrategyRoleablePausableBaseUpgradeable.sol";
import { SwapServiceLib } from "../../libraries/SwapServiceLib.sol";
import { IUniswapV2Router } from "../../../dependencies/uniswapV2/IUniswapV2Router.sol";
import { IUniswapV2Factory } from "../../../dependencies/uniswapV2/IUniswapV2Factory.sol";
import { IUniswapV2Pair } from "../../../dependencies/uniswapV2/IUniswapV2Pair.sol";
import { IInvestmentToken } from "../../interfaces/IInvestmentToken.sol";
import { Balance, Valuation } from "../../interfaces/IAum.sol";
import { StrategyArgs } from "../../bases/strategy/StrategyBaseUpgradeable.sol";
import { SwapDetailsManagement, SwapDetail } from "../../bases/SwapDetailsManagement.sol";
import { GOVERNOR_ROLE } from "../../bases/RoleableUpgradeable.sol";
import { NameValuePair } from "../../Common.sol";

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

abstract contract UniswapV2Lp is
    UUPSUpgradeable,
    StrategyRoleablePausableBaseUpgradeable,
    SwapDetailsManagement
{
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidTokenPair();

    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName =
        "brokkr.uniswap_v2_lp.uniswap_v2_lp_v1.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "UniswapV2Lp Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        IUniswapV2Router router,
        IERC20Upgradeable token0,
        IERC20Upgradeable token1
    ) external initializer {
        __UUPSUpgradeable_init();
        __StrategyRoleablePausableBaseUpgradeable_init(strategyArgs);

        UniswapV2LpStorage storage strategyStorage = UniswapV2LpStorageLib
            .getStorage();

        // consulting the factory to get the token pair
        IUniswapV2Factory factory = IUniswapV2Factory(router.factory());
        (token0, token1) = token0 < token1
            ? (token0, token1)
            : (token1, token0);
        IUniswapV2Pair tokenPair = IUniswapV2Pair(
            factory.getPair(address(token0), address(token1))
        );
        if (address(tokenPair) == address(0x0)) revert InvalidTokenPair();

        // storing storage variables
        strategyStorage.router = router;
        strategyStorage.token0 = token0;
        strategyStorage.token1 = token1;
        strategyStorage.tokenPair = tokenPair;
    }

    function _authorizeUpgrade(address)
        internal
        override
        onlyRole(GOVERNOR_ROLE)
    {}

    function swapExactDepositTokenToTargetToken(
        uint256 swapAmount,
        IERC20Upgradeable targetToken
    ) internal returns (uint256 targetTokenObtainedAmount) {
        if (targetToken != depositToken) {
            SwapDetail storage swapDetail = swapDetails[targetToken];

            targetTokenObtainedAmount = SwapServiceLib
                .swapExactTokensForTokensExtWrapper(
                    swapLibAddress,
                    swapDetail.swapService,
                    swapAmount,
                    0,
                    swapDetail.reversePath,
                    swapDetail.data
                );
        } else targetTokenObtainedAmount = swapAmount;
    }

    function swapExactTargetTokenToDepositToken(
        uint256 tokenObtainedAmount,
        IERC20Upgradeable sourceToken
    ) internal {
        if ((sourceToken != depositToken) && (tokenObtainedAmount > 0)) {
            SwapDetail storage swapDetail = swapDetails[sourceToken];

            // this call can fail, if amountToSwapBack is too low, and needs to be fixed before going live
            SwapServiceLib.swapExactTokensForTokensExtWrapper(
                swapLibAddress,
                swapDetail.swapService,
                tokenObtainedAmount,
                0,
                swapDetail.path,
                swapDetail.data
            );
        }
    }

    function _deposit(uint256 totalDepositTokenAmount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        UniswapV2LpStorage storage strategyStorage = UniswapV2LpStorageLib
            .getStorage();

        // swapping deposit token to token0 and token1
        uint256 token0SwapAmount = totalDepositTokenAmount / 2;
        uint256 token0ObtainedFromSwapAmount = swapExactDepositTokenToTargetToken(
                token0SwapAmount,
                strategyStorage.token0
            );
        uint256 token1ObtainedFromSwapAmount = swapExactDepositTokenToTargetToken(
                totalDepositTokenAmount - token0SwapAmount,
                strategyStorage.token1
            );

        // providing liquidity to the pool
        strategyStorage.token0.approve(
            address(strategyStorage.router),
            token0ObtainedFromSwapAmount
        );
        strategyStorage.token1.approve(
            address(strategyStorage.router),
            token1ObtainedFromSwapAmount
        );
        (
            uint256 token0AmountTransferredToRouter,
            uint256 token1AmountTransferredToRouter,

        ) = strategyStorage.router.addLiquidity(
                address(strategyStorage.token0),
                address(strategyStorage.token1),
                token0ObtainedFromSwapAmount,
                token1ObtainedFromSwapAmount,
                0,
                0,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            );

        // swapping back dust amount
        swapExactTargetTokenToDepositToken(
            token0ObtainedFromSwapAmount - token0AmountTransferredToRouter,
            strategyStorage.token0
        );
        swapExactTargetTokenToDepositToken(
            token1ObtainedFromSwapAmount - token1AmountTransferredToRouter,
            strategyStorage.token1
        );
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        UniswapV2LpStorage storage strategyStorage = UniswapV2LpStorageLib
            .getStorage();

        // removing liquidity from the pool and obtaining token0 and token1
        uint256 lpBalanceToWithdraw = (strategyStorage.tokenPair.balanceOf(
            address(this)
        ) * amount) / getInvestmentTokenSupply();
        strategyStorage.tokenPair.approve(
            address(strategyStorage.router),
            lpBalanceToWithdraw
        );
        (uint256 token0ObtainedAmount, uint256 token1ObtainedAmount) = strategyStorage
            .router
            .removeLiquidity(
                address(strategyStorage.token0),
                address(strategyStorage.token1),
                lpBalanceToWithdraw,
                0,
                0,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            );

        // swapping obtained token0 and token1 back to deposit token
        swapExactTargetTokenToDepositToken(
            token0ObtainedAmount,
            strategyStorage.token0
        );
        swapExactTargetTokenToDepositToken(
            token1ObtainedAmount,
            strategyStorage.token1
        );
    }

    function _reapReward(NameValuePair[] calldata) internal virtual override {}

    function _getAssetBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {
        UniswapV2LpStorage storage strategyStorage = UniswapV2LpStorageLib
            .getStorage();

        assetBalances = new Balance[](1);
        assetBalances[0] = Balance(
            address(strategyStorage.tokenPair),
            strategyStorage.tokenPair.balanceOf(address(this))
        );
    }

    function _getLiabilityBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory liabilityBalances)
    {}

    function _getAssetValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory assetValuations)
    {
        // UniswapV2LpStorage storage strategyStorage = UniswapV2LpStorageLib
        //     .getStorage();

        assetValuations = new Valuation[](1);
        assetValuations[0] = Valuation(address(depositToken), 0);
    }

    function _getLiabilityValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory liabilityValuations)
    {}
}
