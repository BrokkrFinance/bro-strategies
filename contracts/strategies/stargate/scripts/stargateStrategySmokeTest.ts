import { ethers } from "hardhat"
import { BigNumber, Contract } from "ethers"
import { TransactionReceipt } from "@ethersproject/providers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import {
  ContractAddrs,
  deployPriceOracle,
  deployUpgradeableStrategy,
  expectSuccess,
  getTokenContract,
  getUsdcContract,
  getUsdtContract,
} from "../../../../scripts/helper"

function printGasUsedAndCost(action: String, txReceipt: TransactionReceipt) {
  const gasUsed = txReceipt.cumulativeGasUsed
  const gasCost = txReceipt.cumulativeGasUsed.mul(txReceipt.effectiveGasPrice)
  console.log(`${action} gas used: ${gasUsed}, gas cost: ${gasCost}`)
}

async function printTokenBalances(tokens: [String, Contract][], owners: [String, String][]) {
  console.log("-----------------------------------------------------------------------")
  for (let i = 0; i < tokens.length; i++) {
    for (let j = 0; j < owners.length; j++) {
      console.log(`${tokens[i][0]} balance of ${owners[j][0]} is ${await tokens[i][1].balanceOf(owners[j][1])}`)
    }
  }
  console.log("-----------------------------------------------------------------------")
}

describe("Stargate Strategy", function () {
  let accounts: SignerWithAddress[]
  let usdc: Contract
  let usdt: Contract
  let priceOracle: Contract
  let strategyUsdcStrategy: Contract
  let strategyUsdtStrategy: Contract
  let strategy: Contract
  let strategyUsdcLpToken: Contract
  let strategyUsdtLpToken: Contract
  let strategyToken: Contract
  let stargateToken: Contract
  let impersonatedSigner: SignerWithAddress

  before(async function () {
    accounts = await ethers.getSigners()
    usdc = await expectSuccess(getUsdcContract())
    usdt = await expectSuccess(getUsdtContract())
    priceOracle = await expectSuccess(deployPriceOracle(ContractAddrs.aaveOracle, (await getUsdcContract()).address))
    strategyUsdcStrategy = await expectSuccess(
      deployUpgradeableStrategy(
        "Stargate",
        "Stargate Strategy Token",
        "SUST",
        usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        accounts[0].address,
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
        "Stargate Strategy Token",
        "SUST",
        usdc,
        0,
        [],
        0,
        [],
        0,
        [],
        accounts[0].address,
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
    // NOTE: Choose USDC or USDT strategy to test.
    // strategy = strategyUsdcStrategy
    strategy = strategyUsdtStrategy

    strategyUsdcLpToken = await getTokenContract("0x1205f31718499dBf1fCa446663B532Ef87481fe1")
    strategyUsdtLpToken = await getTokenContract("0x29e38769f23701A2e4A8Ef0492e19dA4604Be62c")
    strategyToken = await getTokenContract(strategy.getInvestmentToken())
    stargateToken = await getTokenContract("0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590")
    impersonatedSigner = await expectSuccess(ethers.getImpersonatedSigner("0x4aeFa39caEAdD662aE31ab0CE7c8C2c9c0a013E8"))
  })

  it("Smoke test", async function () {
    const Alice = accounts[1]
    await expectSuccess(
      impersonatedSigner.sendTransaction({
        to: Alice.address,
        value: ethers.utils.parseEther("1000000"),
      })
    )
    await expectSuccess(usdc.connect(impersonatedSigner).transfer(Alice.address, ethers.utils.parseUnits("1000.0", 6)))

    const Bob = accounts[2]
    await expectSuccess(
      impersonatedSigner.sendTransaction({
        to: Bob.address,
        value: ethers.utils.parseEther("1000000"),
      })
    )
    await expectSuccess(usdc.connect(impersonatedSigner).transfer(Bob.address, ethers.utils.parseUnits("1000.0", 6)))

    const Charlie = accounts[3]
    await expectSuccess(
      impersonatedSigner.sendTransaction({
        to: Charlie.address,
        value: ethers.utils.parseEther("1000000"),
      })
    )
    await expectSuccess(
      usdc.connect(impersonatedSigner).transfer(Charlie.address, ethers.utils.parseUnits("1000.0", 6))
    )

    const Dave = accounts[4]
    await expectSuccess(
      impersonatedSigner.sendTransaction({
        to: Dave.address,
        value: ethers.utils.parseEther("1000000"),
      })
    )
    await expectSuccess(usdc.connect(impersonatedSigner).transfer(Dave.address, ethers.utils.parseUnits("1000.0", 6)))

    const tokens: [String, Contract][] = [
      ["USDC", usdc],
      ["USDT", usdt],
      ["StrategyToken", strategyToken],
      ["S*USDC", strategyUsdcLpToken],
      ["S*USDT", strategyUsdtLpToken],
      ["STG", stargateToken],
    ]
    const owners: [String, String][] = [
      ["StrategyContract", strategy.address],
      ["Alice", Alice.address],
      ["Bob", Bob.address],
      ["Charlie", Charlie.address],
      ["Dave", Dave.address],
    ]

    await printTokenBalances(tokens, owners)

    const aliceUsdcBalance = await usdc.balanceOf(Alice.address)
    await expectSuccess(usdc.connect(Alice).approve(strategy.address, aliceUsdcBalance))
    await expectSuccess(strategy.connect(Alice).deposit(aliceUsdcBalance, Alice.address, []))
    console.log("Alice USDC approve and deposit success")
    await printTokenBalances(tokens, owners)

    const bobUsdcBalance = await usdc.balanceOf(Bob.address)
    await expectSuccess(usdc.connect(Bob).approve(strategy.address, bobUsdcBalance))
    await expectSuccess(strategy.connect(Bob).deposit(bobUsdcBalance, Bob.address, []))
    console.log("Bob USDC approve and deposit success")
    await printTokenBalances(tokens, owners)

    const charlieUsdcBalance = await usdc.balanceOf(Charlie.address)
    await expectSuccess(usdc.connect(Charlie).approve(strategy.address, charlieUsdcBalance))
    await expectSuccess(strategy.connect(Charlie).deposit(charlieUsdcBalance, Charlie.address, []))
    console.log("Charlie USDC approve and deposit success")
    await printTokenBalances(tokens, owners)

    const daveUsdcBalance = await usdc.balanceOf(Dave.address)
    await expectSuccess(usdc.connect(Dave).approve(strategy.address, daveUsdcBalance))
    await expectSuccess(strategy.connect(Dave).deposit(daveUsdcBalance, Dave.address, []))
    console.log("Dave USDC approve and deposit success")
    await printTokenBalances(tokens, owners)

    await expectSuccess(strategy.processReward([], []))
    console.log("ProcessReward success")
    await printTokenBalances(tokens, owners)

    const aliceStrategyTokenBalance = await strategyToken.balanceOf(Alice.address)
    await expectSuccess(strategyToken.connect(Alice).approve(strategy.address, aliceStrategyTokenBalance))
    await expectSuccess(strategy.connect(Alice).withdraw(aliceStrategyTokenBalance, Alice.address, []))
    console.log("Alice StrategyToken approve and withdraw")
    await printTokenBalances(tokens, owners)

    const bobStrategyTokenBalance = await strategyToken.balanceOf(Bob.address)
    await expectSuccess(strategyToken.connect(Bob).approve(strategy.address, bobStrategyTokenBalance))
    await expectSuccess(strategy.connect(Bob).withdraw(bobStrategyTokenBalance, Bob.address, []))
    console.log("Bob StrategyToken approve and withdraw")
    await printTokenBalances(tokens, owners)

    const charlieStrategyTokenBalance = await strategyToken.balanceOf(Charlie.address)
    await expectSuccess(strategyToken.connect(Charlie).approve(strategy.address, charlieStrategyTokenBalance))
    await expectSuccess(strategy.connect(Charlie).withdraw(charlieStrategyTokenBalance, Charlie.address, []))
    console.log("Charlie StrategyToken approve and withdraw")
    await printTokenBalances(tokens, owners)

    const daveStrategyTokenBalance = await strategyToken.balanceOf(Dave.address)
    await expectSuccess(strategyToken.connect(Dave).approve(strategy.address, daveStrategyTokenBalance))
    await expectSuccess(strategy.connect(Dave).withdraw(daveStrategyTokenBalance, Dave.address, []))
    console.log("Dave StrategyToken approve and withdraw")
    await printTokenBalances(tokens, owners)
  })

  it("Gas used and cost", async function () {
    const Erin = accounts[5]
    await expectSuccess(
      impersonatedSigner.sendTransaction({
        to: Erin.address,
        value: ethers.utils.parseEther("1000000"),
      })
    )
    await expectSuccess(
      usdc.connect(impersonatedSigner).transfer(Erin.address, ethers.utils.parseUnits("1000000.0", 6))
    )

    const usdcBalance = await usdc.balanceOf(Erin.address)
    const usdcApproveTx = await usdc.connect(Erin).approve(strategy.address, usdcBalance)
    const usdcApproveTxReceipt = await usdcApproveTx.wait()
    await printGasUsedAndCost("USDC approve", usdcApproveTxReceipt)

    const usdcDepositTx = await strategy.connect(Erin).deposit(usdcBalance, Erin.address, [])
    const usdcDepositTxReceipt = await usdcDepositTx.wait()
    await printGasUsedAndCost("USDC deposit", usdcDepositTxReceipt)

    const processRewardTx = await strategy.connect(Erin).processReward([], [])
    const processRewardTxReceipt = await processRewardTx.wait()
    await printGasUsedAndCost("ProcessReward", processRewardTxReceipt)

    const strategyTokenBalance = await strategyToken.balanceOf(Erin.address)
    const strategyTokenApproveTx = await strategyToken.connect(Erin).approve(strategy.address, strategyTokenBalance)
    const strategyTokenApproveTxReceipt = await strategyTokenApproveTx.wait()
    await printGasUsedAndCost("StrategyToken approve", strategyTokenApproveTxReceipt)

    const strategyTokenWithdrawTx = await strategy.connect(Erin).withdraw(strategyTokenBalance, Erin.address, [])
    const strategyTokenWithdrawTxReceipt = await strategyTokenWithdrawTx.wait()
    await printGasUsedAndCost("StrategyToken withdraw", strategyTokenWithdrawTxReceipt)

    let totalGasUsed = BigNumber.from(0)
    totalGasUsed = totalGasUsed.add(usdcApproveTxReceipt.cumulativeGasUsed)
    totalGasUsed = totalGasUsed.add(usdcDepositTxReceipt.cumulativeGasUsed)
    totalGasUsed = totalGasUsed.add(processRewardTxReceipt.cumulativeGasUsed)
    totalGasUsed = totalGasUsed.add(strategyTokenApproveTxReceipt.cumulativeGasUsed)
    totalGasUsed = totalGasUsed.add(strategyTokenWithdrawTxReceipt.cumulativeGasUsed)

    let totalGasCost = BigNumber.from(0)
    totalGasCost = totalGasCost.add(usdcApproveTxReceipt.cumulativeGasUsed.mul(usdcApproveTxReceipt.effectiveGasPrice))
    totalGasCost = totalGasCost.add(usdcDepositTxReceipt.cumulativeGasUsed.mul(usdcDepositTxReceipt.effectiveGasPrice))
    totalGasCost = totalGasCost.add(
      processRewardTxReceipt.cumulativeGasUsed.mul(processRewardTxReceipt.effectiveGasPrice)
    )
    totalGasCost = totalGasCost.add(
      strategyTokenApproveTxReceipt.cumulativeGasUsed.mul(strategyTokenApproveTxReceipt.effectiveGasPrice)
    )
    totalGasCost = totalGasCost.add(
      strategyTokenWithdrawTxReceipt.cumulativeGasUsed.mul(strategyTokenWithdrawTxReceipt.effectiveGasPrice)
    )
    console.log(`Total gas used: ${totalGasUsed}, gas cost: ${totalGasCost}`)
  })
})
