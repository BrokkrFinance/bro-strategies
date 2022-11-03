// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./DnsVectorStrategyStorageLib.sol";
import "../../common/interfaces/IAum.sol";

library DnsVectorStrategyAumLib {
    function getAssetBalances() external view returns (Balance[] memory) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        Balance[] memory assetBalances = new Balance[](2);
        assetBalances[0] = Balance(
            address(strategyStorage.aAaveSupplyToken),
            strategyStorage.aAaveSupplyToken.balanceOf(address(this))
        );
        assetBalances[1] = Balance(
            strategyStorage.vectorPoolHelperJoe.stakingToken(),
            strategyStorage.vectorPoolHelperJoe.balanceOf(address(this))
        );

        return assetBalances;
    }

    function getLiabilityBalances() external view returns (Balance[] memory) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        Balance[] memory liabilityBalances = new Balance[](1);
        liabilityBalances[0] = Balance(
            address(strategyStorage.vAaveBorrowToken),
            strategyStorage.vAaveBorrowToken.balanceOf(address(this))
        );
        return liabilityBalances;
    }

    function getAssetValuations(bool shouldMaximise, bool shouldIncludeAmmPrice)
        external
        view
        returns (Valuation[] memory)
    {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        Valuation[] memory assetValuations = new Valuation[](2);
        // assuming aaveSupplyToken == depositToken
        assetValuations[0] = Valuation(
            address(strategyStorage.aAaveSupplyToken),
            strategyStorage.aAaveSupplyToken.balanceOf(address(this))
        );

        // get Traker Joe LP token reserves
        // asuming a certain order of tokens
        (
            uint112 reserve0, // wAvax (generally it can be aaveSupplyToken or aaveBorrowToken)
            uint112 reserve1, // usdc (generally it can be aaveSupplyToken or aaveBorrowToken)

        ) = strategyStorage.traderJoePair.getReserves();
        uint256 lpTokenTotalSupply = strategyStorage
            .traderJoePair
            .totalSupply();
        uint256 lpTokenContractBalance = strategyStorage
            .vectorPoolHelperJoe
            .balanceOf(address(this));

        // get the aaveBorrowToken AUM in depositToken
        uint256 lpBorrowTokenAumInDepositToken = (uint256(reserve0) *
            lpTokenContractBalance *
            strategyStorage.priceOracle.getPrice(
                strategyStorage.aaveBorrowToken,
                shouldMaximise,
                shouldIncludeAmmPrice
            )) /
            lpTokenTotalSupply /
            10**18;

        // assuming ammPairDepositToken == depositToken
        // get the ammPairDepositToken AUM in depositToken
        uint256 lpPairDepositAumInDepositCurrency = (uint256(reserve1) *
            lpTokenContractBalance) / lpTokenTotalSupply;

        assetValuations[1] = Valuation(
            strategyStorage.vectorPoolHelperJoe.stakingToken(),
            lpBorrowTokenAumInDepositToken + lpPairDepositAumInDepositCurrency
        );

        return assetValuations;
    }

    function getLiabilityValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) external view returns (Valuation[] memory) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        Valuation[] memory liabilityValuations = new Valuation[](1);
        liabilityValuations[0] = Valuation(
            address(strategyStorage.vAaveBorrowToken),
            (strategyStorage.vAaveBorrowToken.balanceOf(address(this)) *
                (
                    strategyStorage.priceOracle.getPrice(
                        strategyStorage.aaveBorrowToken,
                        !shouldMaximise,
                        shouldIncludeAmmPrice
                    )
                )) / 10**18
        );
        return liabilityValuations;
    }
}
