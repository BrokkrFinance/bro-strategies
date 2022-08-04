import { providers } from "ethers"
import { ethers } from "hardhat"

import {
  deployProxyContract,
  deployStrategy,
  expectSuccess,
  getExecutionCostInUsd,
  getExecutionGasAmount,
  getTokenContract,
  getUsdcContract,
  increaseEvmTimeBySeconds,
} from "./helper"
type TransactionResponse = providers.TransactionResponse

deployProxyContract
deployStrategy
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
      deployProxyContract("GmxOracle", [
        "0x81b7e71a1d9e08a6ca016a0f4d6fa50dbce89ee3",
        "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      ])
    )

    const strategy = await expectSuccess(
      deployStrategy("DnsVectorStrategy", "Super Strategy Token 2", "SUP2", usdcContract, 0, 0, 0, [
        [
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // Usdc
          "0x625E7708f30cA75bfd92586e17077590C60eb4cD", // wAave usdc supply token
          "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // wAvax
          "0x4a1c3aD6Ed28a636ee1751C69071f6be75DEb8B8", // Aave variable wAvax debt token
          "0xf4003f4efbe8691b60249e6afbd307abe7758adb", // Usdc wAvax joe lp token
          "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", // Joe token
          priceOracle.address, // price oracle
          "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave pool
          "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654", // Aave protocol data provider
          "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe router
          "0xf4003F4efBE8691B60249E6afbD307aBE7758adb", // TraderJeo pair (same as the LP token in TraderJoe's implementation)
          "0x9ef319429c4d32bc98957881723070dbca036b39", // Vector pool helper joe
        ], // Aave data provider
      ])
    )

    console.log("Assets before deposit: ", JSON.stringify(await strategy.getAssets()))

    const depositAmount = ethers.utils.parseUnits("10000", 6)
    await expectSuccess(usdcContract.approve(strategy.address, depositAmount))
    let transactionResponse: TransactionResponse = await expectSuccess(strategy.deposit(depositAmount, []))
    console.log("deposit cost in USD: ", await getExecutionCostInUsd(transactionResponse))
    console.log("deposit cost in Gas: ", await getExecutionGasAmount(transactionResponse))

    console.log("Assets after deposit: ", JSON.stringify(await strategy.getAssets()))

    console.log("getting minimum total AUM before: ")
    await expectSuccess(strategy.getEquityValuation(false, false))
    console.log("getting maximum total AUM before: ")
    await expectSuccess(strategy.getEquityValuation(true, false))
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
