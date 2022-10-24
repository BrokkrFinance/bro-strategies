import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { BigNumber, Contract } from "ethers"
import { ethers } from "hardhat"
import erc20Abi from "../helper/abi/erc20.json"
import { DepositArgs, InvestArgs, WithdrawArgs } from "./parameters"
import { getErrorRange } from "./utils"

enum InvestType {
  DEPOSIT,
  WITHDRAW,
}

enum InvestResult {
  SUCCESS,
  REVERTED,
  REVERTED_WITH,
  REVERTED_WITH_CUSTOM_ERROR,
}

interface InvestmentStates {
  depositTokenBalance: BigNumber
  investmentTokenBalance: BigNumber
  equityValuation: BigNumber
  investmentTokenSupply: BigNumber
}

export class InvestHelper {
  public depositToken: Contract

  private investable!: Contract
  private investor!: SignerWithAddress
  private investArgs!: InvestArgs
  private investType!: InvestType
  private investResult!: InvestResult
  private depositResults: Map<InvestResult, Function>
  private withdrawResults: Map<InvestResult, Function>
  private statesBefore: InvestmentStates
  private statesAfter: InvestmentStates
  private expect = new (class {
    constructor(private parent: InvestHelper) {}

    public success() {
      this.parent.investResult = InvestResult.SUCCESS

      return this.parent.invest()
    }

    public reverted() {
      this.parent.investResult = InvestResult.REVERTED

      return this.parent.invest()
    }

    public revertedWith(reason: string) {
      this.parent.investResult = InvestResult.REVERTED_WITH

      return this.parent.invest(reason)
    }

    public revertedWithCustomError(reason: string) {
      this.parent.investResult = InvestResult.REVERTED_WITH_CUSTOM_ERROR

      return this.parent.invest(reason)
    }
  })(this)

  constructor(depositToken: Contract) {
    this.depositToken = depositToken

    this.depositResults = new Map<InvestResult, Function>()
    this.depositResults.set(InvestResult.SUCCESS, this.depositSuccess)
    this.depositResults.set(InvestResult.REVERTED, this.depositReverted)
    this.depositResults.set(InvestResult.REVERTED_WITH, this.depositRevertedWith)
    this.depositResults.set(InvestResult.REVERTED_WITH_CUSTOM_ERROR, this.depositRevertedWithCustomError)

    this.withdrawResults = new Map<InvestResult, Function>()
    this.withdrawResults.set(InvestResult.SUCCESS, this.withdrawSuccess)
    this.withdrawResults.set(InvestResult.REVERTED, this.withdrawReverted)
    this.withdrawResults.set(InvestResult.REVERTED_WITH, this.withdrawRevertedWith)
    this.withdrawResults.set(InvestResult.REVERTED_WITH_CUSTOM_ERROR, this.withdrawRevertedWithCustomError)

    this.statesBefore = {
      depositTokenBalance: BigNumber.from(0),
      investmentTokenBalance: BigNumber.from(0),
      equityValuation: BigNumber.from(0),
      investmentTokenSupply: BigNumber.from(0),
    }
    this.statesAfter = {
      depositTokenBalance: BigNumber.from(0),
      investmentTokenBalance: BigNumber.from(0),
      equityValuation: BigNumber.from(0),
      investmentTokenSupply: BigNumber.from(0),
    }
  }

  public deposit(investable: Contract, depositor: SignerWithAddress, depositArgs: DepositArgs) {
    this.investable = investable
    this.investor = depositor
    this.investArgs = {
      amount: depositArgs.amount,
      tokenReceiver: depositArgs.investmentTokenReceiver,
      params: depositArgs.params,
    }

    this.investType = InvestType.DEPOSIT

    return this.expect
  }

  public withdraw(investable: Contract, withdrawer: SignerWithAddress, withdrawArgs: WithdrawArgs) {
    this.investable = investable
    this.investor = withdrawer
    this.investArgs = {
      amount: withdrawArgs.amount,
      tokenReceiver: withdrawArgs.depositTokenReceiver,
      params: withdrawArgs.params,
    }

    this.investType = InvestType.WITHDRAW

    return this.expect
  }

  private async invest(reason: string = "") {
    await this.storeStates(this.statesBefore)

    if (this.investType === InvestType.DEPOSIT) {
      await this.depositToken.connect(this.investor).approve(this.investable.address, this.investArgs.amount)

      const depositResult = await this.depositResults.get(this.investResult)
      if (depositResult !== undefined) {
        await depositResult.bind(this)(reason)
      } else {
        expect.fail("Unexpected deposit result")
      }
    } else if (this.investType === InvestType.WITHDRAW) {
      const investmentToken = await ethers.getContractAt(erc20Abi, await this.investable.getInvestmentToken())
      await investmentToken.connect(this.investor).approve(this.investable.address, this.investArgs.amount)

      const withdrawResult = await this.withdrawResults.get(this.investResult)
      if (withdrawResult !== undefined) {
        await withdrawResult.bind(this)(reason)
      } else {
        expect.fail("Unexpected withdraw result")
      }
    } else {
      expect.fail("Unexpected invest type")
    }

    await this.storeStates(this.statesAfter)

    await this.compareStates()
  }

  private async depositSuccess(_: string) {
    await expect(
      this.investable
        .connect(this.investor)
        .deposit(this.investArgs.amount, this.investArgs.tokenReceiver, this.investArgs.params)
    )
      .to.emit(this.investable, "Deposit")
      .withArgs(this.investor.address, this.investArgs.tokenReceiver, this.investArgs.amount)
  }

  private async depositReverted(_: string) {
    await expect(
      this.investable
        .connect(this.investor)
        .deposit(this.investArgs.amount, this.investArgs.tokenReceiver, this.investArgs.params)
    ).to.be.reverted
  }

  private async depositRevertedWith(reason: string) {
    await expect(
      this.investable
        .connect(this.investor)
        .deposit(this.investArgs.amount, this.investArgs.tokenReceiver, this.investArgs.params)
    ).to.be.revertedWith(reason)
  }

  private async depositRevertedWithCustomError(reason: string) {
    await expect(
      this.investable
        .connect(this.investor)
        .deposit(this.investArgs.amount, this.investArgs.tokenReceiver, this.investArgs.params)
    ).to.be.revertedWithCustomError(this.investable, reason)
  }

  private async withdrawSuccess(_: string) {
    await expect(
      this.investable
        .connect(this.investor)
        .withdraw(this.investArgs.amount, this.investArgs.tokenReceiver, this.investArgs.params)
    )
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.investor.address, this.investArgs.tokenReceiver, this.investArgs.amount)
  }

  private async withdrawReverted(_: string) {
    await expect(
      this.investable
        .connect(this.investor)
        .withdraw(this.investArgs.amount, this.investArgs.tokenReceiver, this.investArgs.params)
    ).to.be.reverted
  }

  private async withdrawRevertedWith(reason: string) {
    await expect(
      this.investable
        .connect(this.investor)
        .withdraw(this.investArgs.amount, this.investArgs.tokenReceiver, this.investArgs.params)
    ).to.be.revertedWith(reason)
  }

  private async withdrawRevertedWithCustomError(reason: string) {
    await expect(
      this.investable
        .connect(this.investor)
        .withdraw(this.investArgs.amount, this.investArgs.tokenReceiver, this.investArgs.params)
    ).to.be.revertedWithCustomError(this.investable, reason)
  }

  private async storeStates(states: InvestmentStates) {
    const investmentToken = await ethers.getContractAt(erc20Abi, await this.investable.getInvestmentToken())

    if (this.investType === InvestType.DEPOSIT) {
      states.depositTokenBalance = await this.depositToken.balanceOf(this.investor.address)
      states.investmentTokenBalance = await investmentToken.balanceOf(this.investArgs.tokenReceiver)
    } else if (this.investType === InvestType.WITHDRAW) {
      states.depositTokenBalance = await this.depositToken.balanceOf(this.investArgs.tokenReceiver)
      states.investmentTokenBalance = await investmentToken.balanceOf(this.investor.address)
    } else {
      expect.fail("Unexpected invest type")
    }
    states.equityValuation = await this.investable.getEquityValuation(true, false)
    states.investmentTokenSupply = await this.investable.getInvestmentTokenSupply()
  }

  private async compareStates() {
    if (this.investType === InvestType.DEPOSIT) {
      await this.compareDepositStates()
    } else if (this.investType === InvestType.WITHDRAW) {
      await this.compareWithdrawStates()
    } else {
      expect.fail("Unexpected invest type")
    }
  }

  private async compareDepositStates() {
    if (this.investResult === InvestResult.SUCCESS) {
      const investmentTokenPrice: number = this.statesBefore.investmentTokenSupply.eq(BigNumber.from(0))
        ? 1
        : this.statesBefore.equityValuation.toNumber() / this.statesBefore.investmentTokenSupply.toNumber()
      const investmentTokenMinted = Math.floor(this.investArgs.amount.toNumber() / investmentTokenPrice)

      expect(this.statesBefore.depositTokenBalance.sub(this.statesAfter.depositTokenBalance)).to.equal(
        this.investArgs.amount
      )
      expect(this.statesAfter.investmentTokenBalance.sub(this.statesBefore.investmentTokenBalance)).to.be.approximately(
        investmentTokenMinted,
        getErrorRange(BigNumber.from(investmentTokenMinted))
      )
      expect(this.statesAfter.equityValuation.sub(this.statesBefore.equityValuation)).to.be.approximately(
        this.investArgs.amount,
        getErrorRange(this.investArgs.amount)
      )
      expect(this.statesAfter.investmentTokenSupply.sub(this.statesBefore.investmentTokenSupply)).to.be.approximately(
        investmentTokenMinted,
        getErrorRange(BigNumber.from(investmentTokenMinted))
      )
    } else if (
      this.investResult === InvestResult.REVERTED ||
      this.investResult === InvestResult.REVERTED_WITH ||
      this.investResult === InvestResult.REVERTED_WITH_CUSTOM_ERROR
    ) {
      expect(this.statesAfter.depositTokenBalance.sub(this.statesBefore.depositTokenBalance)).to.equal(0)
      expect(this.statesAfter.investmentTokenBalance.sub(this.statesBefore.investmentTokenBalance)).to.equal(0)
      expect(this.statesAfter.equityValuation.sub(this.statesBefore.equityValuation)).to.equal(0)
      expect(this.statesAfter.investmentTokenSupply.sub(this.statesBefore.investmentTokenSupply)).to.equal(0)
    } else {
      expect.fail("Unexpected deposit result")
    }
  }

  private async compareWithdrawStates() {
    if (this.investResult === InvestResult.SUCCESS) {
      const investmentTokenPrice: number = this.statesBefore.investmentTokenSupply.eq(BigNumber.from(0))
        ? 1
        : this.statesBefore.equityValuation.toNumber() / this.statesBefore.investmentTokenSupply.toNumber()
      const withdrewEquityValuation = Math.floor(this.investArgs.amount.toNumber() * investmentTokenPrice)

      expect(this.statesAfter.depositTokenBalance.sub(this.statesBefore.depositTokenBalance)).to.be.approximately(
        withdrewEquityValuation,
        getErrorRange(BigNumber.from(withdrewEquityValuation))
      )
      expect(this.statesBefore.investmentTokenBalance.sub(this.statesAfter.investmentTokenBalance)).to.equal(
        this.investArgs.amount
      )
      expect(this.statesBefore.equityValuation.sub(this.statesAfter.equityValuation)).to.be.approximately(
        withdrewEquityValuation,
        getErrorRange(BigNumber.from(withdrewEquityValuation))
      )
      expect(this.statesBefore.investmentTokenSupply.sub(this.statesAfter.investmentTokenSupply)).to.be.approximately(
        this.investArgs.amount,
        getErrorRange(this.investArgs.amount)
      )
    } else if (
      this.investResult === InvestResult.REVERTED ||
      this.investResult === InvestResult.REVERTED_WITH ||
      this.investResult === InvestResult.REVERTED_WITH_CUSTOM_ERROR
    ) {
      expect(this.statesBefore.depositTokenBalance.sub(this.statesAfter.depositTokenBalance)).to.equal(0)
      expect(this.statesBefore.investmentTokenBalance.sub(this.statesAfter.investmentTokenBalance)).to.equal(0)
      expect(this.statesBefore.equityValuation.sub(this.statesAfter.equityValuation)).to.equal(0)
      expect(this.statesBefore.investmentTokenSupply.sub(this.statesAfter.investmentTokenSupply)).to.equal(0)
    } else {
      expect.fail("Unexpected withdraw result")
    }
  }
}
