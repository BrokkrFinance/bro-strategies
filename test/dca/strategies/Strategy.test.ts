import { setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import type * as ethersTypes from "ethers"
import { ethers, network } from "hardhat"
import { getTokenContract } from "../../../scripts/helper/helper"
import { Chain } from "../helper/HelperInterfaces"
import { testStrategyDeposit } from "./StrategyDeposit.test"
import { testStrategyEmergencyExit } from "./StrategyEmergencyExit.test"
import { testStrategyLimit } from "./StrategyLimit.test"
import { testStrategyWithdraw } from "./StrategyWithdraw.test"

testStrategyDeposit
testStrategyLimit
testStrategyWithdraw
testStrategyEmergencyExit

export function testDcaStrategy(
  description: string,
  deployStrategy: Function,
  strategySpecificTests: (() => any)[],
  testConfig: any,
  chain: Chain
) {
  describe(description, function () {
    before(async function () {
      this.testConfig = testConfig
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            allowUnlimitedContractSize: false,
            blockGasLimit: 30_000_000,
            forking: {
              jsonRpcUrl: chain.url,
              enabled: true,
              blockNumber: chain.forkAt,
            },
          },
        ],
      })

      // Get ERC20 tokens.
      this.depositTokenContract = await getTokenContract(this.testConfig.depositToken.address)
      this.bluechipTokenContract = await getTokenContract(this.testConfig.bluechipToken.address)

      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.user3 = this.signers[4]
      this.userCount = 4

      // Airdrop signers.
      this.impersonatedSigner = await ethers.getImpersonatedSigner(
        chain.whaleAddrs[this.testConfig.depositToken.address]
      )
      await setBalance(this.impersonatedSigner.address, ethers.utils.parseEther("10000"))
      for (let i = 0; i <= this.userCount; i++) {
        await setBalance(this.signers[i].address, ethers.utils.parseEther("10000"))
        await this.depositTokenContract
          .connect(this.impersonatedSigner)
          .transfer(this.signers[i].address, ethers.utils.parseUnits("3000", testConfig.depositToken.digits))
      }

      // Deploy strategy.
      this.strategy = await deployStrategy(testConfig)

      const ownerAddr = await this.strategy.owner()
      this.owner = await ethers.getImpersonatedSigner(ownerAddr)

      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      await this.snapshot.restore()
    })

    testStrategyDeposit()
    testStrategyWithdraw()
    testStrategyLimit()
    if (!testConfig.skipEmergencyExitTests) testStrategyEmergencyExit()

    for (const strategySpecificTest of strategySpecificTests) {
      strategySpecificTest()
    }

    after(async function () {
      await network.provider.request({
        method: "hardhat_reset",
        params: [],
      })
    })
  })
}

export async function currentBlockchainTime(provider: ethersTypes.providers.JsonRpcProvider) {
  return await (
    await provider.getBlock(await provider.getBlockNumber())
  ).timestamp
}
