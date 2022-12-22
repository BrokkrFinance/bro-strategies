// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./DnsVectorStrategyStorageLib.sol";
import "../../common/interfaces/IAum.sol";

library DnsVectorStrategyAumLib {
    error InvalidPangolinPair();

    function getAssetBalances() public view returns (Balance[] memory) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        Balance[] memory assetBalances = new Balance[](2);
        assetBalances[0] = Balance(
            address(strategyStorage.aAaveSupplyToken),
            strategyStorage.aAaveSupplyToken.balanceOf(address(this))
        );
        assetBalances[1] = Balance(
            address(strategyStorage.pangolinPair),
            getPangolinLpBalance()
        );

        return assetBalances;
    }

    function getLiabilityBalances() public view returns (Balance[] memory) {
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

        // get Pangolin LP token reserves
        // assuming a certain order of tokens
        (
            uint112 reserve0, // wAvax (generally it can be aaveSupplyToken or aaveBorrowToken)
            uint112 reserve1, // usdc (generally it can be aaveSupplyToken or aaveBorrowToken)

        ) = strategyStorage.pangolinPair.getReserves();
        uint256 lpTokenTotalSupply = strategyStorage.pangolinPair.totalSupply();
        uint256 lpTokenContractBalance = getPangolinLpBalance();

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
            address(strategyStorage.pangolinPair),
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

    function getAaveDebt() external view returns (uint256) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        return strategyStorage.vAaveBorrowToken.balanceOf(address(this));
    }

    function getAaveSupply() external view returns (uint256) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        return strategyStorage.aAaveSupplyToken.balanceOf(address(this));
    }

    function getPoolDebt() external view returns (uint256) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        // get Traker Joe LP token reserves
        // asuming a certain order of tokens
        (
            uint112 reserve0, // wAvax (generally it can be aaveSupplyToken or aaveBorrowToken) // usdc (generally it can be aaveSupplyToken or aaveBorrowToken)
            ,

        ) = strategyStorage.pangolinPair.getReserves();
        uint256 lpTokenTotalSupply = strategyStorage.pangolinPair.totalSupply();
        uint256 lpTokenContractBalance = getPangolinLpBalance();

        return (reserve0 * lpTokenContractBalance) / lpTokenTotalSupply;
    }

    function getInverseCollateralRatio(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) external view returns (uint256) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        Balance[] memory assetBalances = getAssetBalances();
        Balance[] memory liabilityBalances = getLiabilityBalances();

        // assuming aAaveSupplyToken == depositToken
        // assuming aAaveSupplyToken is at index 0 of getAssetBalances()
        // assuming vAaveBorrowToken is at index 0 of getLiabilityBalances()
        return
            (((strategyStorage.priceOracle.getPrice(
                strategyStorage.aaveBorrowToken,
                shouldMaximise,
                shouldIncludeAmmPrice
            ) * liabilityBalances[0].balance) *
                Math.SHORT_FIXED_DECIMAL_FACTOR) / 10**18) /
            (assetBalances[0].balance);
    }

    function getPangolinLpBalance() public view returns (uint256) {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        return
            strategyStorage
                .pangolinMiniChef
                .userInfo(strategyStorage.pangolinPoolId, address(this))
                .amount;
    }

    function getPangolinLpReserve(address token0, address token1)
        external
        view
        returns (uint256 reserve0, uint256 reserve1)
    {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        (uint256 _reserve0, uint256 _reserve1, ) = strategyStorage
            .pangolinPair
            .getReserves();

        address _token0 = strategyStorage.pangolinPair.token0();
        address _token1 = strategyStorage.pangolinPair.token1();

        if (_token0 == token0 && _token1 == token1) {
            reserve0 = _reserve0;
            reserve1 = _reserve1;
        } else if (_token0 == token1 && _token1 == token0) {
            reserve0 = _reserve1;
            reserve1 = _reserve0;
        } else {
            revert InvalidPangolinPair();
        }
    }
}
