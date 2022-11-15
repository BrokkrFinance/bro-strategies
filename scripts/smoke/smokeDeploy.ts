import { BigNumber, providers } from "ethers"
import { ethers } from "hardhat"
import {
  ContractAddrs,
  deployPortfolio,
  deployPriceOracle,
  deployProxyContract,
  deployUpgradeableStrategy,
  expectSuccess,
  getExecutionCostInUsd,
  getExecutionGasAmount,
  getTokenContract,
  getUsdcContract,
  increaseEvmTimeBySeconds,
  retryUntilSuccess,
} from "../helper/helper"
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
deployPortfolio

describe("DNS Vector deployment", function () {
  this.timeout(60 * 60 * 1000)

  // it("Smoke test", async function () {
  //   const strategy = await getUsdcStrategy()
  // })
  it("Smoke test", async function () {
    const portfolio = await getUsdcPortfolio()
  })
})

async function getUsdcPortfolio() {
  const singleOwnerAddress = "0xE8855828fEC29dc6860A4362BCb386CCf6C0c601"
  const maintainerRoleAddress = "0x44041eE3A2ae30a1F2a79710542040d9C5BeEb2c"
  const feeReceiver = "0xD81965d1D44c084b43fBFE1Cc5baC7414cd4FbbD"
  const swapServiceAddress = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
  const aaveOracleAddress = "0x736d964c70fF405e14aAc3094CeFe585812e1877"

  const ownerAddrs = [singleOwnerAddress]

  const usdcContract = await expectSuccess(getUsdcContract())

  // STEP 1: deploying DNS strategy
  const DnsVectorStrategyAumLib = await ethers.getContractFactory("DnsVectorStrategyAumLib")
  const dnsVectorStrategyAumLib = await retryUntilSuccess(DnsVectorStrategyAumLib.deploy())

  const DnsVectorStrategyInvestmentLib = await ethers.getContractFactory("DnsVectorStrategyInvestmentLib")
  const dnsVectorStrategyInvestmentLib = await retryUntilSuccess(DnsVectorStrategyInvestmentLib.deploy())

  const libraries = {
    DnsVectorStrategyAumLib: dnsVectorStrategyAumLib.address,
    DnsVectorStrategyInvestmentLib: dnsVectorStrategyInvestmentLib.address,
  }

  let dnsStrategy = await retryUntilSuccess(
    deployUpgradeableStrategy(
      "DnsVectorStrategy",
      "USDC-AVAX Delta Neutral",
      "DN1",
      usdcContract,
      0,
      [],
      500,
      [],
      0,
      [],
      feeReceiver, // fee receiver
      [],
      BigInt(10 ** 20),
      BigInt(10 ** 20),
      aaveOracleAddress, // Aave oracle
      0,
      swapServiceAddress, // swap service address
      [
        { role: "0x0000000000000000000000000000000000000000000000000000000000000000", users: ownerAddrs },
        { role: "0x7935bd0ae54bc31f548c14dba4d37c5c64b3f8ca900cb468fb8abd54d5894f55", users: ownerAddrs },
        { role: "0x17a8e30262c1f919c33056d877a3c22b95c2f5e4dac44683c1c2323cd79fbdb0", users: ownerAddrs },
        {
          role: "0x339759585899103d2ace64958e37e18ccb0504652c81d4a1b8aa80fe2126ab95",
          users: [...ownerAddrs, maintainerRoleAddress],
        },
        { role: "0x88aa719609f728b0c5e7fb8dd3608d5c25d497efbb3b9dd64e9251ebba101508", users: ownerAddrs },
        { role: "0x139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d", users: ownerAddrs },
      ],
      [
        [
          600, // safetyFactor
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

  // STEP 2: deploying Cash strategy
  let cashStrategy = await retryUntilSuccess(
    deployUpgradeableStrategy(
      "Cash",
      "Cash Strategy Token",
      "CSH1",
      usdcContract,
      0,
      [],
      0,
      [],
      0,
      [],
      feeReceiver, // fee receiver
      [],
      BigInt(10 ** 20),
      BigInt(10 ** 20),
      aaveOracleAddress, // Aave oracle
      0,
      swapServiceAddress, // swap service address
      [],
      [],
      {}
    )
  )

  // STEP 3: deploying wrapper portfolio
  const wrapperPortfolio = await retryUntilSuccess(
    deployPortfolio(
      true,
      "PercentageAllocation",
      "Wrapper portfolio token",
      "WPT1",
      usdcContract,
      [dnsStrategy, cashStrategy],
      0,
      [],
      0,
      [],
      0,
      [],
      feeReceiver,
      [],
      BigInt(10 ** 20),
      BigInt(10 ** 20),
      [[100000], [100000, 0]]
    )
  )

  // STEP 4: deploying real portfolio
  const portfolio = await retryUntilSuccess(
    deployPortfolio(
      true,
      "PercentageAllocation",
      "Ambitious Portfolio Token",
      "AMB",
      usdcContract,
      [wrapperPortfolio],
      0,
      [],
      500,
      [],
      0,
      [],
      feeReceiver,
      [],
      BigInt(10 ** 11),
      BigInt(3 * 10 ** 9),
      [[100000]]
    )
  )
}

async function getUsdcStrategy() {
  const ownerAddrs = ["0xFf04026EaBb113A04878F8861902e533A51feb22", "0xeb1BF79Dfd7197308Ea045094217Bfc3c6aB9384"]

  const usdcContract = await expectSuccess(getUsdcContract())

  const DnsVectorStrategyAumLib = await ethers.getContractFactory("DnsVectorStrategyAumLib")
  const dnsVectorStrategyAumLib = await retryUntilSuccess(DnsVectorStrategyAumLib.deploy())

  const DnsVectorStrategyInvestmentLib = await ethers.getContractFactory("DnsVectorStrategyInvestmentLib")
  const dnsVectorStrategyInvestmentLib = await retryUntilSuccess(DnsVectorStrategyInvestmentLib.deploy())

  const libraries = {
    DnsVectorStrategyAumLib: dnsVectorStrategyAumLib.address,
    DnsVectorStrategyInvestmentLib: dnsVectorStrategyInvestmentLib.address,
  }

  return await retryUntilSuccess(
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
      "0x736d964c70fF405e14aAc3094CeFe585812e1877", // Aave oracle
      0,
      "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // swap service address
      [
        { role: "0x0000000000000000000000000000000000000000000000000000000000000000", users: ownerAddrs },
        { role: "0x7935bd0ae54bc31f548c14dba4d37c5c64b3f8ca900cb468fb8abd54d5894f55", users: ownerAddrs },
        { role: "0x17a8e30262c1f919c33056d877a3c22b95c2f5e4dac44683c1c2323cd79fbdb0", users: ownerAddrs },
        { role: "0x339759585899103d2ace64958e37e18ccb0504652c81d4a1b8aa80fe2126ab95", users: ownerAddrs },
        { role: "0x88aa719609f728b0c5e7fb8dd3608d5c25d497efbb3b9dd64e9251ebba101508", users: ownerAddrs },
        { role: "0x139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d", users: ownerAddrs },
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
