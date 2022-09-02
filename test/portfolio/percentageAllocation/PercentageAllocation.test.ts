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

testPortfolio("PercentageAllocation Portfolio", deployPortfolio, [])

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
