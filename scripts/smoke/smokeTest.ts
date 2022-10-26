import { config } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"
import {
  contractAt,
  deployFreeMoneyProvider,
  deployPortfolio,
  deployProxyContract,
  deployUpgradeableStrategy,
  expectSuccess,
  logBlue,
  logCyan,
  logRed,
} from "./helper"
config.includeStack = true

deployFreeMoneyProvider
deployPortfolio
deployUpgradeableStrategy
logBlue
logCyan
logRed
contractAt
deployProxyContract
expectSuccess

function printAssetValuations(headerText: string, assetValuations: any) {
  console.log(headerText)
  for (const assetValuation of assetValuations) {
    console.log("asset: %s, amount: %i", assetValuation[0], assetValuation[1])
  }
}

async function printState(
  header: string,
  depositToken: Contract,
  portfolio: Contract,
  strategy1: Contract,
  strategy2: Contract,
  strategy3: Contract
) {
  const accounts = await ethers.getSigners()
  const Alice = accounts[1].address
  const Bob = accounts[2].address
  const Charlie = accounts[3].address

  const strategy1Token = await contractAt("InvestmentToken", await strategy1.getInvestmentToken())
  const strategy2Token = await contractAt("InvestmentToken", await strategy2.getInvestmentToken())
  const strategy3Token = await contractAt("InvestmentToken", await strategy3.getInvestmentToken())
  const portfolioToken = await contractAt("InvestmentToken", await portfolio.getInvestmentToken())

  console.log("------------------------------------------")
  logRed(header)
  console.log("Portfolio owned SUP1 token", await strategy1Token.balanceOf(portfolio.address))
  console.log("Portfolio owned SUP2 token", await strategy2Token.balanceOf(portfolio.address))
  console.log("Portfolio owned SUP3 token", await strategy3Token.balanceOf(portfolio.address))
  console.log("Portfolio owned FUSD token", await depositToken.balanceOf(portfolio.address))
  console.log("Alice owned portfolio token:", await portfolioToken.balanceOf(Alice))
  console.log("Alice owned SUP1 token:", await strategy1Token.balanceOf(Alice))
  console.log("Alice owned SUP2 token:", await strategy2Token.balanceOf(Alice))
  console.log("Alice owned SUP3 token:", await strategy3Token.balanceOf(Alice))
  console.log("Alice owned FUSD token", await depositToken.balanceOf(Alice))
  console.log("Bob owned portfolio token:", await portfolioToken.balanceOf(Bob))
  console.log("Bob owned SUP1 token:", await strategy1Token.balanceOf(Bob))
  console.log("Bob owned SUP2 token:", await strategy2Token.balanceOf(Bob))
  console.log("Bob owned SUP3 token:", await strategy3Token.balanceOf(Bob))
  console.log("Bob owned FUSD token", await depositToken.balanceOf(Bob))
  console.log("Charlie owned portfolio token:", await portfolioToken.balanceOf(Charlie))
  console.log("Charlie owned SUP1 token:", await strategy1Token.balanceOf(Charlie))
  console.log("Charlie owned SUP2 token:", await strategy2Token.balanceOf(Charlie))
  console.log("Charlie owned SUP3 token:", await strategy3Token.balanceOf(Charlie))
  console.log("Charlie owned FUSD token", await depositToken.balanceOf(Charlie))
  console.log("-----")
  printAssetValuations("Portfolio asset:", await portfolio.getAssetValuations(true, false))
  console.log("Portfolio equity:", await portfolio.getEquityValuation(true, false))
  console.log("Strategy 1 equity:", await strategy1.getEquityValuation(true, false))
  console.log("Strategy 1 accumulated fee:", await strategy1.getCurrentAccumulatedFee())
  console.log("Strategy 2 equity:", await strategy2.getEquityValuation(true, false))
  console.log("Strategy 2 accumulated fee:", await strategy2.getCurrentAccumulatedFee())
  console.log("Strategy 3 equity:", await strategy3.getEquityValuation(true, false))
  console.log("Strategy 3 accumulated fee:", await strategy3.getCurrentAccumulatedFee())
}

describe("Unified strategy interface and base implementation", function () {
  this.timeout(60 * 60 * 1000)

  it("Smoke test", async function () {
    const accounts = await ethers.getSigners()
    const Alice = accounts[1].address
    const Bob = accounts[2].address
    const Charlie = accounts[3].address
    const Dave = accounts[4].address
    const AliceSigner = accounts[1]
    const BobSigner = accounts[2]
    const CharlieSigner = accounts[3]

    const freeMoneyProvider = await deployFreeMoneyProvider()
    const depositToken = await deployProxyContract("InvestmentToken", ["FakeUSD", "USDF"])
    const strategy1 = await deployUpgradeableStrategy(
      "MockStrategy",
      "Super Strategy Token 1",
      "SUP1",
      depositToken,
      0,
      [],
      10000,
      [],
      0,
      [],
      Dave,
      [],
      BigInt(10 ** 20),
      BigInt(10 ** 20),
      "0xce70b9444c4e22ae150C81dA7375542B49D15efA",
      [2, freeMoneyProvider.address]
    )
    const strategy2 = await deployUpgradeableStrategy(
      "MockStrategy",
      "Super Strategy Token 2",
      "SUP2",
      depositToken,
      0,
      [],
      4000,
      [],
      0,
      [],
      Dave,
      [],
      BigInt(10 ** 20),
      BigInt(10 ** 20),
      "0xce70b9444c4e22ae150C81dA7375542B49D15efA",
      [1, freeMoneyProvider.address]
    )
    const strategy3 = await deployUpgradeableStrategy(
      "MockStrategy",
      "Super Strategy Token 3",
      "SUP3",
      depositToken,
      0,
      [],
      10000,
      [],
      0,
      [],
      Dave,
      [],
      BigInt(10 ** 20),
      BigInt(10 ** 20),
      "0xce70b9444c4e22ae150C81dA7375542B49D15efA",
      [1, freeMoneyProvider.address]
    )

    const portfolio = await deployPortfolio(
      false,
      "MockPortfolio",
      "Super Portfolio Token 1",
      "SUPP1",
      depositToken,
      [strategy1, strategy2, strategy3],
      0,
      [],
      0,
      [],
      0,
      [],
      Dave,
      [],
      BigInt(10 ** 20),
      BigInt(10 ** 20),
      [[100000], [50000, 50000], [25000, 75000, 0]]
    )
    const portfolioToken = await contractAt("InvestmentToken", await portfolio.getInvestmentToken())

    // initial setup
    await depositToken.mint(Alice, ethers.utils.parseEther("100.0"))
    await depositToken.mint(Bob, ethers.utils.parseEther("100.0"))
    await depositToken.mint(Charlie, ethers.utils.parseEther("100.0"))
    await depositToken.mint(strategy1.address, ethers.utils.parseEther("100.0"))
    await depositToken.mint(strategy2.address, ethers.utils.parseEther("100.0"))
    await depositToken.mint(strategy3.address, ethers.utils.parseEther("100.0"))
    await depositToken.mint(freeMoneyProvider.address, ethers.utils.parseEther("100.0"))

    // get withdrawal fee before deposit
    console.log("portfolio deposit fee before deposit: ", await portfolio.getTotalDepositFee([]))
    console.log("portfolio withdrawal fee before deposit: ", await portfolio.getTotalWithdrawalFee([]))

    // depositing starts
    await depositToken.connect(AliceSigner).approve(portfolio.address, ethers.utils.parseEther("1.0"))
    await portfolio.connect(AliceSigner).deposit(ethers.utils.parseEther("1.0"), Alice, [])
    await printState(
      "Aice investing 1 usdc into the portfolio",
      depositToken,
      portfolio,
      strategy1,
      strategy2,
      strategy3
    )

    await depositToken.connect(BobSigner).approve(portfolio.address, ethers.utils.parseEther("1"), {})
    await portfolio.connect(BobSigner).deposit(ethers.utils.parseEther("1"), Bob, [])
    await depositToken.connect(BobSigner).approve(strategy1.address, ethers.utils.parseEther("0.5"), {})
    await strategy1.connect(BobSigner).deposit(ethers.utils.parseEther("0.5"), Bob, [])
    await depositToken.connect(BobSigner).approve(strategy2.address, ethers.utils.parseEther("0.3"), {})
    await strategy2.connect(BobSigner).deposit(ethers.utils.parseEther("0.3"), Bob, [])
    await printState(
      "Bob investing 1 usdc into the portfolio, 0.5 usdc into sup1, 0.3usdc into sup2",
      depositToken,
      portfolio,
      strategy1,
      strategy2,
      strategy3
    )

    await depositToken.connect(CharlieSigner).approve(strategy1.address, ethers.utils.parseEther("0.1"))
    await strategy1.connect(CharlieSigner).deposit(ethers.utils.parseEther("0.1"), Charlie, [])
    await depositToken.connect(CharlieSigner).approve(strategy2.address, ethers.utils.parseEther("0.2"))
    await strategy2.connect(CharlieSigner).deposit(ethers.utils.parseEther("0.2"), Charlie, [])
    await printState(
      "Charlie investing 0.1 usdc into into sup1, 0.2 usdc into sup2",
      depositToken,
      portfolio,
      strategy1,
      strategy2,
      strategy3
    )

    // get withdrawal fee after deposit
    console.log("portfolio deposit fee after deposit: ", await portfolio.getTotalDepositFee([]))
    console.log("portfolio withdrawal fee after deposit : ", await portfolio.getTotalWithdrawalFee([]))

    await portfolioToken.connect(AliceSigner).approve(portfolio.address, ethers.utils.parseEther("0.2"))
    await portfolio.connect(AliceSigner).withdraw(ethers.utils.parseEther("0.2"), Alice, [])
    await printState("Withdraw 0.2 portfolio token by Alice", depositToken, portfolio, strategy1, strategy2, strategy3)

    await expectSuccess(portfolio.setTargetInvestableAllocations([90000, 10000, 0]))
    await expectSuccess(portfolio.rebalance(BigNumber.from(0), [[], [], []], [[], [], []]))
    await printState("Rebalance to 90% - 10%", depositToken, portfolio, strategy1, strategy2, strategy3)

    // get withdrawal fee after deposit and rebalance
    console.log("portfolio deposit fee after deposit and rebalance: ", await portfolio.getTotalDepositFee([]))
    console.log("portfolio withdrawal fee after deposit and rebalance: ", await portfolio.getTotalWithdrawalFee([]))

    await expectSuccess(portfolio.setTargetInvestableAllocations([0, 100000, 0]))
    await expectSuccess(portfolio.rebalance(BigNumber.from(0), [[], [], []], [[], [], []]))
    await printState("Rebalance to 0% - 100%", depositToken, portfolio, strategy1, strategy2, strategy3)

    // console.log("------------------------------------------")
    // console.log("Autocompound rewards")

    // const eventBlockStart = (await ethers.provider.getBlockNumber()) - 20
    // await strategy2.processReward([], [])
    // console.log(await strategy2.queryFilter(strategy2.filters.Deposit(), eventBlockStart))
    // console.log(await strategy2.queryFilter(strategy2.filters.RewardProcess(), eventBlockStart))
  })
})
