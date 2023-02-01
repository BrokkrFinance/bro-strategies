import { setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { execSync } from "child_process"
import { Contract } from "ethers"
import { ethers, network } from "hardhat"
import AccessControlRoles from "../../constants/AccessControlRoles.json"
import Tokens from "../../constants/addresses/Tokens.json"
import blockNumber from "../../constants/BlockNumber.json"
import { removeInvestmentLimitsAndFees } from "../../scripts/helper/contract"
import { WhaleAddrs } from "../helper/addresses"
import { TestOptions } from "../helper/interfaces/options"
import { InvestHelper } from "../helper/invest"
import { testStrategyAccessControl } from "./StrategyAccessControl.test"
import { testStrategyDeposit } from "./StrategyDeposit.test"
import { testStrategyERC165 } from "./StrategyERC165.test"
import { testStrategyFee } from "./StrategyFee.test"
import { testStrategyPausable } from "./StrategyPausable.test"
import { testStrategyReapReward } from "./StrategyReapReward.test"
import { testStrategyReapRewardExtra } from "./StrategyReapRewardExtra.test"
import { testStrategyReapUninvestedReward } from "./StrategyReapUninvestedReward.test"
import { testStrategyUpgradeable } from "./StrategyUpgradeable.test"
import { testStrategyWithdraw } from "./StrategyWithdraw.test"

export function testStrategy(
  description: string,
  deployStrategy: () => Promise<Contract>,
  testOptions: TestOptions,
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
              jsonRpcUrl: "https://nd-297-861-567.p2pify.com/763dd8e4dd3f92cfab52baea4bda7661",
              enabled: true,
              blockNumber: blockNumber.forkAt,
            },
          },
        ],
      })

      // Get ERC20 tokens.
      this.usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", Tokens.bscBusd)

      // Users.
      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.userCount = 3

      // Airdrop signers.
      this.impersonatedSigner = await ethers.getImpersonatedSigner(WhaleAddrs.usdc)
      console.log("!!!!1")
      await setBalance(this.impersonatedSigner.address, ethers.utils.parseEther("10000"))
      console.log("!!!!2")
      for (let i = 0; i <= this.userCount; i++) {
        console.log("!!!!3")
        await setBalance(this.signers[i].address, ethers.utils.parseEther("10000"))
        console.log("!!!!4")
        await this.usdc
          .connect(this.impersonatedSigner)
          .transfer(this.signers[i].address, ethers.utils.parseUnits("10000", 6))
        // TODO: Add USDC setter helper.
      }
      console.log("RRRRRRRRRRRRRRRRRRRRRR0")

      // Deploy strategy.
      this.strategy = await deployStrategy()
      console.log("RRRRRRRRRRRRRRRRRRRRRR1")
      // Portfolio upgradeability test to.
      this.upgradeTo = testOptions.upgradeTo

      // Strategy owner and role members.
      const isRoleable = await this.strategy.supportsInterface("0x5A05180F") // IAccessControlEnumerableUpgradeable
      if (isRoleable) {
        const ownerAddr = await this.strategy.getRoleMember(AccessControlRoles.admin, 0)
        this.owner = await ethers.getImpersonatedSigner(ownerAddr)

        const adminMemberAddr = await this.strategy.getRoleMember(AccessControlRoles.admin, 0)
        this.adminMember = await ethers.getImpersonatedSigner(adminMemberAddr)

        const governorMemberAddr = await this.strategy.getRoleMember(AccessControlRoles.governor, 0)
        this.governorMember = await ethers.getImpersonatedSigner(governorMemberAddr)

        const strategistMemberAddr = await this.strategy.getRoleMember(AccessControlRoles.strategist, 0)
        this.strategistMember = await ethers.getImpersonatedSigner(strategistMemberAddr)

        const maintainerMemberAddr = await this.strategy.getRoleMember(AccessControlRoles.maintainer, 0)
        this.maintainerMember = await ethers.getImpersonatedSigner(maintainerMemberAddr)

        const upgradeMemberAddr = await this.strategy.getRoleMember(AccessControlRoles.upgrade, 0)
        this.upgradeMember = await ethers.getImpersonatedSigner(upgradeMemberAddr)

        const pauseMemberAddr = await this.strategy.getRoleMember(AccessControlRoles.pause, 0)
        this.pauseMember = await ethers.getImpersonatedSigner(pauseMemberAddr)
      } else {
        const ownerAddr = await this.strategy.owner()
        this.owner = await ethers.getImpersonatedSigner(ownerAddr)
      }

      console.log("RRRRRRRRRRRRRRRRRRRRRRxxxx")
      // Strategy token.
      const investmentTokenAddr = await this.strategy.getInvestmentToken()
      this.investmentToken = await ethers.getContractAt("InvestmentToken", investmentTokenAddr)

      // Strategy price oracle.
      this.priceOracle = await this.strategy.priceOracle()

      // Strategy swap service.
      const swapService = await this.strategy.swapService()
      this.swapServiceProvider = swapService.provider
      this.swapServiceRouter = swapService.router

      console.log("RRRRRRRRRRRRRRRRRRRRRRxxxx10")
      // Set investment limits of strategy to big enough value and all kinds of fee to zero
      // to prevent any test being affected by the limits.
      await removeInvestmentLimitsAndFees(this.strategy, this.owner)

      console.log("RRRRRRRRRRRRRRRRRRRRRRxxxx11")
      // Strategy parameters.
      this.depositFee = await this.strategy.getDepositFee([])
      this.depositFeeParams = [] // Not implemented yet.
      this.withdrawalFee = await this.strategy.getWithdrawalFee([])
      this.withdrawalFeeParams = [] // Not implemented yet.
      this.performanceFee = await this.strategy.getPerformanceFee([])
      this.performanceFeeParams = [] // Not implemented yet.
      this.feeReceiver = await this.strategy.getFeeReceiver([])
      this.feeReceiverParams = [] // Not implemented yet.
      this.totalInvestmentLimit = await this.strategy.getTotalInvestmentLimit()
      this.investmentLimitPerAddress = await this.strategy.getInvestmentLimitPerAddress()
      console.log("RRRRRRRRRRRRRRRRRRRRRRxxxx3")
      // Store equity valuation and investment token supply to make tests also work for existing strategies.
      this.equityValuation = await this.strategy.getEquityValuation(true, false)
      this.investmentTokenSupply = await this.strategy.getInvestmentTokenSupply()

      // Store investment token price for fee tests.
      this.investmentTokenPrice =
        this.investmentTokenSupply == 0 ? 1 : this.equityValuation / this.investmentTokenSupply
      console.log("RRRRRRRRRRRRRRRRRRRRRRxxxx6")
      // Set investable to strategy for shared tests.
      this.investable = this.strategy

      // Set invest helper.
      this.investHelper = new InvestHelper(this.usdc)

      this.snapshot = await takeSnapshot()
      console.log("RRRRRRRRRRRRRRRRRRRRRR2")
    })

    beforeEach(async function () {
      // Restore snapshot.
      await this.snapshot.restore()
    })
    console.log("RRRRRRRRRRRRRRRRRRRRRR3")
    testStrategyAccessControl()
    testStrategyDeposit()
    testStrategyERC165()
    testStrategyFee()
    testStrategyPausable()
    if (testOptions.runReapReward !== false) testStrategyReapReward()
    if (testOptions.runReapRewardExtra !== false) testStrategyReapRewardExtra()
    if (testOptions.runReapUninvestedReward !== false) testStrategyReapUninvestedReward()
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
      execSync("git checkout -- ./configs/live && git clean -fd ./configs/live", { stdio: "inherit" })
    })
  })
}
