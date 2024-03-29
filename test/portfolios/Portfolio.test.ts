import { setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { execSync } from "child_process"
import { Contract } from "ethers"
import { ethers, network } from "hardhat"
import AccessControlRoles from "../../constants/AccessControlRoles.json"
import { removeInvestmentLimitsAndFees } from "../../scripts/helper/contract"
import { WhaleAddrs } from "../helper/addresses"
import { PortfolioTestOptions } from "../helper/interfaces/options"
import { InvestHelper } from "../helper/invest"
import { testPortfolioAccessControl } from "./PortfolioAccessControl.test"
import { testPortfolioAllocations } from "./PortfolioAllocations.test"
import { testPortfolioDeposit } from "./PortfolioDeposit.test"
import { testPortfolioInvestable } from "./PortfolioInvestable.test"
import { testPortfolioPausable } from "./PortfolioPausable.test"
import { testPortfolioRebalance } from "./PortfolioRebalance.test"
import { testPortfolioUpgradeable } from "./PortfolioUpgradeable.test"
import { testPortfolioWithdraw } from "./PortfolioWithdraw.test"

export function testPortfolio(
  description: string,
  deployPortfolio: () => Promise<Contract>,
  testOptions: PortfolioTestOptions,
  portfolioSpecificTests: (() => void)[]
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
            .transfer(this.signers[i].address, ethers.utils.parseUnits("10000", await depositToken.decimals()))
        }
      }

      // Deploy portfolio and its all investables.
      this.portfolio = await deployPortfolio()

      // Deposit token.
      this.depositToken = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
        await this.portfolio.getDepositToken()
      )
      this.depositTokenDecimals = await this.depositToken.decimals()

      // Portfolio upgradeability test to.
      this.upgradeTo = testOptions.upgradeTo

      // Query current roles
      const ownerAddr = await this.portfolio.getRoleMember(AccessControlRoles.admin, 0)
      this.owner = await ethers.getImpersonatedSigner(ownerAddr)

      const adminMemberAddr = await this.portfolio.getRoleMember(AccessControlRoles.admin, 0)
      this.adminMember = await ethers.getImpersonatedSigner(adminMemberAddr)

      const governorMemberAddr = await this.portfolio.getRoleMember(AccessControlRoles.governor, 0)
      this.governorMember = await ethers.getImpersonatedSigner(governorMemberAddr)

      const strategistMemberAddr = await this.portfolio.getRoleMember(AccessControlRoles.strategist, 0)
      this.strategistMember = await ethers.getImpersonatedSigner(strategistMemberAddr)

      const maintainerMemberAddr = await this.portfolio.getRoleMember(AccessControlRoles.maintainer, 0)
      this.maintainerMember = await ethers.getImpersonatedSigner(maintainerMemberAddr)

      const upgradeMemberAddr = await this.portfolio.getRoleMember(AccessControlRoles.upgrade, 0)
      this.upgradeMember = await ethers.getImpersonatedSigner(upgradeMemberAddr)

      const pauseMemberAddr = await this.portfolio.getRoleMember(AccessControlRoles.pause, 0)
      this.pauseMember = await ethers.getImpersonatedSigner(pauseMemberAddr)

      // Portfolio token.
      const investmentTokenAddr = await this.portfolio.getInvestmentToken()
      this.investmentToken = await ethers.getContractAt("InvestmentToken", investmentTokenAddr)

      // Set investment limits of portfolio and all its investables to big enough value
      // and all kinds of fee to zero to prevent any test being affected by the limits.
      await removeInvestmentLimitsAndFees(this.portfolio, this.owner)

      // Portfolio parameters.
      this.depositFee = await this.portfolio.getDepositFee([])
      this.depositFeeParams = [] // Not implemented yet.
      this.withdrawalFee = await this.portfolio.getWithdrawalFee([])
      this.withdrawalFeeParams = [] // Not implemented yet.
      this.performanceFee = await this.portfolio.getPerformanceFee([])
      this.performanceFeeParams = [] // Not implemented yet.
      this.feeReceiver = await this.portfolio.getFeeReceiver([])
      this.feeReceiverParams = [] // Not implemented yet.
      this.totalInvestmentLimit = await this.portfolio.getTotalInvestmentLimit()
      this.investmentLimitPerAddress = await this.portfolio.getInvestmentLimitPerAddress()

      // Store equity valuation and investment token supply to make tests also work for existing portfolios.
      this.equityValuation = await this.portfolio.getEquityValuation(true, false)
      this.investmentTokenSupply = await this.portfolio.getInvestmentTokenSupply()

      // Set investable to portfolio for shared tests.
      this.investable = this.portfolio

      // Set invest helper.
      this.investHelper = new InvestHelper(this.depositToken)

      // Take snapshot.
      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      // Restore snapshot.
      await this.snapshot.restore()
    })

    testPortfolioAccessControl()
    testPortfolioAllocations()
    testPortfolioDeposit()
    testPortfolioInvestable()
    testPortfolioPausable()
    testPortfolioRebalance()
    if (testOptions.upgradeTo !== "") testPortfolioUpgradeable()
    testPortfolioWithdraw()
    // temporarily switched off, until the interface becomes more stable
    // testPortfolioERC165()

    for (const portfolioSpecificTest of portfolioSpecificTests) {
      portfolioSpecificTest()
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
