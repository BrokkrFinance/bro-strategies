import { ethers } from "hardhat"
import { BigNumber, Contract } from "ethers"
import {
  ContractAddrs,
  contractAt,
  deployPriceOracle,
  deployUpgradeableStrategy,
  deployPortfolio,
  expectSuccess,
  getTokenContract,
  getUsdcContract,
  getUsdtContract,
} from "./helper"

describe("Stargate Strategy", function () {
  let usdc: Contract
  let usdt: Contract
  let priceOracle: Contract
  let strategyUsdcStrategy: Contract
  let strategyUsdtStrategy: Contract

  before(async function () {
    usdc = await expectSuccess(getUsdcContract())
    usdt = await expectSuccess(getUsdtContract())
    priceOracle = await expectSuccess(deployPriceOracle(ContractAddrs.aaveOracle, (await getUsdcContract()).address))

    let cashStrategy1 = await expectSuccess(
      deployUpgradeableStrategy(
        "Cash",
        "Cash Strategy Token",
        "CASH",
        usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        "0x3f19dC970eF894c57aE4c8b09F842823b3d79772",
        [],
        BigInt(10 ** 20),
        BigInt(10 ** 20),
        priceOracle.address,
        0,
        "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe Router v2
        []
      )
    )

    let cashStrategy2 = await expectSuccess(
      deployUpgradeableStrategy(
        "Cash",
        "Cash Strategy Token",
        "CASH",
        usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        "0x3f19dC970eF894c57aE4c8b09F842823b3d79772",
        [],
        BigInt(10 ** 20),
        BigInt(10 ** 20),
        priceOracle.address,
        0,
        "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe Router v2
        []
      )
    )

    strategyUsdcStrategy = await expectSuccess(
      deployUpgradeableStrategy(
        "Stargate",
        "Stargate USDC Strategy Token",
        "SSUSDC",
        usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        "0x3f19dC970eF894c57aE4c8b09F842823b3d79772",
        [],
        BigInt(10 ** 20),
        BigInt(10 ** 20),
        priceOracle.address,
        0,
        "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe Router v2
        [
          "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd", // Stargate Router
          "0x1205f31718499dBf1fCa446663B532Ef87481fe1", // Stargate USDC Pool
          "0x8731d54e9d02c286767d56ac03e8037c07e01e98", // Stargate LP Staking
          "0x1205f31718499dBf1fCa446663B532Ef87481fe1", // Stargate LP Token (S*USDC)
          "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590", // Stargate Token (STG)
        ]
      )
    )
    strategyUsdtStrategy = await expectSuccess(
      deployUpgradeableStrategy(
        "Stargate",
        "Stargate USDT Strategy Token",
        "SSUSDT",
        usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        "0x3f19dC970eF894c57aE4c8b09F842823b3d79772",
        [],
        BigInt(10 ** 20),
        BigInt(10 ** 20),
        priceOracle.address,
        0,
        "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe Router v2
        [
          "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd", // Stargate Router
          "0x29e38769f23701A2e4A8Ef0492e19dA4604Be62c", // Stargate USDT Pool
          "0x8731d54e9d02c286767d56ac03e8037c07e01e98", // Stargate LP Staking
          "0x29e38769f23701A2e4A8Ef0492e19dA4604Be62c", // Stargate LP Token (S*USDT)
          "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590", // Stargate Token (STG)
        ]
      )
    )

    const wrapperPortfolioStargateUsdc = await deployPortfolio(
      "MockPortfolio", // portfolioContractName
      "Wrapper Portfolio Stargate USDC Token", // investnemtTokenName
      "WPSUSDC", // investnemtTokenTicker
      usdc, // depositToken
      [strategyUsdcStrategy, cashStrategy1], // investables
      0, // depositFee
      [], // depositFeeParams
      0, // withdrawalFee
      [], // withdrawalFeeParams
      0, // performanceFee
      [], // performanceFeeParams
      "0x3f19dC970eF894c57aE4c8b09F842823b3d79772", // feeReceiver
      [], // feeReceiverParams
      BigInt(10 ** 20), // totalInvestmentLimit
      BigInt(10 ** 20), // investmentLimitPerAddress
      [[100000], [100000, 0]] // allocations
    )

    const wrapperPortfolioStargateUsdcToken = await contractAt(
      "InvestmentToken",
      await wrapperPortfolioStargateUsdc.getInvestmentToken()
    )
    console.log("wrapperPortfolioStargateUsdcToken.address: ", wrapperPortfolioStargateUsdcToken.address)
    console.log("wrapperPortfolioStargateUsdc.address: ", wrapperPortfolioStargateUsdc.address)

    const wrapperPortfolioStargateUsdt = await deployPortfolio(
      "MockPortfolio", // portfolioContractName
      "Wrapper Portfolio Stargate USDT Token", // investnemtTokenName
      "WPSUSDT", // investnemtTokenTicker
      usdc, // depositToken
      [strategyUsdtStrategy, cashStrategy2], // investables
      0, // depositFee
      [], // depositFeeParams
      0, // withdrawalFee
      [], // withdrawalFeeParams
      0, // performanceFee
      [], // performanceFeeParams
      "0x3f19dC970eF894c57aE4c8b09F842823b3d79772", // feeReceiver
      [], // feeReceiverParams
      BigInt(10 ** 20), // totalInvestmentLimit
      BigInt(10 ** 20), // investmentLimitPerAddress
      [[100000], [50000, 50000]] // allocations
    )

    const wrapperPortfolioStargateUsdtToken = await contractAt(
      "InvestmentToken",
      await wrapperPortfolioStargateUsdt.getInvestmentToken()
    )
    console.log("portfolioToken.address: ", wrapperPortfolioStargateUsdtToken.address)
    console.log("portfolio.address: ", wrapperPortfolioStargateUsdt.address)

    const topLevelPortfolio = await deployPortfolio(
      "MockPortfolio", // portfolioContractName
      "Super Portfolio Token 1", // investnemtTokenName
      "SUPP1", // investnemtTokenTicker
      usdc, // depositToken
      [wrapperPortfolioStargateUsdc, wrapperPortfolioStargateUsdt], // investables
      0, // depositFee
      [], // depositFeeParams
      0, // withdrawalFee
      [], // withdrawalFeeParams
      0, // performanceFee
      [], // performanceFeeParams
      "0x3f19dC970eF894c57aE4c8b09F842823b3d79772", // feeReceiver
      [], // feeReceiverParams
      BigInt(10 ** 20), // totalInvestmentLimit
      BigInt(10 ** 20), // investmentLimitPerAddress
      [[100000], [50000, 50000]] // allocations
    )

    const topLeveLportfolioToken = await contractAt("InvestmentToken", await topLevelPortfolio.getInvestmentToken())
    console.log("topLeveLportfolioTokenToken.address: ", topLeveLportfolioToken.address)
    console.log("topLevelPortfolio.address: ", topLevelPortfolio.address)
  })

  it("Smoke test", async function () {
    const Alice = "0x4d43FC6a2f227b9b1f04B062B1248CF3062DCA5c"
  })
})
