import { ethers } from "hardhat"
import { expect } from "chai"
import { BigNumber, Contract } from "ethers"
import { mint } from "./helper/InvestHelper"
import { defaultAffiliatorAddress } from "../helper/constants"
import { getErrorRange } from "../helper/utils"

async function getIndexWeights(strategy: Contract) {
  const componentsLength = await strategy.getComponentsLength()
  var res = new Array()
  for (let i = 0; i < componentsLength; ++i) {
    res.push(await strategy.weights(await strategy.components(i)))
  }
  return res
}

export function testStrategyFee() {
  describe("Continuous performance fee", async function () {
    // deposit, so certain amount of tokens are minted
    it("", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("10", this.depositTokenDecimals),
        defaultAffiliatorAddress
      )

      const indexTokenTotalSupplyBefore: BigNumber = await this.indexToken.totalSupply()
      const user1IndexTokenBalanceBefore: BigNumber = await this.indexToken.balanceOf(this.user1.address)
      const user2IndexTokenBalanceBefore: BigNumber = await this.indexToken.balanceOf(this.user2.address)
      const seqNumBefore: BigNumber = await this.strategy.getSeqNum()
      const indexWeightsBefore = await getIndexWeights(this.strategy)

      // unauthorized user tries to suggest performance fees
      await expect(
        this.strategy.suggestPerformanceFees(
          [[this.user2.address, indexTokenTotalSupplyBefore.div(2)]],
          BigNumber.from(0)
        )
      ).to.be.revertedWithCustomError(this.strategy, "UnauthorizedPerformanceFeeSuggester")

      // authorized user tries to suggest performance fee with wrong sequence number
      await expect(
        this.strategy
          .connect(this.owner)
          .suggestPerformanceFees([[this.user2.address, indexTokenTotalSupplyBefore.div(2)]], BigNumber.from(1))
      ).to.be.revertedWithCustomError(this.strategy, "IncorrectSeqNum")

      // owner tries to suggest performance fee not whitelisted address
      await expect(
        this.strategy
          .connect(this.owner)
          .suggestPerformanceFees([[this.user2.address, indexTokenTotalSupplyBefore.div(2)]], BigNumber.from(0))
      ).to.be.revertedWithCustomError(this.strategy, "UnauthorizedAffiliateAddress")

      // unauthores user tries to whitelist affiliator
      await expect(this.strategy.addAddressesToFeeWhitelist([this.user2.address])).to.be.reverted

      // owner whitelist user2 as an affiliator
      await expect(this.strategy.connect(this.owner).addAddressesToFeeWhitelist([this.user2.address])).to.not.be
        .reverted

      // authorized user tries to suggest performance fee, but only one of the affiliators are whitelisted
      await expect(
        this.strategy.connect(this.owner).suggestPerformanceFees(
          [
            [this.user2.address, indexTokenTotalSupplyBefore.div(2)],
            [this.user1.address, indexTokenTotalSupplyBefore.div(2)],
          ],
          BigNumber.from(0)
        )
      ).to.be.reverted

      // owner whitelist user1 as an affiliator
      await expect(this.strategy.connect(this.owner).addAddressesToFeeWhitelist([this.user1.address])).to.not.be
        .reverted

      // authorized user tries to suggest performance fee with the right sequency number and whitelisted addresses
      await expect(
        this.strategy.connect(this.owner).suggestPerformanceFees(
          [
            [this.user2.address, indexTokenTotalSupplyBefore.div(2)],
            [this.user1.address, indexTokenTotalSupplyBefore.div(2)],
          ],
          BigNumber.from(0)
        )
      ).to.not.be.reverted

      // seq number is unchanged and performance fee updated
      let suggestedPerformanceFee = await this.strategy.getSuggestedPerformanceFee()
      expect(suggestedPerformanceFee[0].affiliateAddress).to.be.equal(this.user2.address)
      expect(suggestedPerformanceFee[0].tokenAmountToMint).to.be.equal(indexTokenTotalSupplyBefore.div(2))
      expect(suggestedPerformanceFee[1].affiliateAddress).to.be.equal(this.user1.address)
      expect(suggestedPerformanceFee[1].tokenAmountToMint).to.be.equal(indexTokenTotalSupplyBefore.div(2))
      expect(await this.strategy.getSeqNum()).to.be.equal(seqNumBefore)

      // authorized user suggests second time, sequence number still unchanged, and performance fee updated
      await expect(
        this.strategy.connect(this.owner).suggestPerformanceFees(
          [
            [this.user1.address, indexTokenTotalSupplyBefore.div(4)],
            [this.user2.address, indexTokenTotalSupplyBefore.div(2)],
          ],
          BigNumber.from(0)
        )
      ).to.not.be.reverted

      suggestedPerformanceFee = await this.strategy.getSuggestedPerformanceFee()
      expect(suggestedPerformanceFee[0].affiliateAddress).to.be.equal(this.user1.address)
      expect(suggestedPerformanceFee[0].tokenAmountToMint).to.be.equal(indexTokenTotalSupplyBefore.div(4))
      expect(suggestedPerformanceFee[1].affiliateAddress).to.be.equal(this.user2.address)
      expect(suggestedPerformanceFee[1].tokenAmountToMint).to.be.equal(indexTokenTotalSupplyBefore.div(2))
      expect(await this.strategy.getSeqNum()).to.be.equal(seqNumBefore)

      // unauthorized user tries to approve fee taking
      await expect(this.strategy.approvePerformanceFees()).to.be.reverted

      // authorized user tries to approve the fee taking after removing one of the whitelisted addresses
      await expect(this.strategy.connect(this.owner).removeAddressesFromFeeWhitelist([this.user2.address])).not.to.be
        .reverted
      await expect(this.strategy.connect(this.owner).approvePerformanceFees()).to.be.revertedWithCustomError(
        this.strategy,
        "UnauthorizedAffiliateAddress"
      )
      await expect(this.strategy.connect(this.owner).addAddressesToFeeWhitelist([this.user2.address])).to.not.be
        .reverted

      // authorized user successfully approves fee taking
      const performanceFeeSuggestionsBeforeApprove = await this.strategy.getSuggestedPerformanceFee()
      await expect(this.strategy.connect(this.owner).approvePerformanceFees())
        .to.emit(this.strategy, "PerformanceFeeApproved")
        .withArgs(
          seqNumBefore.add(1),
          (performanceFeeParameter: any) =>
            JSON.stringify(performanceFeeParameter) == JSON.stringify(performanceFeeSuggestionsBeforeApprove)
        )
      const indexTokenTotalSupplyAfter: BigNumber = await this.indexToken.totalSupply()
      const user1IndexTokenBalanceAfter: BigNumber = await this.indexToken.balanceOf(this.user1.address)
      const user2IndexTokenBalanceAfter: BigNumber = await this.indexToken.balanceOf(this.user2.address)
      const indexWeightsAfter = await getIndexWeights(this.strategy)

      // seqNum increased by 1
      const seqNumAfter: BigNumber = await this.strategy.getSeqNum()
      expect(seqNumAfter).to.be.equal(seqNumBefore.add(1))

      // previously suggested performance fees are cleared
      const performanceFeeSuggestionsAfterApprove = await this.strategy.getSuggestedPerformanceFee()
      expect(performanceFeeSuggestionsAfterApprove).to.be.an("array").that.is.empty

      // index token total supply is increased by 75 percent
      expect(indexTokenTotalSupplyBefore.mul(175).div(100)).to.be.approximately(
        indexTokenTotalSupplyAfter,
        getErrorRange(indexTokenTotalSupplyAfter, BigNumber.from(1), BigNumber.from(10000))
      )

      // user1's index token balance increased by 25% of the 'totalIndexTokenSupply before the approval'
      const user1ExpectedIndexTokenIncrement = user1IndexTokenBalanceBefore.add(indexTokenTotalSupplyBefore.div(4))
      const user1ActualIndexTokenIncrement = user1IndexTokenBalanceAfter.sub(user1IndexTokenBalanceBefore)
      expect(user1ActualIndexTokenIncrement).to.be.approximately(
        user1ExpectedIndexTokenIncrement,
        getErrorRange(user1ExpectedIndexTokenIncrement, BigNumber.from(1), BigNumber.from(10000))
      )

      // user2's index token balance increased by 50% of the 'totalIndexTokenSupply before the approval'
      const user2ExpectedIndexTokenIncrement = user2IndexTokenBalanceBefore.add(indexTokenTotalSupplyBefore.div(2))
      const user2ActualIndexTokenIncrement = user2IndexTokenBalanceAfter.sub(user2IndexTokenBalanceBefore)
      expect(user2ActualIndexTokenIncrement).to.be.approximately(
        user2ExpectedIndexTokenIncrement,
        getErrorRange(user2ExpectedIndexTokenIncrement, BigNumber.from(1), BigNumber.from(10000))
      )

      // index weights have decreseased proportionally
      for (let i = 0; i < indexWeightsBefore.length; ++i) {
        expect(
          indexWeightsAfter[i].mul(indexTokenTotalSupplyAfter).div(indexTokenTotalSupplyBefore)
        ).to.be.approximately(
          indexWeightsBefore[i],
          getErrorRange(indexWeightsBefore[i], BigNumber.from(1), BigNumber.from(10000))
        )
      }
    })
  })
}
