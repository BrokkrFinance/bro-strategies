import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import joePairAbi from "../../shared/abi/joePair.json"
import { TraderJoeAddrs } from "../../shared/addresses"
import { Oracles } from "../../shared/oracles"
import { airdropToken, getErrorRange } from "../../shared/utils"
import { testStrategy } from "../Unified.test"

testStrategy(
  "TraderJoe USDC-USDC.e Strategy",
  "TraderJoe",
  [TraderJoeAddrs.router, TraderJoeAddrs.masterChef, TraderJoeAddrs.lpToken, TraderJoeAddrs.joeToken],
  Oracles.gmx,
  [testTraderJoeAum, testTraderJoeInitialize, testTraderJoeUpgradeable]
)

function testTraderJoeAum() {
  describe("AUM - TraderJoe Strategy Specific", async function () {
    it("should succeed after a single deposit", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("100", 6), this.user0.address, [])

      const lpTokenContract = await ethers.getContractAt(joePairAbi, TraderJoeAddrs.lpToken)
      const [, reserves1] = await lpTokenContract.getReserves() // USDC reserve in USDC-USDC.e pool
      const totalSupply = await lpTokenContract.totalSupply()
      const lpBalance = ethers.utils.parseUnits("100", 6).div(2).mul(totalSupply).div(reserves1)

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(TraderJoeAddrs.lpToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(lpBalance, getErrorRange(lpBalance))

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(TraderJoeAddrs.lpToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
    })

    it("should succeed after multiple deposits and withdrawals", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("20", 6))
      await this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("20", 6), this.user0.address, [])

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("10", 6))
      await this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("10", 6), this.user0.address, [])

      const lpTokenContract = await ethers.getContractAt(joePairAbi, TraderJoeAddrs.lpToken)
      const [, reserves1] = await lpTokenContract.getReserves() // USDC reserve in USDC-USDC.e pool
      const totalSupply = await lpTokenContract.totalSupply()
      const lpBalance = ethers.utils.parseUnits("70", 6).div(2).mul(totalSupply).div(reserves1)

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(TraderJoeAddrs.lpToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(lpBalance, getErrorRange(lpBalance))

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(TraderJoeAddrs.lpToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
    })
  })
}

function testTraderJoeInitialize() {
  describe("Initialize - TraderJoe USDC Strategy Specific", async function () {
    it("should fail when passed wrong LP token address", async function () {
      await expect(
        upgrades.deployProxy(
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
            TraderJoeAddrs.router,
            TraderJoeAddrs.masterChef,
            this.usdc.address,
            TraderJoeAddrs.joeToken,
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })
  })
}

function testTraderJoeUpgradeable() {
  describe("Upgradeable - TraderJoe Strategy Specific", async function () {
    it("should succeed to leave all strategy specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)
      const equityValuationBefore = await this.strategy.getEquityValuation(true, false)

      const TraderJoeV2 = await ethers.getContractFactory("TraderJoeV2")
      const traderJoeV2 = await upgrades.upgradeProxy(this.strategy.address, TraderJoeV2, {
        call: {
          fn: "initialize",
          args: [
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
            TraderJoeAddrs.router,
            TraderJoeAddrs.masterChef,
            TraderJoeAddrs.lpToken,
            TraderJoeAddrs.joeToken,
          ],
        },
      })
      await traderJoeV2.deployed()

      // IAum.
      const assetBalancesAfter = await this.strategy.getAssetBalances()
      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      const equityValuationAfter = await this.strategy.getEquityValuation(true, false)

      // IAum.
      expect(assetBalancesBefore[0].asset).to.equal(assetBalancesAfter[0].asset)
      expect(assetBalancesBefore[0].balance).to.equal(assetBalancesAfter[0].balance)

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore[0].asset).to.equal(assetValuationsAfter[0].asset)
      expect(assetValuationsBefore[0].valuation).to.equal(assetValuationsAfter[0].valuation)

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(equityValuationBefore.eq(equityValuationAfter)).to.equal(true)

      // IInvestable.
      expect(await this.strategy.name()).to.equal("brokkr.traderjoe_strategy.traderjoe_strategy_v2.0.0")
      expect(await this.strategy.humanReadableName()).to.equal("TraderJoe Strategy")
      expect(await this.strategy.version()).to.equal("2.0.0")
    })
  })
}
