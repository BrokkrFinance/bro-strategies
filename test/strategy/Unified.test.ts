import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { ethers, network, upgrades } from "hardhat"
import { TokenAddrs, WhaleAddrs } from "../shared/addresses"
import { getTokenContract } from "../shared/contracts"
import { Oracle } from "../shared/oracles"
import { SwapServices } from "../shared/swaps"
import { testDeposit } from "./UnifiedDeposit.test"
import { testERC165 } from "./UnifiedERC165.test"
import { testFee } from "./UnifiedFee.test"
import { testOwnable } from "./UnifiedOwnable.test"
import { testPausable } from "./UnifiedPausable.test"
import { testReapReward } from "./UnifiedReapReward.test"
import { testUpgradeable } from "./UnifiedUpgradeable.test"
import { testWithdraw } from "./UnifiedWithdraw.test"

export function testStrategy(
  description: string,
  strategyName: string,
  strategyExtraArgs: any[],
  oracle: Oracle,
  strategySpecificTests: (() => any)[]
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
              blockNumber: 18191781,
            },
          },
        ],
      })

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
        // TODO: Airdrop 10000 USDC to each signers.
        // TODO: Add USDC setter helper.
      }

      // Contact factories.
      this.PriceOracle = await ethers.getContractFactory(oracle.name)
      this.InvestmentToken = await ethers.getContractFactory("InvestmentToken")
      this.Strategy = await ethers.getContractFactory(strategyName)

      // Strategy parameters.
      this.usdc = await getTokenContract(TokenAddrs.usdc)
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
      this.swapServiceProvider = SwapServices.traderjoe.provider
      this.swapServiceRouter = SwapServices.traderjoe.router

      // Deploy contracts.
      this.priceOracle = await upgrades.deployProxy(this.PriceOracle, [oracle.address, this.usdc.address], {
        kind: "uups",
      })
      await this.priceOracle.deployed()

      this.investmentToken = await upgrades.deployProxy(this.InvestmentToken, ["InvestmentToken", "IVST"], {
        kind: "uups",
      })
      await this.investmentToken.deployed()

      this.strategy = await upgrades.deployProxy(
        this.Strategy,
        [
          [
            this.investmentToken.address,
            this.usdc.address,
            this.depositFee,
            this.depositFeeParams,
            this.withdrawalFee,
            this.withdrawalFeeParams,
            this.performanceFee,
            this.performanceFeeParams,
            this.feeReceiver,
            this.feeReceiverParams,
            this.totalInvestmentLimit,
            this.investmentLimitPerAddress,
            this.priceOracle.address,
            this.swapServiceProvider,
            this.swapServiceRouter,
          ],
          ...strategyExtraArgs,
        ],
        { kind: "uups" }
      )
      await this.strategy.deployed()

      await this.investmentToken.transferOwnership(this.strategy.address)

      this.snapshot = await takeSnapshot()
    })

    beforeEach(async function () {
      await this.snapshot.restore()
    })

    testDeposit()
    testERC165()
    testFee()
    testOwnable()
    testPausable()
    testReapReward()
    testUpgradeable()
    testWithdraw()

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
