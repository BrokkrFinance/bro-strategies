import { BigNumber, providers } from "ethers"
import { ethers } from "hardhat"

import {
  ContractAddrs,
  deployPriceOracle,
  deployProxyContract,
  deployUpgradeableStrategy,
  expectSuccess,
  getExecutionCostInUsd,
  getExecutionGasAmount,
  getTokenContract,
  getUsdcContract,
  increaseEvmTimeBySeconds,
} from "../helper"
type TransactionResponse = providers.TransactionResponse

ContractAddrs
BigNumber
deployPriceOracle
deployProxyContract
deployUpgradeableStrategy
expectSuccess
getUsdcContract
getTokenContract
getExecutionCostInUsd
getExecutionGasAmount
increaseEvmTimeBySeconds

describe("DNS Vector", function () {
  this.timeout(60 * 60 * 1000)

  it("Smoke test", async function () {
    // setup accounts
    const accounts = await ethers.getSigners()
    const Alice = accounts[0].address

    let impersonatedSigner = await expectSuccess(
      ethers.getImpersonatedSigner("0x4aeFa39caEAdD662aE31ab0CE7c8C2c9c0a013E8")
    )
    const usdcContract = await expectSuccess(getUsdcContract())

    let tx = await expectSuccess(
      impersonatedSigner.sendTransaction({
        to: Alice,
        value: ethers.utils.parseEther("10000"),
      })
    )
    await expectSuccess(usdcContract.connect(impersonatedSigner).transfer(Alice, ethers.utils.parseUnits("20000", 6)))

    // depoloy contracts
    const priceOracle = await expectSuccess(
      deployPriceOracle("GmxOracle", ContractAddrs.gmxOracle, (await getUsdcContract()).address)
    )

    const strategy = await getUsdcStrategy(priceOracle)
    const depositAmount = ethers.utils.parseUnits("10000", 6)
    await expectSuccess(usdcContract.approve(strategy.address, depositAmount))
    let transactionResponse: TransactionResponse = await expectSuccess(strategy.deposit(depositAmount, Alice, []))
    console.log("deposit cost in USD: ", await getExecutionCostInUsd(transactionResponse))
    console.log("deposit cost in Gas: ", await getExecutionGasAmount(transactionResponse))
    console.log("Asset Balances after deposit: ", JSON.stringify(await strategy.getAssetBalances()))

    console.log("getting minimum total AUM before: ")
    console.log(((await expectSuccess(strategy.getEquityValuation(false, false))) as BigInt).toString())
    console.log("getting maximum total AUM before: ")
    console.log(((await expectSuccess(strategy.getEquityValuation(true, false))) as BigInt).toString())

    console.log("**** withdrawal ****")
    const investmentTokenBalance = await strategy.getInvestmentTokenBalanceOf(Alice)
    const investmentToken = await getTokenContract(await strategy.getInvestmentToken())
    const withdrawAmount = Math.floor(investmentTokenBalance)
    investmentToken.approve(strategy.address, withdrawAmount)
    transactionResponse = await expectSuccess(strategy.withdraw(withdrawAmount, Alice, []))
    console.log("withdraw cost in USD: ", await getExecutionCostInUsd(transactionResponse))
    console.log("withdraw cost in Gas: ", await getExecutionGasAmount(transactionResponse))

    // await increaseEvmTimeBySeconds(3600 * 24)
    // console.log("getting total AUM after: ")
    // await expectSuccess(strategy.getEquityValuation(false, false))

    // reaping rewards

    // console.log("Investment token supply before reaping rewards: ", await strategy.getInvestmentTokenSupply())
    // await ethers.provider.send("evm_increaseTime", [3600 * 48])
    // await ethers.provider.send("evm_mine", [])
    // await expectSuccess(strategy.processReward([], []))
    // console.log("Investment token supply after reaping rewards: ", await strategy.getInvestmentTokenSupply())
  })
})

async function getUsdcStrategy(priceOracle: any) {
  const accounts = await ethers.getSigners()
  const Alice = accounts[0].address

  const usdcContract = await expectSuccess(getUsdcContract())

  const DnsVectorStrategyAumLib = await ethers.getContractFactory("DnsVectorStrategyAumLib")
  const dnsVectorStrategyAumLib = await DnsVectorStrategyAumLib.deploy()

  const DnsVectorStrategyInvestmentLib = await ethers.getContractFactory("DnsVectorStrategyInvestmentLib")
  const dnsVectorStrategyInvestmentLib = await DnsVectorStrategyInvestmentLib.deploy()

  const libraries = {
    DnsVectorStrategyAumLib: dnsVectorStrategyAumLib.address,
    DnsVectorStrategyInvestmentLib: dnsVectorStrategyInvestmentLib.address,
  }

  return await expectSuccess(
    deployUpgradeableStrategy(
      "DnsVectorStrategy",
      "Super Strategy Token 2",
      "SUP2",
      usdcContract,
      0,
      [],
      0,
      [],
      0,
      [],
      "0xce70b9444c4e22ae150C81dA7375542B49D15efA", // fee receiver
      [],
      BigInt(10 ** 20),
      BigInt(10 ** 20),
      priceOracle.address,
      0,
      "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // swap service address
      [
        { role: "0x0000000000000000000000000000000000000000000000000000000000000000", users: [Alice] },
        { role: "0x7935bd0ae54bc31f548c14dba4d37c5c64b3f8ca900cb468fb8abd54d5894f55", users: [Alice] },
        { role: "0x17a8e30262c1f919c33056d877a3c22b95c2f5e4dac44683c1c2323cd79fbdb0", users: [Alice] },
        { role: "0x339759585899103d2ace64958e37e18ccb0504652c81d4a1b8aa80fe2126ab95", users: [Alice] },
        { role: "0x88aa719609f728b0c5e7fb8dd3608d5c25d497efbb3b9dd64e9251ebba101508", users: [Alice] },
        { role: "0x139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d", users: [Alice] },
      ],
      [
        [
          800, // safetyFactor
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // aaveSupplyToken
          "0x625E7708f30cA75bfd92586e17077590C60eb4cD", // aAaveSupplyToken
          "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // aaveBorrowToken
          "0x4a1c3aD6Ed28a636ee1751C69071f6be75DEb8B8", // vAaveBorrowToken
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // ammPairDepositToken
          "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", // Joe token
          "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave pool
          "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654", // Aave protocol data provider
          "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe router
          "0xf4003F4efBE8691B60249E6afbD307aBE7758adb", // TraderJeo pair (same as the LP token in TraderJoe's implementation)
          "0x9ef319429c4d32bc98957881723070dbca036b39", // Vector pool helper joe (call getPoolInfo on MainStaking: 0x0E25c07748f727D6CCcD7D2711fD7bD13d13422d)
        ],
      ],
      libraries
    )
  )
}

async function getUsdtStrategy(priceOracle: any) {
  const usdcContract = await expectSuccess(getUsdcContract())

  // return await expectSuccess(
  //   deployUpgradeableStrategy(
  //     "DnsVectorStrategy",
  //     "Super Strategy Token 2",
  //     "SUP2",
  //     usdcContract,
  //     0,
  //     [],
  //     0,
  //     [],
  //     0,
  //     [],
  //     "0xce70b9444c4e22ae150C81dA7375542B49D15efA", // fee receiver
  //     [],
  //     BigInt(10 ** 20),
  //     BigInt(10 ** 20),
  //     priceOracle.address,
  //     0,
  //     "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // swap service address
  //     [
  //       [
  //         800, // safetyFactor
  //         "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // aaveSupplyToken
  //         "0x625E7708f30cA75bfd92586e17077590C60eb4cD", // aAaveSupplyToken
  //         "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // aaveBorrowToken
  //         "0x4a1c3aD6Ed28a636ee1751C69071f6be75DEb8B8", // vAaveBorrowToken
  //         "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // ammPairDepositToken
  //         "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", // Joe token
  //         "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave pool
  //         "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654", // Aave protocol data provider
  //         "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe router
  //         "0xbb4646a764358ee93c2a9c4a147d5aDEd527ab73", // TraderJeo pair (same as the LP token in TraderJoe's implementation)
  //         "0x9448e1Aec49Fe041643AEd614F04b0F7eB391126", // Vector pool helper joe
  //       ],
  //     ]
  //   )
  // )
}
