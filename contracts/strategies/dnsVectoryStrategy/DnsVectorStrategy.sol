// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./DnsVectorStrategyStorageLib.sol";
import "./DnsVectorStrategyAumLib.sol";
import "./DnsVectorStrategyInvestmentLib.sol";
import "../../common/bases/StrategyRoleablePausableBaseUpgradeable.sol";
import "../../common/InvestmentToken.sol";
import "../../common/interfaces/IPriceOracle.sol";
import "../../common/libraries/SwapServiceLib.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract DnsVectorStrategy is
    UUPSUpgradeable,
    StrategyRoleablePausableBaseUpgradeable
{
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error SafetyFactorRangeError();

    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName =
        "brokkr.dns_vector_strategy.dns_vector_strategy_v1.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName =
        "Dns vector delta neutral strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // workaround for the stack too deep error
    struct InitializeParams {
        uint256 safetyFactor;
        IERC20Upgradeable aaveSupplyToken;
        IERC20Upgradeable aAaveSupplyToken;
        ERC20Upgradeable aaveBorrowToken;
        IERC20Upgradeable vAaveBorrowToken;
        IERC20Upgradeable ammPairDepositToken;
        IERC20Upgradeable joeToken;
        IPool aavePool;
        AaveProtocolDataProvider aaveProtocolDataProvider;
        IJoeRouter02 traderJoeRouter;
        IJoePair traderJoePair;
        IVectorPoolHelperJoe vectorPoolHelperJoe;
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        InitializeParams calldata initializeParams
    ) external initializer {
        __UUPSUpgradeable_init();
        __StrategyRoleablePausableBaseUpgradeable_init(strategyArgs);

        require(
            address(initializeParams.aaveSupplyToken) == InvestableLib.USDC,
            "aaveSupplyToken != USDC"
        );
        require(
            address(initializeParams.aaveBorrowToken) == InvestableLib.WAVAX,
            "aaveBorrowToken != WAVAX"
        );
        require(
            address(initializeParams.ammPairDepositToken) == InvestableLib.USDC,
            "ammPairDepositToken != USDC"
        );

        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        strategyStorage.safetyFactor = initializeParams.safetyFactor;
        strategyStorage.aaveSupplyToken = initializeParams.aaveSupplyToken;
        strategyStorage.aAaveSupplyToken = initializeParams.aAaveSupplyToken;
        strategyStorage.aaveBorrowToken = initializeParams.aaveBorrowToken;
        strategyStorage.vAaveBorrowToken = initializeParams.vAaveBorrowToken;
        strategyStorage.ammPairDepositToken = initializeParams
            .ammPairDepositToken;
        strategyStorage.joeToken = initializeParams.joeToken;
        strategyStorage.aavePool = initializeParams.aavePool;
        strategyStorage.aaveProtocolDataProvider = initializeParams
            .aaveProtocolDataProvider;
        strategyStorage.traderJoeRouter = initializeParams.traderJoeRouter;
        strategyStorage.traderJoePair = initializeParams.traderJoePair;
        strategyStorage.vectorPoolHelperJoe = initializeParams
            .vectorPoolHelperJoe;
        strategyStorage.depositToken = strategyArgs.depositToken;
        strategyStorage.priceOracle = strategyArgs.priceOracle;
        strategyStorage.swapService = SwapService(
            strategyArgs.swapServiceProvider,
            strategyArgs.swapServiceRouter
        );
    }

    function _deposit(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual
        override
    {
        DnsVectorStrategyInvestmentLib.deposit(amount, params);
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual
        override
    {
        DnsVectorStrategyInvestmentLib.withdraw(
            amount,
            params,
            getInvestmentTokenSupply()
        );
    }

    function _reapReward(NameValuePair[] calldata params)
        internal
        virtual
        override
    {
        DnsVectorStrategyInvestmentLib.reapReward(params);
    }

    function _getAssetBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory)
    {
        return DnsVectorStrategyAumLib.getAssetBalances();
    }

    function _getLiabilityBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory)
    {
        return DnsVectorStrategyAumLib.getLiabilityBalances();
    }

    function _getAssetValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) internal view virtual override returns (Valuation[] memory) {
        return
            DnsVectorStrategyAumLib.getAssetValuations(
                shouldMaximise,
                shouldIncludeAmmPrice
            );
    }

    function _getLiabilityValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) internal view virtual override returns (Valuation[] memory) {
        return
            DnsVectorStrategyAumLib.getLiabilityValuations(
                shouldMaximise,
                shouldIncludeAmmPrice
            );
    }

    function _authorizeUpgrade(address)
        internal
        override
        onlyRole(UPGRADE_ROLE)
    {}

    function setSafetyFactor(uint256 safetyFactor)
        external
        onlyRole(STRATEGIST_ROLE)
    {
        if (safetyFactor > 950 || safetyFactor == 0)
            revert SafetyFactorRangeError();

        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        strategyStorage.safetyFactor = safetyFactor;
    }

    function setSwapService(SwapServiceProvider provider, address router)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setSwapService(provider, router);

        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        strategyStorage.swapService = SwapService(provider, router);
    }

    function setPriceOracle(IPriceOracle priceOracle)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setPriceOracle(priceOracle);

        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        strategyStorage.priceOracle = priceOracle;
    }

    // This function is added to help developers/integrators to obtain all data
    // stored in the strategy using a blockchain explorer.
    // This function should not be relied upon except during development.
    function getDnsVectorStorage()
        public
        pure
        returns (DnsVectorStorage memory)
    {
        return DnsVectorStorageLib.getStorage();
    }
}