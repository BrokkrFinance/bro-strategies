import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { BigNumber, Contract } from "ethers"
import { ethers } from "hardhat"
import erc20Abi from "../helper/abi/erc20.json"
import { WithdrawArgs } from "./parameters"
import { getErrorRange } from "./utils"

enum WithdrawResult {
  SUCCESS,
  REVERTED,
}

interface WithdrawStates {
  depositTokenBalance: BigNumber
  investmentTokenBalance: BigNumber
  equityValuation: BigNumber
  investmentTokenSupply: BigNumber
}

export class WithdrawHelper {
  public depositToken: Contract

  private investable!: Contract
  private withdrawer!: SignerWithAddress
  private withdrawArgs!: WithdrawArgs
  private statesBefore: WithdrawStates = {
    depositTokenBalance: BigNumber.from(0),
    investmentTokenBalance: BigNumber.from(0),
    equityValuation: BigNumber.from(0),
    investmentTokenSupply: BigNumber.from(0),
  }
  private statesAfter: WithdrawStates = {
    depositTokenBalance: BigNumber.from(0),
    investmentTokenBalance: BigNumber.from(0),
    equityValuation: BigNumber.from(0),
    investmentTokenSupply: BigNumber.from(0),
  }
  private expect = new (class {
    constructor(private parent: WithdrawHelper) {}

    public success() {
      return this.parent.success()
    }

    public reverted() {
      return this.parent.reverted()
    }

    public revertedWith(reason: string) {
      return this.parent.revertedWith(reason)
    }

    public revertedWithCustomError(reason: string) {
      return this.parent.revertedWithCustomError(reason)
    }
  })(this)

  constructor(depositToken: Contract) {
    this.depositToken = depositToken
  }

  public withdraw(investable: Contract, withdrawer: SignerWithAddress, withdrawArgs: WithdrawArgs) {
    this.investable = investable
    this.withdrawer = withdrawer
    this.withdrawArgs = withdrawArgs

    return this.expect
  }

  private async success() {
    await this.storeStates(this.statesBefore)

    const investmentToken = await ethers.getContractAt(erc20Abi, await this.investable.getInvestmentToken())
    await investmentToken.connect(this.withdrawer).approve(this.investable.address, this.withdrawArgs.amount)

    await expect(
      this.investable
        .connect(this.withdrawer)
        .withdraw(this.withdrawArgs.amount, this.withdrawArgs.depositTokenReceiver, this.withdrawArgs.params)
    )
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.withdrawer.address, this.withdrawArgs.depositTokenReceiver, this.withdrawArgs.amount)

    await this.storeStates(this.statesAfter)

    await this.compareStates(WithdrawResult.SUCCESS)
  }

  private async reverted() {
    await this.storeStates(this.statesBefore)

    const investmentToken = await ethers.getContractAt(erc20Abi, await this.investable.getInvestmentToken())
    await investmentToken.connect(this.withdrawer).approve(this.investable.address, this.withdrawArgs.amount)

    await expect(
      this.investable
        .connect(this.withdrawer)
        .withdraw(this.withdrawArgs.amount, this.withdrawArgs.depositTokenReceiver, this.withdrawArgs.params)
    ).to.be.reverted

    await this.storeStates(this.statesAfter)

    await this.compareStates(WithdrawResult.REVERTED)
  }

  private async revertedWith(reason: string) {
    await this.storeStates(this.statesBefore)

    const investmentToken = await ethers.getContractAt(erc20Abi, await this.investable.getInvestmentToken())
    await investmentToken.connect(this.withdrawer).approve(this.investable.address, this.withdrawArgs.amount)

    await expect(
      this.investable
        .connect(this.withdrawer)
        .withdraw(this.withdrawArgs.amount, this.withdrawArgs.depositTokenReceiver, this.withdrawArgs.params)
    ).to.be.revertedWith(reason)

    await this.storeStates(this.statesAfter)

    await this.compareStates(WithdrawResult.REVERTED)
  }

  private async revertedWithCustomError(reason: string) {
    await this.storeStates(this.statesBefore)

    const investmentToken = await ethers.getContractAt(erc20Abi, await this.investable.getInvestmentToken())
    await investmentToken.connect(this.withdrawer).approve(this.investable.address, this.withdrawArgs.amount)

    await expect(
      this.investable
        .connect(this.withdrawer)
        .withdraw(this.withdrawArgs.amount, this.withdrawArgs.depositTokenReceiver, this.withdrawArgs.params)
    ).to.be.revertedWithCustomError(this.investable, reason)

    await this.storeStates(this.statesAfter)

    await this.compareStates(WithdrawResult.REVERTED)
  }

  private async storeStates(states: WithdrawStates) {
    const investmentToken = await ethers.getContractAt(erc20Abi, await this.investable.getInvestmentToken())

    states.depositTokenBalance = await this.depositToken.balanceOf(this.withdrawArgs.depositTokenReceiver)
    states.investmentTokenBalance = await investmentToken.balanceOf(this.withdrawer.address)
    states.equityValuation = await this.investable.getEquityValuation(true, false)
    states.investmentTokenSupply = await this.investable.getInvestmentTokenSupply()
  }

  private async compareStates(withdrawResult: WithdrawResult) {
    if (withdrawResult === WithdrawResult.SUCCESS) {
      const investmentTokenPrice: number = this.statesBefore.investmentTokenSupply.eq(BigNumber.from(0))
        ? 1
        : this.statesBefore.equityValuation.toNumber() / this.statesBefore.investmentTokenSupply.toNumber()
      const withdrewEquityValuation = Math.floor(this.withdrawArgs.amount.toNumber() * investmentTokenPrice)

      expect(this.statesAfter.depositTokenBalance.sub(this.statesBefore.depositTokenBalance)).to.be.approximately(
        withdrewEquityValuation,
        getErrorRange(BigNumber.from(withdrewEquityValuation))
      )
      expect(this.statesBefore.investmentTokenBalance.sub(this.statesAfter.investmentTokenBalance)).to.equal(
        this.withdrawArgs.amount
      )
      expect(this.statesBefore.equityValuation.sub(this.statesAfter.equityValuation)).to.be.approximately(
        withdrewEquityValuation,
        getErrorRange(BigNumber.from(withdrewEquityValuation))
      )
      expect(this.statesBefore.investmentTokenSupply.sub(this.statesAfter.investmentTokenSupply)).to.be.approximately(
        this.withdrawArgs.amount,
        getErrorRange(this.withdrawArgs.amount)
      )
    } else if (withdrawResult === WithdrawResult.REVERTED) {
      expect(this.statesBefore.depositTokenBalance.sub(this.statesAfter.depositTokenBalance)).to.equal(0)
      expect(this.statesBefore.investmentTokenBalance.sub(this.statesAfter.investmentTokenBalance)).to.equal(0)
      expect(this.statesBefore.equityValuation.sub(this.statesAfter.equityValuation)).to.equal(0)
      expect(this.statesBefore.investmentTokenSupply.sub(this.statesAfter.investmentTokenSupply)).to.equal(0)
    } else {
      expect.fail("Unexpected withdraw result")
    }
  }
}
