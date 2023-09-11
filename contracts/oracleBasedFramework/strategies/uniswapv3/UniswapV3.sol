// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { RangeDesc, LiquidityChangeDesc } from "./Common.sol";
import { UniswapV3StorageLib, UniswapV3Storage } from "./libraries/UniswapV3StorageLib.sol";
import { UniswapV3UtilsLib } from "./libraries/UniswapV3UtilsLib.sol";
import { UniswapV3InvestmentLib } from "./libraries/UniswapV3InvestmentLib.sol";
import { StrategyRoleablePausableBaseUpgradeable, StrategyArgs, UPGRADE_ROLE } from "../../bases/strategy/StrategyRoleablePausableBaseUpgradeable.sol";
import { IInvestmentToken } from "../../InvestmentToken.sol";
import { IPriceOracle } from "../../interfaces/IPriceOracle.sol";
import { IERC20UpgradeableExt } from "../../interfaces/IERC20UpgradeableExt.sol";
import { Balance, Valuation } from "../../interfaces/IAum.sol";
import { NameValuePair } from "../../Common.sol";

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { IUniswapV3Factory } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

contract UniswapV3 is UUPSUpgradeable, StrategyRoleablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName = "brokkr.uniswap_v3.uniswap_v3_v1.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "UniswapV3 strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    struct InitializeParams {
        IERC20UpgradeableExt token0;
        IERC20UpgradeableExt token1;
        uint24 fee;
        IUniswapV3Factory factory;
        uint256 initialInvestment;
        RangeDesc[] rangeDescs;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        InitializeParams calldata initializeParams
    ) external initializer {
        __UUPSUpgradeable_init();
        __StrategyRoleablePausableBaseUpgradeable_init(strategyArgs);

        UniswapV3Storage storage strategyStorage = UniswapV3StorageLib
            .getStorage();

        // making sure token0 < token1, swap otherwise
        (IERC20UpgradeableExt token0, IERC20UpgradeableExt token1) = (address(
            initializeParams.token0
        ) < address(initializeParams.token0))
            ? (initializeParams.token0, initializeParams.token1)
            : (initializeParams.token1, initializeParams.token0);

        // computing pool address
        strategyStorage.pool = UniswapV3UtilsLib.computePoolAddress(
            initializeParams.factory,
            token0,
            token1,
            initializeParams.fee
        );

        // storing the rest of the data in storage
        strategyStorage.token0 = token0;
        strategyStorage.token0Decimals = token0.decimals();
        strategyStorage.token1 = token1;
        strategyStorage.token1Decimals = token1.decimals();
        strategyStorage.fee = initializeParams.fee;
        uint256 rangeDescsLength = initializeParams.rangeDescs.length;
        for (uint256 i = 0; i < rangeDescsLength; ++i) {
            strategyStorage.rangeDescs.push(
                RangeDesc(
                    initializeParams.rangeDescs[rangeDescsLength].tickLower,
                    initializeParams.rangeDescs[rangeDescsLength].tickUpper
                )
            );
        }
        strategyStorage.priceOracle = priceOracle;
        strategyStorage.depositToken = depositToken;
        strategyStorage.depositTokenDecimals = depositToken.decimals();
    }

    function _authorizeUpgrade(address)
        internal
        override
        onlyRole(UPGRADE_ROLE)
    {}

    function _deposit(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual
        override
    {
        UniswapV3Storage storage strategyStorage = UniswapV3StorageLib
            .getStorage();

        UniswapV3InvestmentLib.deposit(amount, params);
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual
        override
    {}

    function _reapReward(NameValuePair[] calldata params)
        internal
        virtual
        override
    {}

    function _getAssetBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory)
    {
        return new Balance[](0);
    }

    function _getLiabilityBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory)
    {
        return new Balance[](0);
    }

    function _getAssetValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) internal view virtual override returns (Valuation[] memory) {
        return new Valuation[](0);
    }

    function _getLiabilityValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) internal view virtual override returns (Valuation[] memory) {
        return new Valuation[](0);
    }
}
