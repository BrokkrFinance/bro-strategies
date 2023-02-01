// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./DnsCakeStrategyStorageLib.sol";
import "./DnsCakeStrategyCommonLib.sol";
import "../../common/libraries/InvestableLib.sol";
import "../../common/interfaces/IAum.sol";

library DnsCakeStrategyAumLib {
    function getAssetBalances()
        external
        view
        returns (Balance[] memory assetBalances)
    {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();
        assetBalances = new Balance[](2);
        assetBalances[0] = Balance(
            address(strategyStorage.venusSupplyMarket),
            strategyStorage.venusSupplyMarket.balanceOf(address(this))
        );
        assetBalances[1] = Balance(
            address(strategyStorage.swapPair),
            DnsCakeStrategyCommonLib.masterChefBalanceOf(
                address(this),
                strategyStorage.masterChef,
                strategyStorage.farmId
            )
        );
    }

    function getLiabilityBalances()
        external
        view
        returns (Balance[] memory liabilityBalances)
    {
        liabilityBalances = new Balance[](1);
        liabilityBalances[0] = Balance(
            address(InvestableLib.BINANCE_NATIVE),
            InvestableLib.BINANCE_VENUS_BNB_MARKET.borrowBalanceStored(
                address(this)
            )
        );
    }

    function getAssetValuations(bool shouldMaximise, bool shouldIncludeAmmPrice)
        public
        view
        returns (Valuation[] memory assetValuations)
    {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();
        assetValuations = new Valuation[](2);

        // step 1: asset valuation for the supplied collateral
        // assuming venusSupplyToken == depositToken
        assetValuations[0] = Valuation(
            address(strategyStorage.venusSupplyMarket),
            (strategyStorage.venusSupplyMarket.balanceOf(address(this)) *
                strategyStorage.venusSupplyMarket.exchangeRateStored()) / 10**18
        );

        // step 2: asset valuation for the lp token
        // get liquidity providing service's token reserves
        // assuming a certain order of tokens
        (
            uint112 reserve0, // BNB (generally it can be venusSupplyToken or BNB)
            uint112 reserve1, // BUSD (generally it can be venusSupplyToken or BNB)

        ) = strategyStorage.swapPair.getReserves();
        uint256 lpTokenTotalSupply = strategyStorage.swapPair.totalSupply();
        uint256 lpTokenContractBalance = DnsCakeStrategyCommonLib
            .masterChefBalanceOf(
                address(this),
                strategyStorage.masterChef,
                strategyStorage.farmId
            );

        // get the BNB AUM in depositToken
        uint256 lpBorrowTokenAumInDepositToken = (uint256(reserve0) *
            lpTokenContractBalance *
            strategyStorage.priceOracle.getPrice(
                InvestableLib.BINANCE_NATIVE,
                shouldMaximise,
                shouldIncludeAmmPrice
            )) /
            lpTokenTotalSupply /
            InvestableLib.PRICE_PRECISION_FACTOR;

        console.log(
            "lpBorrowTokenAumInDepositToken: ",
            lpBorrowTokenAumInDepositToken
        );

        // assuming ammPairDepositToken == depositToken
        // get the ammPairDepositToken AUM in depositToken
        uint256 lpPairDepositAumInDepositCurrency = (uint256(reserve1) *
            lpTokenContractBalance) / lpTokenTotalSupply;
        console.log(
            "lpPairDepositAumInDepositCurrency: ",
            lpPairDepositAumInDepositCurrency
        );
        assetValuations[1] = Valuation(
            address(strategyStorage.swapPair),
            lpBorrowTokenAumInDepositToken + lpPairDepositAumInDepositCurrency
        );
    }

    function getLiabilityValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) public view returns (Valuation[] memory liabilityValuations) {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();
        liabilityValuations = new Valuation[](1);
        liabilityValuations[0] = Valuation(
            address(InvestableLib.BINANCE_NATIVE),
            (InvestableLib.BINANCE_VENUS_BNB_MARKET.borrowBalanceStored(
                address(this)
            ) *
                (
                    strategyStorage.priceOracle.getPrice(
                        InvestableLib.BINANCE_NATIVE,
                        shouldMaximise,
                        shouldIncludeAmmPrice
                    )
                )) / 10**6
        );
    }

    function getLendingPoolBorrowAmount() external view returns (uint256) {
        return
            InvestableLib.BINANCE_VENUS_BNB_MARKET.borrowBalanceStored(
                address(this)
            );
    }

    function getLendingPoolSupplyAmount() external view returns (uint256) {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();
        return
            (strategyStorage.venusSupplyMarket.balanceOf(address(this)) *
                strategyStorage.venusSupplyMarket.exchangeRateStored()) /
            10**18;
    }

    function getLiquidityPoolBorrowAmount() external view returns (uint256) {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        // get LP token reserves
        (
            uint112 reserve0, // BNB (generally it can be venusSupplyToken or BNB)
            ,

        ) = strategyStorage.swapPair.getReserves();

        uint256 lpTokenTotalSupply = strategyStorage.swapPair.totalSupply();
        uint256 lpTokenContractBalance = DnsCakeStrategyCommonLib
            .masterChefBalanceOf(
                address(this),
                strategyStorage.masterChef,
                strategyStorage.farmId
            );

        return (reserve0 * lpTokenContractBalance) / lpTokenTotalSupply;
    }

    function getInverseCollateralRatio(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) external view returns (uint256) {
        Valuation[] memory assetValuations = getAssetValuations(
            shouldMaximise,
            shouldIncludeAmmPrice
        );
        Valuation[] memory liabilityValuations = getLiabilityValuations(
            shouldMaximise,
            shouldIncludeAmmPrice
        );

        return
            (liabilityValuations[0].valuation *
                Math.SHORT_FIXED_DECIMAL_FACTOR) / assetValuations[0].valuation;
    }
}
