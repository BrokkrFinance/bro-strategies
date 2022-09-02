import { ethers } from "hardhat"
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { TokenAddrs, WhaleAddrs } from "../shared/addresses"
import { getTokenContract } from "../shared/contracts"
import { testAllocations } from "./UnifiedAllocations.test"
import { testDeposit } from "./UnifiedDeposit.test"
import { testERC165 } from "./UnifiedERC165.test"
import { testInvestable } from "./UnifiedInvestable.test"
import { testOwnable } from "./UnifiedOwnable.test"
import { testPausable } from "./UnifiedPausable.test"
import { testRebalance } from "./UnifiedRebalance.test"
import { testUpgradeable } from "./UnifiedUpgradeable.test"
import { testWithdraw } from "./UnifiedWithdraw.test"

export function testPortfolio(description: string, deployPortfolio: Function, portfolioSpecificTests: (() => any)[]) {
  describe(description, function () {
    before(async function () {
      // Get ERC20 tokens.
      this.usdc = await getTokenContract(TokenAddrs.usdc)

      // Signers.
      this.signers = await ethers.getSigners()
      this.owner = this.signers[0]
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
      }

      // Portfolio parameters.
      this.depositFee = 0
      this.depositFeeParams = []
      this.withdrawalFee = 0
      this.withdrawalFeeParams = []
      this.performanceFee = 0
      this.performanceFeeParams = []
      this.feeReceiver = this.owner.address
      this.feeReceiverParams = []
      this.totalInvestmentLimit = BigInt(1e20)
      this.investmentLimitPerAddress = BigInt(1e20)

      // Deploy portfolio and all its investables.
      this.portfolio = await deployPortfolio(this)

      const investmentTokenAddr = await this.portfolio.getInvestmentToken()
      this.investmentToken = await getTokenContract(investmentTokenAddr)

      // Take snapshot.
      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      // Restore snapshot.
      await this.snapshot.restore()
    })

    testAllocations()
    testDeposit()
    testERC165()
    testInvestable()
    testOwnable()
    testPausable()
    testRebalance()
    testUpgradeable()
    testWithdraw()

    for (const portfolioSpecificTest of portfolioSpecificTests) {
      portfolioSpecificTest()
    }
  })
}
