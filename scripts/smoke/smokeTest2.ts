import { BigNumber, Contract, providers } from "ethers"
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

async function printBalances(strategy: Contract) {
  for (const assetBalance of await strategy.getAssetBalances()) {
    console.log("asset:", assetBalance.asset)
    console.log("asset balance:", assetBalance.balance.toString())
  }
  for (const liabilityValuation of await strategy.getLiabilityBalances()) {
    console.log("liability:", liabilityValuation.asset)
    console.log("liability balance:", liabilityValuation.balance.toString())
  }
}

async function printValuations(strategy: Contract) {
  for (const assetValuation of await strategy.getAssetValuations(false, false)) {
    console.log("asset:", assetValuation.asset)
    console.log("asset valuation:", assetValuation.valuation.toString())
  }
  for (const liabilityValuation of await strategy.getLiabilityValuations(false, false)) {
    console.log("liability:", liabilityValuation.asset)
    console.log("liability valuation:", liabilityValuation.valuation.toString())
  }
  console.log("getting minimum total equity AUM: ", (await strategy.getEquityValuation(false, false)).toString())
  console.log("getting maximum total equity AUM: ", (await strategy.getEquityValuation(true, false)).toString())
}

async function printInternalState(strategy: Contract) {
  console.log("Lending pool borrow amount: ", (await strategy.getLendingPoolBorrowAmount()).toString())
  console.log("Lending pool supply amount: ", (await strategy.getLendingPoolSupplyAmount()).toString())
  console.log("Liquidity pool borrow amount: ", (await strategy.getLiquidityPoolBorrowAmount()).toString())
  console.log(
    "Inverse collateral ratio with maximum price: ",
    (await strategy.getInverseCollateralRatio(true, false)).toString()
  )
  console.log(
    "Inverse collateral ratio with minimum price: ",
    (await strategy.getInverseCollateralRatio(false, false)).toString()
  )
  const res = await strategy.getCombinedSafetyFactor()
  console.log("Combined safety factor: ", JSON.stringify(res))
}

export async function getBUsdcContract() {
  return await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
  )
}

describe("DNS Vector", function () {
  this.timeout(60 * 60 * 1000)

  it("Deploy price oracle to prod", async function () {
    const priceOracle = await deployVenusOracle()
    console.log("Price oracle deployed: ", priceOracle.address)
  })
})

async function deployVenusOracle() {
  const priceOracle = await expectSuccess(
    deployPriceOracle(
      "VenusOracle",
      "0x516c18DC440f107f12619a6d2cc320622807d0eE",
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    )
  )
  await priceOracle.setTokenToVToken(
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    "0x95c78222B3D6e262426483D42CfA53685A67Ab9D"
  )
  await priceOracle.setTokenToVToken(
    "0x0000000000000000000000000000000000000002",
    "0xa07c5b74c9b40447a954e1466938b865b6bbea36"
  )
  return priceOracle
}

async function getBusdStrategy(priceOracle: any) {
  const accounts = await ethers.getSigners()
  const Alice = accounts[0].address

  const busdContract = await expectSuccess(getBUsdcContract())

  const DnsCakeStrategyAumLib = await ethers.getContractFactory("DnsCakeStrategyAumLib")
  const dnsCakeStrategyAumLib = await DnsCakeStrategyAumLib.deploy()

  const DnsCakeStrategyInvestmentLib = await ethers.getContractFactory("DnsCakeStrategyInvestmentLib")
  const dnsCakeStrategyInvestmentLib = await DnsCakeStrategyInvestmentLib.deploy()

  const libraries = {
    DnsCakeStrategyAumLib: dnsCakeStrategyAumLib.address,
    DnsCakeStrategyInvestmentLib: dnsCakeStrategyInvestmentLib.address,
  }

  return await expectSuccess(
    deployUpgradeableStrategy(
      "DnsCakeStrategy",
      "Super Strategy Token 1",
      "SUP1",
      busdContract,
      0,
      [],
      0,
      [],
      0,
      [],
      "0xce70b9444c4e22ae150C81dA7375542B49D15efA", // fee receiver
      [],
      BigInt(10 ** 28),
      BigInt(10 ** 28),
      priceOracle.address,
      3,
      "0x10ED43C718714eb63d5aA57B78B54704E256024E", // swap service address
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
          "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // venusSupplyToken
          "0x95c78222B3D6e262426483D42CfA53685A67Ab9D", // venusSupplyMarket
          "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // ammPairDepositToken
          "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16", // BUSD/WBNB pancakePair
          "0x10ED43C718714eb63d5aA57B78B54704E256024E", // pancakeRouter
          "0xa5f8c5dbd5f286960b9d90548680ae5ebff07652", // pancakeMasterChefV2
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
