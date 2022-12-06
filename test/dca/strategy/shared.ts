import { setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import type * as ethersTypes from "ethers"
import { ethers, network } from "hardhat"
import { CoinAddrs, getTokenContract } from "../../../scripts/helper/helper"
import { WhaleAddrs } from "../../helper/addresses"

export function testDcaStrategy(description: string, deployStrategy: Function, strategySpecificTests: (() => any)[]) {
  describe(description, function () {
    before(async function () {
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            allowUnlimitedContractSize: false,
            blockGasLimit: 30_000_000,
            forking: {
              jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
              enabled: true,
              blockNumber: 21777750,
            },
          },
        ],
      })

      // Get ERC20 tokens.
      this.usdc = await getTokenContract(CoinAddrs.usdc)

      // Signers.
      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.user3 = this.signers[4]
      this.userCount = 4

      // Airdrop signers.
      this.impersonatedSigner = await ethers.getImpersonatedSigner(WhaleAddrs.usdc)
      await setBalance(this.impersonatedSigner.address, ethers.utils.parseEther("10000"))
      for (let i = 0; i <= this.userCount; i++) {
        await setBalance(this.signers[i].address, ethers.utils.parseEther("10000"))
        await this.usdc
          .connect(this.impersonatedSigner)
          .transfer(this.signers[i].address, ethers.utils.parseUnits("10000", 6))
        // TODO: Add USDC setter helper.
      }

      // Deploy strategy.
      this.strategy = await deployStrategy()

      const ownerAddr = await this.strategy.owner()
      this.owner = await ethers.getImpersonatedSigner(ownerAddr)

      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      await this.snapshot.restore()
    })

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
