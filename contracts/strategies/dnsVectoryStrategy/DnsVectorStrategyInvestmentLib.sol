// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./DnsVectorStrategyStorageLib.sol";
import "./DnsVectorStrategyCommon.sol";
import "../../common/Common.sol";
import "../../common/libraries/InvestableLib.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

library DnsVectorStrategyInvestmentLib {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function deposit(uint256 amount, NameValuePair[] calldata) public {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        (, , uint256 maxLoanToValueFactor, , , , , , , ) = strategyStorage
            .aaveProtocolDataProvider
            .getReserveConfigurationData(
                address(strategyStorage.aaveSupplyToken)
            );

        uint256 combinedFixedDecimalFactor = Math.SHORT_FIXED_DECIMAL_FACTOR *
            AAVE_FIXED_DECIMAL_FACTOR;

        // without fixed point arithmetic
        // aaveSupplyAllocationInDepositToken = amount / (1 + strategyStorage.safetyFactor
        // * maxLoanToValueFactor)
        uint256 aaveSupplyAllocationInDepositToken = (amount *
            combinedFixedDecimalFactor) /
            (combinedFixedDecimalFactor +
                strategyStorage.safetyFactor *
                maxLoanToValueFactor);

        // without fixed point arithmetic
        // aaveBorrowAllocationUsdcInDepositToken = aaveSupplyAllocationInDepositToken
        // * strategyStorage.safetyFactor * maxLoanToValueFactor)
        uint256 aaveBorrowAllocationUsdcInDepositToken = (aaveSupplyAllocationInDepositToken *
                strategyStorage.safetyFactor *
                maxLoanToValueFactor) / combinedFixedDecimalFactor;

        uint256 poolTokenAllocationInDepositToken = amount -
            aaveSupplyAllocationInDepositToken;
        uint256 avaxUsdcMinimumPrice = strategyStorage.priceOracle.getPrice(
            strategyStorage.aaveBorrowToken,
            false,
            false
        );
        uint256 aaveBorrowAllocationInBorrowToken = InvestableLib
            .convertPricePrecision(
                (aaveBorrowAllocationUsdcInDepositToken *
                    InvestableLib.PRICE_PRECISION_FACTOR) /
                    avaxUsdcMinimumPrice,
                InvestableLib.PRICE_PRECISION_FACTOR,
                (10**strategyStorage.aaveBorrowToken.decimals())
            );

        strategyStorage.aaveSupplyToken.approve(
            address(strategyStorage.aavePool),
            aaveSupplyAllocationInDepositToken
        );

        // assuming aaveSupplyToken == depositToken
        // supplying collateral to Aave
        strategyStorage.aavePool.supply(
            address(strategyStorage.aaveSupplyToken),
            aaveSupplyAllocationInDepositToken,
            address(this),
            0
        );

        // aaveBorrowTokenBalance before borrow
        uint256 aaveBorrowTokenBalanceBeforeBorrow = strategyStorage
            .aaveBorrowToken
            .balanceOf(address(this));

        // borrowing from Aave
        strategyStorage.aavePool.borrow(
            address(strategyStorage.aaveBorrowToken),
            aaveBorrowAllocationInBorrowToken,
            VARIABLE_DEBT,
            0,
            address(this)
        );

        // providing liquidity to Trader Joe
        uint256 lpAmountChange = strategyStorage.traderJoePair.balanceOf(
            address(this)
        );
        // assuming ammPairDepositToken == depositToken
        strategyStorage.ammPairDepositToken.approve(
            address(strategyStorage.traderJoeRouter),
            poolTokenAllocationInDepositToken
        );
        strategyStorage.aaveBorrowToken.approve(
            address(strategyStorage.traderJoeRouter),
            aaveBorrowAllocationInBorrowToken
        );
        // assuming ammPairDepositToken == depositToken
        strategyStorage.traderJoeRouter.addLiquidity(
            address(strategyStorage.aaveSupplyToken),
            address(strategyStorage.aaveBorrowToken),
            poolTokenAllocationInDepositToken,
            aaveBorrowAllocationInBorrowToken,
            0,
            0,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );
        lpAmountChange =
            strategyStorage.traderJoePair.balanceOf(address(this)) -
            lpAmountChange;

        // swapping back remnants amount of tokens to depositToken
        // assuming ammPairDepositToken == depositToken as we only
        // swap back aaveBorrowToken
        uint256 aaveBorrowTokenBalanceChange = strategyStorage
            .aaveBorrowToken
            .balanceOf(address(this)) - aaveBorrowTokenBalanceBeforeBorrow;
        if (aaveBorrowTokenBalanceChange != 0) {
            address[] memory path = new address[](2);
            path[0] = address(strategyStorage.aaveBorrowToken);
            path[1] = address(strategyStorage.depositToken);

            SwapServiceLib.swapExactTokensForTokens(
                strategyStorage.swapService,
                aaveBorrowTokenBalanceChange,
                0,
                path
            );
        }

        // depositing Trader Joe LP tokens into Vector
        strategyStorage.traderJoePair.approve(
            address(strategyStorage.vectorPoolHelperJoe),
            lpAmountChange
        );
        strategyStorage.vectorPoolHelperJoe.deposit(lpAmountChange);
    }

    function withdraw(
        uint256 amount,
        NameValuePair[] calldata,
        uint256 investmentTokenSupply
    ) public {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();

        // withdrawing Trader Joe LP tokens from Vector
        uint256 lpUserAmount = (strategyStorage.vectorPoolHelperJoe.balanceOf(
            address(this)
        ) * amount) / investmentTokenSupply;
        uint256 lpUserAmountChange = strategyStorage.traderJoePair.balanceOf(
            address(this)
        );
        strategyStorage.vectorPoolHelperJoe.withdraw(lpUserAmount);
        lpUserAmountChange =
            strategyStorage.traderJoePair.balanceOf(address(this)) -
            lpUserAmountChange;
        assert(lpUserAmount == lpUserAmountChange);

        // withdrawing liquidity from TraderJoe
        uint256 aaveBorrowTokenChangeAmount = strategyStorage
            .aaveBorrowToken
            .balanceOf(address(this));
        uint256 ammPairDepositTokenChangeAmount = strategyStorage
            .ammPairDepositToken
            .balanceOf(address(this));
        strategyStorage.traderJoePair.approve(
            address(strategyStorage.traderJoeRouter),
            lpUserAmountChange
        );
        strategyStorage.traderJoeRouter.removeLiquidity(
            address(strategyStorage.ammPairDepositToken),
            address(strategyStorage.aaveBorrowToken),
            lpUserAmountChange,
            0,
            0,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );
        aaveBorrowTokenChangeAmount =
            strategyStorage.aaveBorrowToken.balanceOf(address(this)) -
            aaveBorrowTokenChangeAmount;
        ammPairDepositTokenChangeAmount =
            strategyStorage.ammPairDepositToken.balanceOf(address(this)) -
            ammPairDepositTokenChangeAmount;

        // repay Aave debt
        uint256 vAaveBorrowTokenUserAmount = ((strategyStorage
            .vAaveBorrowToken
            .balanceOf(address(this)) * amount) / investmentTokenSupply);

        // Assumption: the rebalancer works correctly and making sure that
        // the condition of (avax debt) > 2 * (avax supplied to the pool) will never happen.
        // If that condition happens, then withdrawals will be temporarily halted, until rebalancing.
        // One remedy to the above would be to carefully withdraw aaveSupplyToken on the user behalf first,
        // before trying to pay off aaveBorrowToken debt.
        if (aaveBorrowTokenChangeAmount > vAaveBorrowTokenUserAmount) {
            // traderJoe returned more borrowToken than the user needs to pay off debt,
            // swapping the surplus borrowToken back to depositToken
            address[] memory path = new address[](2);
            path[0] = address(strategyStorage.aaveBorrowToken);
            path[1] = address(strategyStorage.depositToken);

            uint256 amountIn = aaveBorrowTokenChangeAmount -
                vAaveBorrowTokenUserAmount;
            SwapServiceLib.swapExactTokensForTokens(
                strategyStorage.swapService,
                amountIn,
                0,
                path
            );
        } else if (aaveBorrowTokenChangeAmount < vAaveBorrowTokenUserAmount) {
            // traderJoe returned less borrowToken than the user needs to pay off debt,
            // swapping some ammPairDeposit token to borrowToken
            address[] memory path = new address[](2);
            path[0] = address(strategyStorage.ammPairDepositToken);
            path[1] = address(strategyStorage.aaveBorrowToken);

            uint256 amountOut = vAaveBorrowTokenUserAmount -
                aaveBorrowTokenChangeAmount;
            SwapServiceLib.swapTokensForExactTokens(
                strategyStorage.swapService,
                amountOut,
                ammPairDepositTokenChangeAmount,
                path
            );
            // assuming ammPairDepositToken == depositToken
        }
        strategyStorage.aaveBorrowToken.approve(
            address(strategyStorage.aavePool),
            vAaveBorrowTokenUserAmount
        );
        uint256 repayed = strategyStorage.aavePool.repay(
            address(strategyStorage.aaveBorrowToken),
            vAaveBorrowTokenUserAmount,
            VARIABLE_DEBT,
            address(this)
        );
        assert(repayed == vAaveBorrowTokenUserAmount);

        // withdraw from Aave supply
        uint256 aAaveSupplyTokenUserAmount = ((strategyStorage
            .aAaveSupplyToken
            .balanceOf(address(this)) * amount) / investmentTokenSupply);
        uint256 aaveSupplyTokenChangeAmount = strategyStorage
            .aaveSupplyToken
            .balanceOf(address(this));
        strategyStorage.aavePool.withdraw(
            address(strategyStorage.aaveSupplyToken),
            aAaveSupplyTokenUserAmount,
            address(this)
        );
        aaveSupplyTokenChangeAmount =
            strategyStorage.aaveSupplyToken.balanceOf(address(this)) -
            aaveSupplyTokenChangeAmount;
        assert(aaveSupplyTokenChangeAmount == aAaveSupplyTokenUserAmount);
    }

    function reapReward(
        NameValuePair[] calldata /*params*/
    ) external {
        DnsVectorStorage storage strategyStorage = DnsVectorStorageLib
            .getStorage();
        uint256 joeTokenBalanceChange = strategyStorage.joeToken.balanceOf(
            address(this)
        );
        strategyStorage.vectorPoolHelperJoe.getReward();
        joeTokenBalanceChange =
            strategyStorage.joeToken.balanceOf(address(this)) -
            joeTokenBalanceChange;

        strategyStorage.joeToken.approve(
            address(strategyStorage.traderJoeRouter),
            joeTokenBalanceChange
        );
        address[] memory path = new address[](2);
        path[0] = address(strategyStorage.joeToken);
        path[1] = address(strategyStorage.depositToken);
        SwapServiceLib.swapExactTokensForTokens(
            strategyStorage.swapService,
            joeTokenBalanceChange,
            0,
            path
        );
    }
}
