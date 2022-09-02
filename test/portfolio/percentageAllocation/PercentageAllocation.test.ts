import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import { TokenAddrs, StargateAddrs, TraderJoeAddrs } from "../../shared/addresses"
import {
  getUUPSUpgradeableContract,
  getUUPSUpgradeableStrategy,
  getUUPSUpgradeablePortfolio,
} from "../../shared/contracts"
import { Oracles } from "../../shared/oracles"
import { SwapServices } from "../../shared/swaps"
import { testPortfolio } from "../Unified.test"

testPortfolio("PercentageAllocation Portfolio", deployPortfolio, [testPercentageAllocationPortfolioUpgradeable])

async function deployPortfolio(context: Mocha.Context) {
  // Contract factories.
  const InvestmentToken = await ethers.getContractFactory("InvestmentToken")
  const Cash = await ethers.getContractFactory("Cash")
  const Stargate = await ethers.getContractFactory("Stargate")
  const TraderJoe = await ethers.getContractFactory("TraderJoe")
  const PercentageAllocationPortfolio = await ethers.getContractFactory("PercentageAllocation")

  // Price oracles.
  const GmxOracle = await ethers.getContractFactory(Oracles.gmx.name)
  const gmxOracle = await upgrades.deployProxy(GmxOracle, [Oracles.gmx.address, context.usdc.address], {
    kind: "uups",
  })
  await gmxOracle.deployed()

  const AaveOracle = await ethers.getContractFactory(Oracles.aave.name)
  const aaveOracle = await upgrades.deployProxy(AaveOracle, [Oracles.aave.address, context.usdc.address], {
    kind: "uups",
  })
  await aaveOracle.deployed()

  // Cash strategy.
  let investmentToken = await getUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "IVST"])
  context.cash = await getUUPSUpgradeableStrategy(
    Cash,
    [
      [
        investmentToken.address,
        TokenAddrs.usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        context.owner.address,
        [],
        BigInt(1e20),
        BigInt(1e20),
        gmxOracle.address,
        SwapServices.traderjoe.provider,
        SwapServices.traderjoe.router,
      ],
    ],
    investmentToken
  )

  // Stargate USDC wrapper portfolio.
  investmentToken = await getUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "IVST"])
  context.stargateUsdc = await getUUPSUpgradeableStrategy(
    Stargate,
    [
      [
        investmentToken.address,
        TokenAddrs.usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        context.owner.address,
        [],
        BigInt(1e20),
        BigInt(1e20),
        gmxOracle.address,
        SwapServices.traderjoe.provider,
        SwapServices.traderjoe.router,
      ],
      StargateAddrs.router,
      StargateAddrs.usdcPool,
      StargateAddrs.lpStaking,
      StargateAddrs.usdcLpToken,
      StargateAddrs.stgToken,
    ],
    investmentToken
  )

  investmentToken = await getUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "IVST"])
  context.stargateUsdcPortfolio = await getUUPSUpgradeablePortfolio(
    PercentageAllocationPortfolio,
    [
      [
        investmentToken.address,
        TokenAddrs.usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        context.owner.address,
        [],
        BigInt(1e20),
        BigInt(1e20),
      ],
    ],
    investmentToken,
    [context.cash, context.stargateUsdc],
    [[100000], [0, 100000]]
  )

  // Stargate USDT wrapper portfolio.
  investmentToken = await getUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "IVST"])
  context.stargateUsdt = await getUUPSUpgradeableStrategy(
    Stargate,
    [
      [
        investmentToken.address,
        TokenAddrs.usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        context.owner.address,
        [],
        BigInt(1e20),
        BigInt(1e20),
        aaveOracle.address,
        SwapServices.traderjoe.provider,
        SwapServices.traderjoe.router,
      ],
      StargateAddrs.router,
      StargateAddrs.usdtPool,
      StargateAddrs.lpStaking,
      StargateAddrs.usdtLpToken,
      StargateAddrs.stgToken,
    ],
    investmentToken
  )

  investmentToken = await getUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "IVST"])
  context.stargateUsdtPortfolio = await getUUPSUpgradeablePortfolio(
    PercentageAllocationPortfolio,
    [
      [
        investmentToken.address,
        TokenAddrs.usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        context.owner.address,
        [],
        BigInt(1e20),
        BigInt(1e20),
      ],
    ],
    investmentToken,
    [context.cash, context.stargateUsdt],
    [[100000], [0, 100000]]
  )

  // TraderJoe USDC-USDC.e wrapper portfolio.
  investmentToken = await getUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "IVST"])
  context.traderjoe = await getUUPSUpgradeableStrategy(
    TraderJoe,
    [
      [
        investmentToken.address,
        TokenAddrs.usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        context.owner.address,
        [],
        BigInt(1e20),
        BigInt(1e20),
        aaveOracle.address,
        SwapServices.traderjoe.provider,
        SwapServices.traderjoe.router,
      ],
      TraderJoeAddrs.router,
      TraderJoeAddrs.masterChef,
      TraderJoeAddrs.lpToken,
      TraderJoeAddrs.joeToken,
    ],
    investmentToken
  )

  investmentToken = await getUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "IVST"])
  context.traderjoePortfolio = await getUUPSUpgradeablePortfolio(
    PercentageAllocationPortfolio,
    [
      [
        investmentToken.address,
        TokenAddrs.usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        context.owner.address,
        [],
        BigInt(1e20),
        BigInt(1e20),
      ],
    ],
    investmentToken,
    [context.cash, context.traderjoe],
    [[100000], [0, 100000]]
  )

  // PercentageAllocation portfolio.
  investmentToken = await getUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "IVST"])
  const portfolio = await getUUPSUpgradeablePortfolio(
    PercentageAllocationPortfolio,
    [
      [
        investmentToken.address,
        TokenAddrs.usdc,
        context.depositFee,
        context.depositFeeParams,
        context.withdrawalFee,
        context.withdrawalFeeParams,
        context.performanceFee,
        context.performanceFeeParams,
        context.feeReceiver,
        context.feeReceiverParams,
        context.totalInvestmentLimit,
        context.investmentLimitPerAddress,
      ],
    ],
    investmentToken,
    [context.stargateUsdcPortfolio, context.stargateUsdtPortfolio, context.traderjoePortfolio],
    [[100000], [50000, 50000], [30000, 30000, 40000]]
  )

  return portfolio
}

function testPercentageAllocationPortfolioUpgradeable() {
  describe("Upgradeable - PercentageAllocation Portfolio Specific", async function () {
    it("should success to leave all portfolio specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.portfolio.getAssetBalances()
      const assetValuationsBefore = await this.portfolio.getAssetValuations(true, false)
      const equityValuationBefore = await this.portfolio.getEquityValuation(true, false)

      const PortfolioV2 = await ethers.getContractFactory("PercentageAllocationV2")
      const portfolioV2 = await upgrades.upgradeProxy(this.portfolio.address, PortfolioV2, {
        call: {
          fn: "initialize",
          args: [
            [
              this.investmentToken.address,
              TokenAddrs.usdc,
              this.depositFee,
              this.depositFeeParams,
              this.withdrawalFee,
              this.withdrawalFeeParams,
              this.performanceFee,
              this.performanceFeeParams,
              this.feeReceiver,
              this.feeReceiverParams,
              this.totalInvestmentLimit,
              this.investmentLimitPerAddress,
            ],
          ],
        },
      })
      await portfolioV2.deployed()

      // IAum.
      const assetBalancesAfter = await this.portfolio.getAssetBalances()
      const assetValuationsAfter = await this.portfolio.getAssetValuations(true, false)
      const equityValuationAfter = await this.portfolio.getEquityValuation(true, false)

      // IAum.
      expect(assetBalancesBefore[0].asset).to.equal(assetBalancesAfter[0].asset)
      expect(assetBalancesBefore[0].balance).to.equal(assetBalancesAfter[0].balance)

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore[0].asset).to.equal(assetValuationsAfter[0].asset)
      expect(assetValuationsBefore[0].valuation).to.equal(assetValuationsAfter[0].valuation)

      expect(await this.portfolio.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(equityValuationBefore.eq(equityValuationAfter)).to.equal(true)

      // IInvestable.
      expect(await this.portfolio.name()).to.equal(
        "block42.percentage_allocation_portfolio.percentage_allocation_portfolio_v2.0.0"
      )
      expect(await this.portfolio.humanReadableName()).to.equal("Percentage allocation portfolio")
      expect(await this.portfolio.version()).to.equal("2.0.0")
    })
  })
}
