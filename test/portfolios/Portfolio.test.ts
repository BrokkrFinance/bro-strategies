import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { ethers, network } from "hardhat"
import Tokens from "../../constants/addresses/Tokens.json"
import blockNumber from "../../constants/BlockNumber.json"
import { removeInvestmentLimitsAndFees } from "../../scripts/helper/contract"
import { WhaleAddrs } from "../helper/addresses"
import { InvestHelper } from "../helper/invest"
import { testPortfolioAccessControl } from "./PortfolioAccessControl.test"
import { testPortfolioAllocations } from "./PortfolioAllocations.test"
import { testPortfolioDeposit } from "./PortfolioDeposit.test"
import { testPortfolioERC165 } from "./PortfolioERC165.test"
import { testPortfolioInvestable } from "./PortfolioInvestable.test"
import { testPortfolioPausable } from "./PortfolioPausable.test"
import { testPortfolioRebalance } from "./PortfolioRebalance.test"
import { testPortfolioUpgradeable } from "./PortfolioUpgradeable.test"
import { testPortfolioWithdraw } from "./PortfolioWithdraw.test"
import { execSync } from "child_process"
import { Contract } from "ethers"

export function testPortfolio(
  description: string,
  deployPortfolio: () => Promise<Contract>,
  upgradeTo: string,
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
              jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
              enabled: true,
              blockNumber: blockNumber.forkAt,
            },
          },
        ],
      })

      // Get ERC20 tokens.
      this.usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", Tokens.usdc)

      // Users.
      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.userCount = 3

      // Airdrop signers.
      this.impersonatedSigner = await ethers.getImpersonatedSigner(WhaleAddrs.usdc)
      for (let i = 0; i <= this.userCount; i++) {
        await this.impersonatedSigner.sendTransaction({
          to: this.signers[i].address,
          value: ethers.utils.parseEther("100"),
        })
        await this.usdc
          .connect(this.impersonatedSigner)
          .transfer(this.signers[i].address, ethers.utils.parseUnits("10000", 6))
        // TODO: Add USDC setter helper.
      }

      // Deploy portfolio and its all investables.
      this.portfolio = await deployPortfolio()

      // Portfolio upgradeability test to.
      this.upgradeTo = upgradeTo

      // Portfolio owner.
      const ownerAddr = await this.portfolio.owner()
      this.owner = await ethers.getImpersonatedSigner(ownerAddr)

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
      this.investHelper = new InvestHelper(this.usdc)

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
    testPortfolioERC165()
    testPortfolioInvestable()
    testPortfolioPausable()
    testPortfolioRebalance()
    testPortfolioUpgradeable()
    testPortfolioWithdraw()

    for (const portfolioSpecificTest of portfolioSpecificTests) {
      portfolioSpecificTest()
    }

    after(async function () {
      // Reset network.
      await network.provider.request({
        method: "hardhat_reset",
        params: [],
      })

      // Reset configs.
      execSync("git checkout -- ./configs && git clean -fd ./configs")
    })
  })
}
