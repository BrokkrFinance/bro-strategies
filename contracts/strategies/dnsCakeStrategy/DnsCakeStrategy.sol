// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./DnsCakeStrategyStorageLib.sol";
import "./DnsCakeStrategyAumLib.sol";
import "./DnsCakeStrategyInvestmentLib.sol";
import "../../common/bases/StrategyRoleablePausableBaseUpgradeable.sol";
import "../../common/InvestmentToken.sol";
import "../../common/interfaces/IPriceOracle.sol";
import "../../common/libraries/SwapServiceLib.sol";
import "../../dependencies/venus/IComptroller.sol";
import "../../dependencies/venus/IVBNB.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract DnsCakeStrategy is
    UUPSUpgradeable,
    StrategyRoleablePausableBaseUpgradeable
{
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error SafetyFactorRangeError();
    error TooLowMinimumEquityAfterOperation();
    error InvalidPancakeLpToken();

    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName =
        "brokkr.dns_cake_strategy.dns_cake_strategy_v1.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName =
        "Dns cake delta neutral strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // workaround for the stack too deep error
    struct InitializeParams {
        uint256 safetyFactor;
        IERC20Upgradeable venusSupplyToken;
        IVBep20 venusSupplyMarket;
        IERC20Upgradeable ammPairDepositToken;
        IPancakePair swapPair; // could be obtained from the factory
        IPancakeRouter01 router;
        IPancakeMasterChefV2 masterChef;
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        InitializeParams calldata initializeParams
    ) external initializer {
        __UUPSUpgradeable_init();
        __StrategyRoleablePausableBaseUpgradeable_init(strategyArgs);

        require(
            strategyArgs.depositToken == InvestableLib.BINANCE_BUSD,
            "depositToken != BINANCE_BUSD"
        );
        require(
            initializeParams.venusSupplyToken == InvestableLib.BINANCE_BUSD,
            "venusSupplyToken != BINANCE_BUSD"
        );
        require(
            initializeParams.venusSupplyMarket ==
                InvestableLib.BINANCE_VENUS_BUSD_MARKET,
            "venusSupplyToken != BINANCE_BUSD"
        );

        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();
        strategyStorage.safetyFactor = initializeParams.safetyFactor;
        strategyStorage.venusSupplyToken = initializeParams.venusSupplyToken;
        strategyStorage.venusSupplyMarket = initializeParams.venusSupplyMarket;
        strategyStorage.ammPairDepositToken = initializeParams
            .ammPairDepositToken;
        strategyStorage.swapPair = initializeParams.swapPair;
        strategyStorage.router = initializeParams.router;
        strategyStorage.masterChef = initializeParams.masterChef;
        strategyStorage.depositToken = strategyArgs.depositToken;
        strategyStorage.priceOracle = strategyArgs.priceOracle;
        strategyStorage.swapService = SwapService(
            strategyArgs.swapServiceProvider,
            strategyArgs.swapServiceRouter
        );

        console.log("???????????????????:", block.number);
        uint256 poolLength = initializeParams.masterChef.poolLength();
        // uint256 i = 0;
        // for (i = 0; i < poolLength; i++) {
        //     IERC20 lpToken = initializeParams.masterChef.lpToken(i);
        //     if (address(lpToken) == address(initializeParams.swapPair)) {
        //         strategyStorage.farmId = i;
        //         break;
        //     }
        // }
        // if (i >= poolLength) {
        //     revert InvalidPancakeLpToken();
        // }

        // IComptroller comptroller = initializeParams
        //     .venusSupplyMarket
        //     .comptroller();

        // // allowing BUSD to serve as collateral
        // address[] memory marketsToEnter = new address[](1);
        // marketsToEnter[0] = address(strategyStorage.venusSupplyMarket);
        // DnsCakeStrategyCommonLib.expectNoVenusError(
        //     comptroller.enterMarkets(marketsToEnter)[0]
        // );
    }

    function _deposit(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual
        override
    {
        DnsCakeStrategyInvestmentLib.deposit(amount, params);
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual
        override
    {
        DnsCakeStrategyInvestmentLib.withdraw(
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
        DnsCakeStrategyInvestmentLib.reapReward(params);
    }

    modifier checkMinimumEquityAfterOperation(
        uint256 minimumEquityAfterOperation
    ) {
        console.log("equity val before:", getEquityValuation(false, false));
        _;
        console.log("equity val after:", getEquityValuation(false, false));
        if (getEquityValuation(false, false) < minimumEquityAfterOperation)
            revert TooLowMinimumEquityAfterOperation();
    }

    function repayDebt(
        uint256 lpAmountToWithdraw,
        NameValuePair[] calldata params,
        uint256 minimumEquityAfterOperation
    )
        external
        onlyRole(MAINTAINER_ROLE)
        checkMinimumEquityAfterOperation(minimumEquityAfterOperation)
    {
        console.log(
            "minimumEquityAfterOperation: ",
            minimumEquityAfterOperation
        );
        DnsCakeStrategyInvestmentLib.repayDebt(lpAmountToWithdraw, params);
    }

    function increaseDebt(
        uint256 borrowTokenAmount,
        NameValuePair[] calldata params,
        uint256 minimumEquityAfterOperation
    )
        external
        onlyRole(MAINTAINER_ROLE)
        checkMinimumEquityAfterOperation(minimumEquityAfterOperation)
    {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        uint256 depositTokenBalanceBefore = depositToken.balanceOf(
            address(this)
        );

        DnsCakeStrategyInvestmentLib.increaseDebt(borrowTokenAmount, params);

        // handling dust amount caused by providing liquidity
        uninvestedDepositTokenAmount +=
            strategyStorage.depositToken.balanceOf(address(this)) -
            depositTokenBalanceBefore;
    }

    function decreaseSupply(
        uint256 supplyTokenAmount,
        NameValuePair[] calldata params,
        uint256 minimumEquityAfterOperation
    )
        external
        onlyRole(MAINTAINER_ROLE)
        checkMinimumEquityAfterOperation(minimumEquityAfterOperation)
    {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        uint256 depositTokenBalanceBefore = depositToken.balanceOf(
            address(this)
        );

        DnsCakeStrategyInvestmentLib.decreaseSupply(supplyTokenAmount, params);

        // handling dust amount caused by providing liquidity
        uninvestedDepositTokenAmount +=
            strategyStorage.depositToken.balanceOf(address(this)) -
            depositTokenBalanceBefore;
    }

    function _getAssetBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory)
    {
        return DnsCakeStrategyAumLib.getAssetBalances();
    }

    function _getLiabilityBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory)
    {
        return DnsCakeStrategyAumLib.getLiabilityBalances();
    }

    function _getAssetValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) internal view virtual override returns (Valuation[] memory) {
        return
            DnsCakeStrategyAumLib.getAssetValuations(
                shouldMaximise,
                shouldIncludeAmmPrice
            );
    }

    function _getLiabilityValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) internal view virtual override returns (Valuation[] memory) {
        return
            DnsCakeStrategyAumLib.getLiabilityValuations(
                shouldMaximise,
                shouldIncludeAmmPrice
            );
    }

    function getLendingPoolBorrowAmount() external view returns (uint256) {
        return DnsCakeStrategyAumLib.getLendingPoolBorrowAmount();
    }

    function getLendingPoolSupplyAmount() external view returns (uint256) {
        return DnsCakeStrategyAumLib.getLendingPoolSupplyAmount();
    }

    function getLiquidityPoolBorrowAmount() external view returns (uint256) {
        return DnsCakeStrategyAumLib.getLiquidityPoolBorrowAmount();
    }

    function getInverseCollateralRatio(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) external view returns (uint256) {
        return
            DnsCakeStrategyAumLib.getInverseCollateralRatio(
                shouldMaximise,
                shouldIncludeAmmPrice
            );
    }

    // precision of 0.001, 800 means 0.8 -> 80%
    function getSafetyFactor() external view returns (uint256) {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();
        return strategyStorage.safetyFactor;
    }

    // precision of 0.001, 800 means 0.8 -> 80%
    function getCombinedSafetyFactor()
        external
        returns (uint256 combinedSafetyFactor)
    {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();
        IComptroller comptroller = strategyStorage
            .venusSupplyMarket
            .comptroller();

        (, uint256 maxLoanToValueFactor, ) = comptroller.markets(
            address(strategyStorage.venusSupplyMarket)
        );
        console.log("maxLoanToValueFactor: ", maxLoanToValueFactor);
        return
            (strategyStorage.safetyFactor * maxLoanToValueFactor) /
            VENUS_FIXED_DECIMAL_FACTOR;
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

        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        strategyStorage.safetyFactor = safetyFactor;
    }

    function setSwapService(SwapServiceProvider provider, address router)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setSwapService(provider, router);

        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        strategyStorage.swapService = SwapService(provider, router);
    }

    function setPriceOracle(IPriceOracle priceOracle)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setPriceOracle(priceOracle);

        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        strategyStorage.priceOracle = priceOracle;
    }

    // This function is added to help developers/integrators to obtain all data
    // stored in the strategy using a blockchain explorer.
    // This function should not be relied upon except during development.
    function getDnsCakeStorage() public pure returns (DnsCakeStorage memory) {
        return DnsCakeStorageLib.getStorage();
    }

    function _beforeDepositEquityValuation(uint256, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        // borrow market's accrued interest needs to be manually updated by calling accrueInterest
        // supply market's accrued interest is automatically updated when calling balanceOfUnderlying
        DnsCakeStrategyCommonLib.expectNoVenusError(
            InvestableLib.BINANCE_VENUS_BNB_MARKET.accrueInterest()
        );
    }

    // receiving native currency from the borrowing protocol
    receive() external payable {}
}
