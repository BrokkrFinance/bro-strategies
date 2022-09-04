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

import deploymentConfig from "./deploymentConfig.json"

describe("Stargate Strategy", function () {
  let usdc: Contract
  let usdt: Contract
  let priceOracle: Contract
  let strategyUsdcStrategy: Contract
  let strategyUsdtStrategy: Contract
  let topLevelPortfolio: Contract
  let topLeveLportfolioToken: Contract

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

    let cashStrategy3 = await expectSuccess(
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

    const traderJoeStrategy = await expectSuccess(
      deployUpgradeableStrategy(
        "TraderJoe",
        "TraderJoe USDC-USDC.e Strategy Token",
        "TSUSDCe",
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
          "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe Router
          "0x4483f0b6e2f5486d06958c20f8c39a7abe87bf8f", // TraderJoe MasterChef
          "0x2a8a315e82f85d1f0658c5d66a452bbdd9356783", // TraderJoe LP Token (USDC-USDC.e)
          "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", // joeToken
        ]
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
        "0xc6964b1BAd5dB1A0052B4c71C86886377978b182",
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

    const wrapperPortfolioStargateUsdt = await deployPortfolio(
      "PercentageAllocation", // portfolioContractName
      "Wrapper Portfolio Stargate USDT Token", // investmentTokenName
      "WPSUSDT", // investmentTokenTicker
      usdc, // depositToken
      [cashStrategy2, strategyUsdtStrategy], // investables
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
      [[100000], [0, 100000]] // allocations
    )

    const wrapperPortfolioStargateUsdtToken = await contractAt(
      "InvestmentToken",
      await wrapperPortfolioStargateUsdt.getInvestmentToken()
    )
    console.log("wrapperPortfolioStargateUsdtToken.address: ", wrapperPortfolioStargateUsdtToken.address)
    console.log("wrapperPortfolioStargateUsdt.address: ", wrapperPortfolioStargateUsdt.address)

    const wrapperPortfolioTraderJoe = await deployPortfolio(
      "PercentageAllocation", // portfolioContractName
      "Wrapper Portfolio TraderJoe USDC-USDC.e", // investmentTokenName
      "WPTUSDCe", // investmentTokenTicker
      usdc, // depositToken
      [traderJoeStrategy, cashStrategy3], // investables
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

    const wrapperPortfolioTraderJoeToken = await contractAt(
      "InvestmentToken",
      await wrapperPortfolioTraderJoe.getInvestmentToken()
    )
    console.log("wrapperPortfolioTraderJoeToken.address: ", wrapperPortfolioTraderJoeToken.address)
    console.log("wrapperPortfolioTraderJoe.address: ", wrapperPortfolioTraderJoe.address)

    const wrapperPortfolioStargateUsdc = await deployPortfolio(
      "PercentageAllocation", // portfolioContractName
      "Wrapper Portfolio Stargate USDC Token", // investmentTokenName
      "WPSUSDC", // investmentTokenTicker
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

    // const cashStrategy1 = await contractAt("Cash", "0xa4eCa8F8d31d7E338BCb089414d2266611e9Fd41")
    // const cashStrategy2 = await contractAt("Cash", "0xf990608AEf5FBF9714AE9B7690cC1B7bC020A4BE")
    // const cashStrategy3 = await contractAt("Cash", "0x18872b7879bd063c6e0B159DA48E06691bcE7627")
    // const traderJoeStrategy = await contractAt("TraderJoe", "0x678dEa843B58CC568A10bE364DDB9B42D10ad571")
    // const strategyUsdcStrategy = await contractAt("Stargate", "0xEA9b02c4852156a6337bD8daAf28b5Fa2e772F93")
    // const wrapperPortfolioStargateUsdt = await contractAt(
    //   "PercentageAllocation",
    //   "0x62457666a9EA7DbC7cF1da8e5B57AC61C8e3F334"
    // )
    // const wrapperPortfolioStargateUsdc = await contractAt(
    //   "PercentageAllocation",
    //   "0xee10d1bBD8107E60381F34516459A1cAb44aB9c3"
    // )
    // const wrapperPortfolioTraderJoe = await contractAt(
    //   "PercentageAllocation",
    //   "0x0C2bC2085225c18E5a74643829B94d9b412fB372"
    // )

    topLevelPortfolio = await deployPortfolio(
      "PercentageAllocation", // portfolioContractName
      "Super Portfolio Token 1", // investmentTokenName
      "SUPP1", // investmentTokenTicker
      usdc, // depositToken
      [wrapperPortfolioStargateUsdc, wrapperPortfolioStargateUsdt, wrapperPortfolioTraderJoe], // investables
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
      [[100000], [50000, 50000], [30000, 30000, 40000]] // allocations
    )

    topLeveLportfolioToken = await contractAt("InvestmentToken", await topLevelPortfolio.getInvestmentToken())
    console.log("topLeveLportfolioToken.address: ", topLeveLportfolioToken.address)
    console.log("topLevelPortfolio.address: ", topLevelPortfolio.address)
  })

  it("Smoke test", async function () {
    const accounts = await ethers.getSigners()
    const Alice = accounts[1]
    console.log(`Alice address: ${Alice.address}`)

    const portfolioToken = await getTokenContract(topLevelPortfolio.getInvestmentToken())
    // topLevelPortfolio = await contractAt("PercentageAllocation", "0xA7Ba8a66dbf1eee34b8f7ad26457498d894e8E10")

    console.log(`portfolioToken address: ${portfolioToken.address}`)
    console.log(`topLevelPortfolio address: ${topLevelPortfolio.address}`)

    await usdc.connect(Alice).approve(topLevelPortfolio.address, "2000000")
    console.log(`after approving`)
    await new Promise((f) => setTimeout(f, 5000))
    await topLevelPortfolio.connect(Alice).deposit("2000000", Alice.address, [])
    await new Promise((f) => setTimeout(f, 5000))
    console.log("Alice investing 2 usdc into the portfolio", usdc.address, topLevelPortfolio.address)
    await portfolioToken.connect(Alice).approve(topLevelPortfolio.address, "1000000")
    await new Promise((f) => setTimeout(f, 5000))
    await topLevelPortfolio.connect(Alice).withdraw("1000000", Alice.address, [])

    console.log(`Alice successfully withdrew 0.5 Portfolio tokens`)
  })
})
