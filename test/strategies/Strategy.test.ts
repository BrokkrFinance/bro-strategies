import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { ethers, network } from "hardhat"
import AccessControlRoles from "../../constants/AccessControlRoles.json"
import Tokens from "../../constants/addresses/Tokens.json"
import { WhaleAddrs } from "../helper/addresses"
import { removeInvestmentLimitsAndFees } from "../../scripts/helper/contract"
import { InvestHelper } from "../helper/invest"
import { testStrategyAccessControl } from "./StrategyAccessControl.test"
import { testStrategyDeposit } from "./StrategyDeposit.test"
import { testStrategyERC165 } from "./StrategyERC165.test"
import { testStrategyFee } from "./StrategyFee.test"
import { testStrategyPausable } from "./StrategyPausable.test"
import { testStrategyReapReward } from "./StrategyReapReward.test"
import { testStrategyUpgradeable } from "./StrategyUpgradeable.test"
import { testStrategyWithdraw } from "./StrategyWithdraw.test"
import { Contract } from "ethers"

export function testStrategy(
  description: string,
  deployStrategy: () => Promise<Contract>,
  upgradeTo: string,
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
              jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
              enabled: true,
              blockNumber: 21777750,
            },
          },
        ],
      })

      // Get ERC20 tokens.
      this.usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", Tokens.usdc)

      // Signers.
      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.userCount = 3

      // Airdrop signers.
      this.impersonatedSigner = await ethers.getImpersonatedSigner(WhaleAddrs.usdc)
      for (let i = 1; i <= this.userCount; i++) {
        await this.impersonatedSigner.sendTransaction({
          to: this.signers[i].address,
          value: ethers.utils.parseEther("100"),
        })
        await this.usdc
          .connect(this.impersonatedSigner)
          .transfer(this.signers[i].address, ethers.utils.parseUnits("10000", 6))
        // TODO: Add USDC setter helper.
      }

      // Deploy strategy.
      this.strategy = await deployStrategy()

      // Portfolio upgradeability test to.
      this.upgradeTo = upgradeTo

      // Strategy owner.
      // TODO: Each role must be handled seperately.
      const isRoleable = await this.strategy.supportsInterface("0x5A05180F") // IAccessControlEnumerableUpgradeable
      const ownerAddr = isRoleable
        ? await this.strategy.getRoleMember(AccessControlRoles.admin, 0)
        : await this.strategy.owner()
      this.owner = await ethers.getImpersonatedSigner(ownerAddr)

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
      this.investHelper = new InvestHelper(this.usdc)

      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      await this.snapshot.restore()
    })

    testStrategyAccessControl()
    testStrategyDeposit()
    testStrategyERC165()
    testStrategyFee()
    testStrategyPausable()
    testStrategyReapReward()
    testStrategyUpgradeable()
    testStrategyWithdraw()

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