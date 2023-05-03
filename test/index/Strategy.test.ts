import { setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { execSync } from "child_process"
import { Contract } from "ethers"
import { ethers, network } from "hardhat"
import { DepositTokens } from "../../scripts/constants/deposit-tokens"
import { WhaleAddrs } from "../helper/addresses"
import { IndexTestOptions } from "../helper/interfaces/options"
import { testStrategyAccessControl } from "./StrategyAccessControl.test"
import { testStrategyComponent } from "./StrategyComponent.test"
import { testStrategyDeposit } from "./StrategyDeposit.test"
import { testStrategyWithdraw } from "./StrategyWithdraw.test"

export function testStrategy(
  description: string,
  deployStrategy: () => Promise<Contract>,
  strategyTestOptions: IndexTestOptions,
  strategySpecificTests: (() => void)[]
) {
  describe(description, function () {
    before(async function () {
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            allowUnlimitedContractSize: false,
            blockGasLimit: 30_000_000,
            forking: {
              jsonRpcUrl: strategyTestOptions.network.url,
              enabled: true,
              blockNumber: strategyTestOptions.forkAt,
            },
          },
        ],
      })

      // Set chain specific parameters.
      const depositTokenAddr: string = DepositTokens.get(strategyTestOptions.network.name)!
      let whaleAddr: string

      switch (strategyTestOptions.network.chainId) {
        case 56:
          // BNB Smart Chain.
          whaleAddr = WhaleAddrs.bsc.busd
          break
        case 43114:
          // Avalanche C-Chain.
          whaleAddr = WhaleAddrs.avalanche.usdc
          break
        default:
          throw new Error("Selected chain for test is not one of supported mainnets.")
      }

      // Get ERC20 tokens.
      this.depositToken = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        depositTokenAddr
      )

      // Users.
      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.userCount = 3

      // Airdrop signers.
      this.whale = await ethers.getImpersonatedSigner(whaleAddr)
      await setBalance(this.whale.address, ethers.utils.parseEther("10000"))
      for (let i = 0; i <= this.userCount; i++) {
        await setBalance(this.signers[i].address, ethers.utils.parseEther("10000"))
        await this.depositToken
          .connect(this.whale)
          .transfer(this.signers[i].address, ethers.utils.parseUnits("10000", 6))
        // TODO: Add USDC setter helper.
      }

      // Deploy strategy.
      this.strategy = await deployStrategy()

      // Strategy owner.
      const ownerAddr = await this.strategy.owner()
      this.owner = await ethers.getImpersonatedSigner(ownerAddr)

      // Strategy token.
      const indexTokenAddr = await this.strategy.indexToken()
      this.indexToken = await ethers.getContractAt("IndexToken", indexTokenAddr)

      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      // Restore snapshot.
      await this.snapshot.restore()
    })

    testStrategyAccessControl()
    testStrategyComponent()

    for (const strategySpecificTest of strategySpecificTests) {
      strategySpecificTest()
    }

    after(async function () {
      // Reset network.
      await network.provider.request({
        method: "hardhat_reset",
        params: [],
      })

      // Reset live configs.
      execSync(
        `git checkout -- ./configs/${strategyTestOptions.network.name}/live && git clean -fd ./configs/${strategyTestOptions.network.name}/live`,
        { stdio: "inherit" }
      )
    })
  })
}
