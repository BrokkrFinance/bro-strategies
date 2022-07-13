import { config } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"

import { contractAt, deployContract, deployProxyContract, expectSuccess } from "./helper"
config.includeStack = true

async function deployFreeMoneyProvider() {
  const freeMoneyProvider = await deployContract("FreeMoneyProvider", [])
  return freeMoneyProvider
}

async function deployMockStrategy(
  investnemtTokenName: string,
  investnemtTokenTicker: string,
  depositToken: any,
  depositFee: number,
  withdrawalFee: number,
  performanceFee: number,
  strategyExtraArgs: any[]
) {
  const strategyToken = await deployProxyContract("InvestmentToken", [investnemtTokenName, investnemtTokenTicker])
  const mockStrategy = await expectSuccess(deployContract("MockStrategy", []))
  await expectSuccess(strategyToken.transferOwnership(mockStrategy.address))
  await expectSuccess(
    mockStrategy.initialize(
      strategyToken.address,
      depositToken.address,
      depositFee,
      withdrawalFee,
      performanceFee,
      ...strategyExtraArgs
    )
  )

  return mockStrategy
}

async function deployMockPortfolio(
  investnemtTokenName: string,
  investnemtTokenTicker: string,
  depositToken: any,
  investables: any[]
) {
  const portfolioToken = await deployProxyContract("InvestmentToken", [investnemtTokenName, investnemtTokenTicker])
  const mockPortfolio = await expectSuccess(deployContract("MockPortfolio", []))
  await expectSuccess(portfolioToken.transferOwnership(mockPortfolio.address))

  await expectSuccess(mockPortfolio.initialize(portfolioToken.address, depositToken.address))
  for (let investable of investables) {
    await expectSuccess(mockPortfolio.addInvestable(investable.address))
  }

  await expectSuccess(mockPortfolio.setTargetInvestableAllocations([25000, 75000, 0]))
  return mockPortfolio
}

async function printState(
  header: String,
  portfolio: Contract,
  depositToken: Contract,
  portfolioToken: Contract,
  strategy1Token: Contract,
  strategy2Token: Contract,
  strategy3Token: Contract
) {
  const accounts = await ethers.getSigners()
  const Alice = accounts[1].address
  const Bob = accounts[2].address
  const Charlie = accounts[3].address

  console.log("------------------------------------------")
  console.log(header)
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
}

describe("Unified strategy interface and base implementation", function () {
  this.timeout(60 * 60 * 1000)

  it("Smoke test", async function () {
    const freeMoneyProvider = await deployFreeMoneyProvider()
    const depositToken = await deployProxyContract("InvestmentToken", ["FakeUSD", "USDF"])
    const strategy1 = await deployMockStrategy("Super Strategy Token 1", "SUP1", depositToken, 0, 50000, 0, [
      2,
      freeMoneyProvider.address,
    ])
    const strategy2 = await deployMockStrategy("Super Strategy Token 2", "SUP2", depositToken, 0, 0, 0, [
      2,
      freeMoneyProvider.address,
    ])
    const strategy3 = await deployMockStrategy("Super Strategy Token 3", "SUP3", depositToken, 0, 0, 0, [
      1,
      freeMoneyProvider.address,
    ])

    const portfolio = await deployMockPortfolio("Super Portfolio Token 1", "SUPP1", depositToken, [
      strategy1,
      strategy2,
      strategy3,
    ])
    const portfolioToken = await contractAt("InvestmentToken", await portfolio.getInvestmentToken())

    const accounts = await ethers.getSigners()
    const Alice = accounts[1].address
    const Bob = accounts[2].address
    const Charlie = accounts[3].address
    const AliceSigner = accounts[1]
    const BobSigner = accounts[2]
    const CharlieSigner = accounts[3]
    const fiveToken = ethers.utils.parseEther("5.0")
    const oneToken = ethers.utils.parseEther("1.0")
    const tenthToken = ethers.utils.parseEther("0.1")

    // initial setup
    await depositToken.mint(Alice, ethers.utils.parseEther("100.0"))
    await depositToken.mint(Bob, ethers.utils.parseEther("100.0"))
    await depositToken.mint(Charlie, ethers.utils.parseEther("100.0"))
    await depositToken.mint(strategy1.address, ethers.utils.parseEther("100.0"))
    await depositToken.mint(strategy2.address, ethers.utils.parseEther("100.0"))
    await depositToken.mint(strategy3.address, ethers.utils.parseEther("100.0"))
    await depositToken.mint(freeMoneyProvider.address, ethers.utils.parseEther("100.0"))
    const strategy1Token = await contractAt("InvestmentToken", await strategy1.getInvestmentToken())
    const strategy2Token = await contractAt("InvestmentToken", await strategy2.getInvestmentToken())
    const strategy3Token = await contractAt("InvestmentToken", await strategy3.getInvestmentToken())

    await depositToken.connect(AliceSigner).approve(portfolio.address, oneToken)
    await portfolio.connect(AliceSigner).deposit(oneToken, [])
    await printState(
      "Aice investing 1 usdc into the portfolio",
      portfolio,
      depositToken,
      portfolioToken,
      strategy1Token,
      strategy2Token,
      strategy3Token
    )

    await depositToken.connect(BobSigner).approve(portfolio.address, ethers.utils.parseEther("1"), {})
    await portfolio.connect(BobSigner).deposit(ethers.utils.parseEther("1"), [])
    await depositToken.connect(BobSigner).approve(strategy1.address, ethers.utils.parseEther("0.5"), {})
    await strategy1.connect(BobSigner).deposit(ethers.utils.parseEther("0.5"), [])
    await depositToken.connect(BobSigner).approve(strategy2.address, ethers.utils.parseEther("0.3"), {})
    await strategy2.connect(BobSigner).deposit(ethers.utils.parseEther("0.3"), [])
    await printState(
      "Bob investing 1 usdc into the portfolio, 0.5 usdc into sup1, 0.3usdc into sup2",
      portfolio,
      depositToken,
      portfolioToken,
      strategy1Token,
      strategy2Token,
      strategy3Token
    )

    await depositToken.connect(CharlieSigner).approve(strategy1.address, ethers.utils.parseEther("0.1"))
    await strategy1.connect(CharlieSigner).deposit(ethers.utils.parseEther("0.1"), [])
    await depositToken.connect(CharlieSigner).approve(strategy2.address, ethers.utils.parseEther("0.2"))
    await strategy2.connect(CharlieSigner).deposit(ethers.utils.parseEther("0.2"), [])
    await printState(
      "Charlie investing 0.1 usdc into into sup1, 0.2 usdc into sup2",
      portfolio,
      depositToken,
      portfolioToken,
      strategy1Token,
      strategy2Token,
      strategy3Token
    )

    await portfolioToken.connect(AliceSigner).approve(portfolio.address, ethers.utils.parseEther("0.2"))
    await portfolio.connect(AliceSigner).withdraw(ethers.utils.parseEther("0.2"), [])
    await printState(
      "Withdraw 0.2 portfolio token by Alice",
      portfolio,
      depositToken,
      portfolioToken,
      strategy1Token,
      strategy2Token,
      strategy3Token
    )

    await expectSuccess(portfolio.setTargetInvestableAllocations([90000, 10000, 0]))
    await expectSuccess(portfolio.rebalance([[], [], []], [[], [], []]))
    await printState(
      "Rebalance to 90% - 10%",
      portfolio,
      depositToken,
      portfolioToken,
      strategy1Token,
      strategy2Token,
      strategy3Token
    )

    await expectSuccess(portfolio.setTargetInvestableAllocations([0, 100000, 0]))
    await expectSuccess(portfolio.rebalance([[], [], []], [[], [], []]))
    await printState(
      "Rebalance to 0% - 100%",
      portfolio,
      depositToken,
      portfolioToken,
      strategy1Token,
      strategy2Token,
      strategy3Token
    )

    console.log("------------------------------------------")
    console.log("Autocompound rewards")

    await strategy2.processReward([], [])
    console.log(await strategy2.queryFilter(strategy2.filters.Deposit()))
    console.log(await strategy2.queryFilter(strategy2.filters.RewardProcess()))
  })
})
