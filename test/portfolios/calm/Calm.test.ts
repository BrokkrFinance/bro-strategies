import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import { deployPortfolio, upgradePortfolio } from "../../../scripts/helper/contract"
import { testPortfolio } from "../Portfolio.test"

testPortfolio("Calm Portfolio - Deploy", deployCalmPortfolio, "PercentageAllocationV2", [testCalmPortfolioAum])
testPortfolio("Calm Portfolio - Upgrade After Deploy", upgradeCalmPortfolio, "PercentageAllocationV2", [
  testCalmPortfolioAum,
])

async function deployCalmPortfolio() {
  return await deployPortfolio("Calm")
}

async function upgradeCalmPortfolio() {
  return await upgradePortfolio("Calm")
}

function testCalmPortfolioAum() {
  describe("AUM - PercentageAllocation Portfolio Specific", async function () {
    it("should succeed after upgrade", async function () {
      const assetBalancesBefore = await this.portfolio.getAssetBalances()
      const assetValuationsBefore = await this.portfolio.getAssetValuations(true, false)
      const equityValuationBefore = await this.portfolio.getEquityValuation(true, false)

      const PortfolioV2 = await ethers.getContractFactory("PercentageAllocationV2", this.owner)
      const portfolioV2 = await upgrades.upgradeProxy(this.portfolio.address, PortfolioV2)
      await portfolioV2.deployed()

      const assetBalancesAfter = await this.portfolio.getAssetBalances()
      const assetValuationsAfter = await this.portfolio.getAssetValuations(true, false)
      const equityValuationAfter = await this.portfolio.getEquityValuation(true, false)

      expect(assetBalancesBefore[0].asset).to.equal(assetBalancesAfter[0].asset)
      expect(assetBalancesBefore[0].balance).to.equal(assetBalancesAfter[0].balance)

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore[0].asset).to.equal(assetValuationsAfter[0].asset)
      expect(assetValuationsBefore[0].valuation).to.equal(assetValuationsAfter[0].valuation)

      expect(await this.portfolio.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(equityValuationBefore.eq(equityValuationAfter)).to.equal(true)
    })
  })
}
