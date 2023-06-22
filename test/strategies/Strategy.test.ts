import { setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { execSync } from "child_process"
import { Contract } from "ethers"
import { ethers, network } from "hardhat"
import AccessControlRoles from "../../constants/AccessControlRoles.json"
import { DepositTokens } from "../../scripts/constants/deposit-tokens"
import { removeInvestmentLimitsAndFees } from "../../scripts/helper/contract"
import { WhaleAddrs } from "../helper/addresses"
import { StrategyTestOptions } from "../helper/interfaces/options"
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

testStrategyAccessControl
testStrategyDeposit
testStrategyERC165
testStrategyPausable
testStrategyReapReward
testStrategyReapRewardExtra
testStrategyReapUninvestedReward
testStrategyUpgradeable
testStrategyFee
testStrategyWithdraw

export function testStrategy(
  description: string,
  deployStrategy: () => Promise<Contract>,
  testOptions: StrategyTestOptions,
  strategySpecificTests: (() => void)[]
) {
  describe(description, function () {
    before(async function () {
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            allowUnlimitedContractSize: true,
            blockGasLimit: 30_000_000,
            forking: {
              jsonRpcUrl: testOptions.network.url,
              enabled: true,
              blockNumber: testOptions.forkAt,
            },
          },
        ],
      })

      // Users.
      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.userCount = 3

      // Airdrop signers.
      const whaleAddrs: [string, string][] = WhaleAddrs.get(testOptions.network.name)!

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

      // Deposit token.
      this.depositToken = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
        await this.strategy.getDepositToken()
      )
      this.depositTokenDecimals = await this.depositToken.decimals()

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

      // Strategy token.
      const investmentTokenAddr = await this.strategy.getInvestmentToken()
      this.investmentToken = await ethers.getContractAt("InvestmentToken", investmentTokenAddr)

      // Strategy price oracle.
      this.priceOracle = await this.strategy.priceOracle()

      // Strategy swap service.
      const swapService = await this.strategy.swapService()
      this.swapServiceProvider = swapService.provider
      this.swapServiceRouter = swapService.router

      // Set investment limits of strategy to big enough value and all kinds of fee to zero
      // to prevent any test being affected by the limits.
      await removeInvestmentLimitsAndFees(this.strategy, this.owner)

      // Strategy parameters.
      this.depositFee = await this.strategy.getDepositFee([])
      this.depositFeeParams = [] // Not implemented yet.
      this.withdrawalFee = await this.strategy.getWithdrawalFee([])
      this.withdrawalFeeParams = [] // Not implemented yet.
      this.performanceFee = await this.strategy.getPerformanceFee([])
      this.performanceFeeParams = [] // Not implemented yet.
      this.managementFee = await this.strategy.getManagementFee([])
      this.managementFeeParams = [] // Not implemented yet.
      this.feeReceiver = await this.strategy.getFeeReceiver([])
      this.feeReceiverParams = [] // Not implemented yet.
      this.totalInvestmentLimit = await this.strategy.getTotalInvestmentLimit()
      this.investmentLimitPerAddress = await this.strategy.getInvestmentLimitPerAddress()

      // Store equity valuation and investment token supply to make tests also work for existing strategies.
      this.equityValuation = await this.strategy.getEquityValuation(true, false)
      this.investmentTokenSupply = await this.strategy.getInvestmentTokenSupply()

      // Store investment token price for fee tests.
      this.investmentTokenPrice =
        this.investmentTokenSupply == 0 ? 1 : this.equityValuation / this.investmentTokenSupply

      // Set investable to strategy for shared tests.
      this.investable = this.strategy

      // Set invest helper.
      this.investHelper = new InvestHelper(this.depositToken)

      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      // Restore snapshot.
      await this.snapshot.restore()
    })

    testStrategyAccessControl()
    testStrategyDeposit()
    testStrategyFee()
    testStrategyPausable()
    if (testOptions.runReapReward !== false) testStrategyReapReward()
    if (testOptions.runReapRewardExtra !== false) testStrategyReapRewardExtra()
    if (testOptions.runReapUninvestedReward !== false) testStrategyReapUninvestedReward()
    testStrategyUpgradeable()
    testStrategyWithdraw()
    // temporarily switched off, until the interface becomes more stable
    // testStrategyERC165()

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
        `git checkout -- ./configs/${testOptions.network.name}/live && git clean -fd ./configs/${testOptions.network.name}/live`,
        { stdio: "inherit" }
      )
    })
  })
}
