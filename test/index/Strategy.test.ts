import { setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { execSync } from "child_process"
import { BigNumber, Contract } from "ethers"
import { ethers, network } from "hardhat"
import { NativeToken } from "../../scripts/constants/deposit-tokens"
import { WhaleAddrs } from "../helper/addresses"
import { IndexTestOptions } from "../helper/interfaces/options"
import { testStrategyAccessControl } from "./StrategyAccessControl.test"
import { testStrategyComponent } from "./StrategyComponent.test"
import { testStrategyDeposit } from "./StrategyDeposit.test"
import { testStrategyOracle } from "./StrategyOracle.test"
import { testStrategyPausable } from "./StrategyPausable.test"
import { testStrategyRebalance } from "./StrategyRebalance.test"
import { testStrategyToken } from "./StrategyToken.test"
import { testStrategyUpgradeable } from "./StrategyUpgradeable.test"
import { testStrategyWithdraw } from "./StrategyWithdraw.test"
import { testStrategyFee } from "./StrategyFee.test"

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

      // Network config.
      let networkName = strategyTestOptions.network.name

      execSync(`cp .openzeppelin/${networkName}.json .openzeppelin/unknown-31337.json`, {
        stdio: "inherit",
      })

      // Users.
      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.userCount = 3

      // Airdrop signers.
      const whaleAddrs: [string, string][] = WhaleAddrs.get(strategyTestOptions.network.name)!

      for (let i = 0; i <= this.userCount; i++) {
        // Airdrop native token.
        await setBalance(this.signers[i].address, ethers.utils.parseEther("10000"))

        for (const whaleAddr of whaleAddrs) {
          const depositToken = await ethers.getContractAt(
            "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
            whaleAddr[0]
          )
          const whale = await ethers.getImpersonatedSigner(whaleAddr[1])

          await setBalance(whale.address, ethers.utils.parseEther("10000"))

          // Airdrop all possible deposit tokens.
          await depositToken
            .connect(whale)
            .transfer(this.signers[i].address, ethers.utils.parseUnits("100", await depositToken.decimals()))
        }
      }

      // Deploy strategy.
      this.strategy = await deployStrategy()

      // Strategy owner.
      const ownerAddr = await this.strategy.owner()
      this.owner = await ethers.getImpersonatedSigner(ownerAddr)
      await setBalance(this.owner.address, ethers.utils.parseEther("10000"))

      // Deposit token.
      this.depositTokenAddress = await this.strategy.whitelistedTokens(0)
      if (this.depositTokenAddress === NativeToken) {
        this.depositToken = undefined
        this.depositTokenDecimals = 18
        await this.strategy.connect(this.owner).addWhitelistedTokens([NativeToken])
      } else {
        this.depositToken = await ethers.getContractAt(
          "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
          this.depositTokenAddress
        )
        this.depositTokenDecimals = await this.depositToken.decimals()
      }

      // Strategy token.
      const indexTokenAddr = await this.strategy.indexToken()
      this.indexToken = await ethers.getContractAt("IndexToken", indexTokenAddr)

      // Oracle.
      if (strategyTestOptions.network.name === "arbitrum") {
        this.oracleName = "OracleArbitrum"
        this.oracleWETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
        this.oracleWETHPriceFeed = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612"
      } else if (strategyTestOptions.network.name === "avalanche") {
        this.oracleName = "OracleAvalanche"
        this.oracleWETH = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
        this.oracleWETHPriceFeed = "0x0A77230d17318075983913bC2145DB16C7366156"
      }

      // wNATIVE.
      this.wNATIVE = await this.strategy.wNATIVE()

      // Upgradeability test to.
      this.upgradeTo = strategyTestOptions.upgradeTo

      // Remove investment limit.
      await this.strategy.connect(this.owner).setEquityValuationLimit(
        BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935") // 2^256 - 1
      )

      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      // Restore snapshot.
      await this.snapshot.restore()
    })

    testStrategyAccessControl()
    testStrategyComponent()
    testStrategyDeposit()
    testStrategyFee()
    // testStrategyLimit() // Opt-out investment limit test because it fails when the limit is way higher than component's pool depth.
    testStrategyOracle()
    testStrategyPausable()
    if (strategyTestOptions.runRebalance !== false) testStrategyRebalance()
    testStrategyToken()
    testStrategyUpgradeable()
    testStrategyWithdraw()

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
