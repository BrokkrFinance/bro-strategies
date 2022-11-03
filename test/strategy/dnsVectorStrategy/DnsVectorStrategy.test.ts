import { ethers } from "hardhat"
import { AaveAddrs, TokenAddrs, TraderJoeAddrs, Vector } from "../../helper/addresses"
import { deployUUPSUpgradeableStrategy } from "../../helper/contracts"
import { Oracles } from "../../helper/oracles"
import { SwapServices } from "../../helper/swaps"
import { createRolesArray } from "../../helper/utils"
import { testStrategy } from "../Strategy.test"

testStrategy("Dns Vector Strategy - Deploy", deployDnsStrategy, [])

async function deployDnsStrategy() {
  // Strategy owner.
  const signers = await ethers.getSigners()
  const owner = signers[0]

  // Deploy strategy.
  const strategy = await deployUUPSUpgradeableStrategy(
    "DnsVectorStrategy",
    {
      depositFee: { amount: 0, params: [] },
      withdrawalFee: { amount: 0, params: [] },
      performanceFee: { amount: 0, params: [] },
      feeReceiver: { address: owner.address, params: [] },
      investmentLimit: { total: BigInt(1e20), perAddress: BigInt(1e20) },
      oracle: Oracles.aave,
      swapService: SwapServices.traderjoe,
      roleToUsers: createRolesArray(owner.address),
    },
    {
      extraArgs: [
        [
          800, // safetyFactor
          TokenAddrs.usdc, // aaveSupplyToken
          TokenAddrs.aUsdc, // aAaveSupplyToken
          TokenAddrs.wAvax, // aaveBorrowToken
          TokenAddrs.vWavax, // vAaveBorrowToken
          TokenAddrs.usdc, // ammPairDepositToken
          TraderJoeAddrs.joeToken, // Joe token
          AaveAddrs.aavePool, // Aave pool
          AaveAddrs.aaveProtocolDataProvider, // Aave protocol data provider
          TraderJoeAddrs.router, // TraderJoe router
          TraderJoeAddrs.usdcWAvaxLpToken, // TraderJeo pair (same as the LP token in TraderJoe's implementation)
          Vector.poolHelperJoe, // Vector pool helper joe (call getPoolInfo on MainStaking: 0x0E25c07748f727D6CCcD7D2711fD7bD13d13422d)
        ],
      ],
    },
    [
      { libraryContractName: "DnsVectorStrategyAumLib", libraryDependencies: [] },
      { libraryContractName: "DnsVectorStrategyInvestmentLib", libraryDependencies: [] },
    ]
  )

  return { investable: strategy, ownerAddr: owner.address, upgradeClassName: "TestUpgradedRoleableStrategy" }
}
