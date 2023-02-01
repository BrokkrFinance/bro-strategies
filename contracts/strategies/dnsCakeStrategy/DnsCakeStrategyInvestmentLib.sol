// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./DnsCakeStrategyStorageLib.sol";
import "./DnsCakeStrategyCommonLib.sol";
import "../../common/Common.sol";
import "../../common/libraries/InvestableLib.sol";
import "../../dependencies/pancakeswap/IPancakeMasterChefV2.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "hardhat/console.sol";

library DnsCakeStrategyInvestmentLib {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function deposit(uint256 depositTokenAmountIn, NameValuePair[] calldata)
        public
    {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();
        IComptroller comptroller = strategyStorage
            .venusSupplyMarket
            .comptroller();

        (, uint256 maxLoanToValueFactor, ) = comptroller.markets(
            address(strategyStorage.venusSupplyMarket)
        );

        uint256 combinedFixedDecimalFactor = Math.SHORT_FIXED_DECIMAL_FACTOR *
            VENUS_FIXED_DECIMAL_FACTOR;

        // without fixed point arithmetic
        // venusSupplyAllocationInDepositToken = depositTokenAmountIn / (1 + strategyStorage.safetyFactor
        // * maxLoanToValueFactor)
        uint256 venusSupplyAllocationInDepositToken = (depositTokenAmountIn *
            combinedFixedDecimalFactor) /
            (combinedFixedDecimalFactor +
                strategyStorage.safetyFactor *
                maxLoanToValueFactor);

        // without fixed point arithmetic
        // venusBorrowAllocationInDepositToken = venusSupplyAllocationInDepositToken
        // * strategyStorage.safetyFactor * maxLoanToValueFactor)
        uint256 venusBorrowAllocationInDepositToken = (venusSupplyAllocationInDepositToken *
                strategyStorage.safetyFactor *
                maxLoanToValueFactor) / combinedFixedDecimalFactor;

        uint256 poolTokenAllocationInDepositToken = depositTokenAmountIn -
            venusSupplyAllocationInDepositToken;

        uint256 borrowTokenMinimumPriceInDepositToken = strategyStorage
            .priceOracle
            .getPrice(InvestableLib.BINANCE_NATIVE, false, false);

        // assuming both depositToken and borrowToken have 18 decimals
        uint256 venusBorrowAllocationInBorrowToken = (venusBorrowAllocationInDepositToken *
                InvestableLib.PRICE_PRECISION_FACTOR) /
                borrowTokenMinimumPriceInDepositToken;

        console.log(
            "venusSupplyAllocationInDepositToken",
            venusSupplyAllocationInDepositToken
        );
        console.log(
            "venusBorrowAllocationInDepositToken",
            venusBorrowAllocationInDepositToken
        );
        console.log(
            "poolTokenAllocationInDepositToken",
            poolTokenAllocationInDepositToken
        );
        console.log(
            "venusBorrowAllocationInBorrowToken",
            venusBorrowAllocationInBorrowToken
        );
        console.log(
            "borrowTokenMinimumPriceInDepositToken",
            borrowTokenMinimumPriceInDepositToken
        );

        strategyStorage.venusSupplyToken.approve(
            address(strategyStorage.venusSupplyMarket),
            venusSupplyAllocationInDepositToken
        );

        // supplying collateral to the lending protocol
        // assuming venusSupplyToken == depositToken
        // supplying collateral to the lending protocols
        DnsCakeStrategyCommonLib.expectNoVenusError(
            strategyStorage.venusSupplyMarket.mint(
                venusSupplyAllocationInDepositToken
            )
        );

        // borrowing from the lending protocol
        uint256 venusBorrowTokenBalanceBeforeBorrow = address(this).balance;
        DnsCakeStrategyCommonLib.expectNoVenusError(
            InvestableLib.BINANCE_VENUS_BNB_MARKET.borrow(
                venusBorrowAllocationInBorrowToken
            )
        );
        uint256 venusBorrowTokenBalanceAfterBorrow = address(this).balance;
        assert(
            venusBorrowTokenBalanceAfterBorrow -
                venusBorrowTokenBalanceBeforeBorrow ==
                venusBorrowAllocationInBorrowToken
        );

        // providing liquidity
        uint256 lpAmountChange = strategyStorage.swapPair.balanceOf(
            address(this)
        );
        strategyStorage.ammPairDepositToken.approve(
            address(strategyStorage.router),
            poolTokenAllocationInDepositToken
        );
        strategyStorage.router.addLiquidityETH{
            value: venusBorrowAllocationInBorrowToken
        }(
            address(strategyStorage.ammPairDepositToken),
            poolTokenAllocationInDepositToken,
            0,
            0,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );
        lpAmountChange =
            strategyStorage.swapPair.balanceOf(address(this)) -
            lpAmountChange;
        console.log("LP amount acquired: ", lpAmountChange);

        // swapping back remnants amount of tokens to depositToken
        // assuming ammPairDepositToken == depositToken as we only
        // swap back venusBorrowToken
        uint256 venusBorrowTokenBalanceChange = address(this).balance -
            venusBorrowTokenBalanceBeforeBorrow;
        if (venusBorrowTokenBalanceChange != 0) {
            address[] memory path = new address[](1);
            path[0] = address(strategyStorage.depositToken);
            SwapServiceLib.swapExactTokensForTokens(
                strategyStorage.swapService,
                venusBorrowTokenBalanceChange,
                0,
                path,
                new uint256[](0)
            );
        }

        // depositing LP tokens into MasterChef
        strategyStorage.swapPair.approve(
            address(strategyStorage.masterChef),
            lpAmountChange
        );
        strategyStorage.masterChef.deposit(
            strategyStorage.farmId,
            lpAmountChange
        );
    }

    function withdraw(
        uint256 investmentTokenAmountIn,
        NameValuePair[] calldata,
        uint256 investmentTokenSupply
    ) public {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        // withdrawing LP tokens from MasterChef
        uint256 lpUserAmount = (DnsCakeStrategyCommonLib.masterChefBalanceOf(
            address(this),
            strategyStorage.masterChef,
            strategyStorage.farmId
        ) * investmentTokenAmountIn) / investmentTokenSupply;
        uint256 lpUserAmountChange = strategyStorage.swapPair.balanceOf(
            address(this)
        );
        strategyStorage.masterChef.withdraw(
            strategyStorage.farmId,
            lpUserAmount
        );
        lpUserAmountChange =
            strategyStorage.swapPair.balanceOf(address(this)) -
            lpUserAmountChange;
        assert(lpUserAmount == lpUserAmountChange);

        // withdrawing liquidity
        uint256 venusBorrowTokenChangeAmount = address(this).balance;
        uint256 ammPairDepositTokenChangeAmount = strategyStorage
            .ammPairDepositToken
            .balanceOf(address(this));
        strategyStorage.swapPair.approve(
            address(strategyStorage.router),
            lpUserAmountChange
        );
        strategyStorage.router.removeLiquidityETH(
            address(strategyStorage.ammPairDepositToken),
            lpUserAmountChange,
            0,
            0,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );
        venusBorrowTokenChangeAmount =
            address(this).balance -
            venusBorrowTokenChangeAmount;
        ammPairDepositTokenChangeAmount =
            strategyStorage.ammPairDepositToken.balanceOf(address(this)) -
            ammPairDepositTokenChangeAmount;

        // repay debt
        uint256 venusBorrowTokenContractAmount = InvestableLib
            .BINANCE_VENUS_BNB_MARKET
            .borrowBalanceCurrent(address(this));
        uint256 venusBorrowTokenUserAmount = (venusBorrowTokenContractAmount *
            investmentTokenAmountIn) / investmentTokenSupply;
        console.log(
            "venusBorrowTokenContractAmount:",
            venusBorrowTokenContractAmount
        );
        console.log("venusBorrowTokenUserAmount:", venusBorrowTokenUserAmount);
        // Assumption: the rebalancer works correctly and making sure that
        // the condition of (debt) > 2 * (total value of supplied to the pool) will never happen.
        // If that condition happens, then withdrawals will be temporarily halted, until rebalancing.
        // One remedy to the above would be to carefully withdraw supplyToken on the user behalf first,
        // before trying to pay off borrowToken debt.
        if (venusBorrowTokenChangeAmount > venusBorrowTokenUserAmount) {
            // liquidity providing service returned more borrowToken than the user needs to pay off debt,
            // swapping the surplus borrowToken back to depositToken
            address[] memory path = new address[](1);
            path[0] = address(strategyStorage.depositToken);
            uint256 amountIn = venusBorrowTokenChangeAmount -
                venusBorrowTokenUserAmount;
            console.log("swapping excess BNB to USDC: ", amountIn);
            SwapServiceLib.swapExactNativeForTokens(
                strategyStorage.swapService,
                amountIn,
                0,
                path
            );
        } else if (venusBorrowTokenChangeAmount < venusBorrowTokenUserAmount) {
            // liquidity providing service returned less borrowToken than the user needs to pay off debt,
            // swapping some ammPairDeposit token to borrowToken
            address[] memory path = new address[](1);
            path[0] = address(strategyStorage.ammPairDepositToken);
            uint256 amountOut = venusBorrowTokenUserAmount -
                venusBorrowTokenChangeAmount;
            console.log("swapping to BNB to pay off debt: ", amountOut);
            SwapServiceLib.swapTokensForExactNative(
                strategyStorage.swapService,
                amountOut,
                ammPairDepositTokenChangeAmount,
                path
            );
        }
        InvestableLib.BINANCE_VENUS_BNB_MARKET.repayBorrow{
            value: venusBorrowTokenUserAmount
        }();

        // withdraw from the lending protocol
        uint256 venusSupplyMarketTokenUserAmount = (strategyStorage
            .venusSupplyMarket
            .balanceOf(address(this)) * investmentTokenAmountIn) /
            investmentTokenSupply;
        console.log("investmentTokenSupply", investmentTokenSupply);
        console.log(
            "venusSupplyMarketTokenUserAmount: ",
            venusSupplyMarketTokenUserAmount
        );

        uint256 venusSupplyMarketTokenChangeAmount = strategyStorage
            .venusSupplyMarket
            .balanceOf(address(this));
        console.log(
            "total balance of vBUSD on this contract:",
            strategyStorage.venusSupplyMarket.balanceOf(address(this))
        );
        console.log(
            "exchange rate: ",
            strategyStorage.venusSupplyMarket.exchangeRateCurrent()
        );
        DnsCakeStrategyCommonLib.expectNoVenusError(
            strategyStorage.venusSupplyMarket.redeem(
                venusSupplyMarketTokenUserAmount
            )
        );
        venusSupplyMarketTokenChangeAmount =
            venusSupplyMarketTokenChangeAmount -
            strategyStorage.venusSupplyMarket.balanceOf(address(this));
        console.log(
            "venusSupplyMarketTokenChangeAmount:",
            venusSupplyMarketTokenChangeAmount
        );
        console.log(
            "venusSupplyMarketTokenUserAmount:",
            venusSupplyMarketTokenUserAmount
        );
        assert(
            venusSupplyMarketTokenChangeAmount ==
                venusSupplyMarketTokenUserAmount
        );
    }

    function reapReward(
        NameValuePair[] calldata /*params*/
    ) external {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        // withdraw reward tokens
        uint256 cakeTokenChangeAmount = InvestableLib.BINANCE_CAKE.balanceOf(
            address(this)
        );
        strategyStorage.masterChef.withdraw(strategyStorage.farmId, 0);
        cakeTokenChangeAmount =
            InvestableLib.BINANCE_CAKE.balanceOf(address(this)) -
            cakeTokenChangeAmount;
        console.log("cake balance increase: ", cakeTokenChangeAmount);

        // convert reward tokens to deposit token
        address[] memory path = new address[](2);
        path[0] = address(InvestableLib.BINANCE_CAKE);
        path[1] = address(strategyStorage.depositToken);
        SwapServiceLib.swapExactTokensForTokens(
            strategyStorage.swapService,
            cakeTokenChangeAmount,
            0,
            path,
            new uint256[](0)
        );
    }

    function repayDebt(uint256 lpAmountToWithdraw, NameValuePair[] calldata)
        external
    {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        // unstaking LP tokens
        uint256 lpAmountChange = strategyStorage.swapPair.balanceOf(
            address(this)
        );
        strategyStorage.masterChef.withdraw(
            strategyStorage.farmId,
            lpAmountToWithdraw
        );
        lpAmountChange =
            strategyStorage.swapPair.balanceOf(address(this)) -
            lpAmountChange;
        assert(lpAmountToWithdraw == lpAmountChange);

        // withdrawing liquidity
        uint256 venusBorrowTokenChangeAmount = address(this).balance;
        uint256 ammPairDepositTokenChangeAmount = strategyStorage
            .ammPairDepositToken
            .balanceOf(address(this));
        strategyStorage.swapPair.approve(
            address(strategyStorage.router),
            lpAmountToWithdraw
        );
        strategyStorage.router.removeLiquidityETH(
            address(strategyStorage.ammPairDepositToken),
            lpAmountToWithdraw,
            0,
            0,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );
        ammPairDepositTokenChangeAmount =
            strategyStorage.ammPairDepositToken.balanceOf(address(this)) -
            ammPairDepositTokenChangeAmount;

        // converting ammPairDepositToken to venusBorrowToken
        address[] memory path = new address[](1);
        path[0] = address(strategyStorage.ammPairDepositToken);
        SwapServiceLib.swapExactTokensForNative(
            strategyStorage.swapService,
            ammPairDepositTokenChangeAmount,
            0,
            path
        );
        venusBorrowTokenChangeAmount =
            address(this).balance -
            venusBorrowTokenChangeAmount;

        // repay debt
        InvestableLib.BINANCE_VENUS_BNB_MARKET.repayBorrow{
            value: venusBorrowTokenChangeAmount
        }();
    }

    function increaseDebt(
        uint256 borrowTokenAmount,
        NameValuePair[] calldata params
    ) external {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        // borrow more from the lending protocol
        uint256 venusBorrowTokenBalanceChange = address(this).balance;
        DnsCakeStrategyCommonLib.expectNoVenusError(
            InvestableLib.BINANCE_VENUS_BNB_MARKET.borrow(borrowTokenAmount)
        );
        venusBorrowTokenBalanceChange =
            address(this).balance -
            venusBorrowTokenBalanceChange;
        assert(venusBorrowTokenBalanceChange == borrowTokenAmount);

        // swap venusBorrowToken to depositToken
        uint256 depositTokenBalanceChange = strategyStorage
            .depositToken
            .balanceOf(address(this));
        // assuming venusBorrowToken != depositToken
        address[] memory path = new address[](1);
        path[0] = address(strategyStorage.depositToken);
        SwapServiceLib.swapExactNativeForTokens(
            strategyStorage.swapService,
            borrowTokenAmount,
            0,
            path
        );
        depositTokenBalanceChange =
            strategyStorage.depositToken.balanceOf(address(this)) -
            depositTokenBalanceChange;

        // reinvest into the strategy
        deposit(depositTokenBalanceChange, params);
    }

    function decreaseSupply(
        uint256 supplyTokenAmount,
        NameValuePair[] calldata params
    ) external {
        DnsCakeStorage storage strategyStorage = DnsCakeStorageLib.getStorage();

        uint256 venusSupplyMarketTokenChangeAmount = strategyStorage
            .venusSupplyMarket
            .balanceOf(address(this));
        uint256 venusSupplyTokenChangeAmount = strategyStorage
            .venusSupplyToken
            .balanceOf(address(this));
        DnsCakeStrategyCommonLib.expectNoVenusError(
            strategyStorage.venusSupplyMarket.redeem(supplyTokenAmount)
        );
        venusSupplyTokenChangeAmount =
            strategyStorage.venusSupplyToken.balanceOf(address(this)) -
            venusSupplyTokenChangeAmount;
        venusSupplyMarketTokenChangeAmount =
            venusSupplyMarketTokenChangeAmount -
            strategyStorage.venusSupplyMarket.balanceOf(address(this));
        assert(venusSupplyMarketTokenChangeAmount == supplyTokenAmount);

        // reinvest into the strategy
        // assuming venusSupplyToken == depositToken
        deposit(venusSupplyTokenChangeAmount, params);
    }
}
