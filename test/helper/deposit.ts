import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { BigNumber, Contract } from "ethers"
import { ethers } from "hardhat"
import erc20Abi from "../helper/abi/erc20.json"
import { DepositArgs } from "./parameters"
import { getErrorRange } from "./utils"

enum DepositResult {
  SUCCESS,
  REVERTED,
}

interface DepositStates {
  depositTokenBalance: BigNumber
  investmentTokenBalance: BigNumber
  equityValuation: BigNumber
  investmentTokenSupply: BigNumber
}

export class DepositHelper {
  public depositToken: Contract

  private investable!: Contract
  private depositor!: SignerWithAddress
  private depositArgs!: DepositArgs
  private statesBefore: DepositStates = {
    depositTokenBalance: BigNumber.from(0),
    investmentTokenBalance: BigNumber.from(0),
    equityValuation: BigNumber.from(0),
    investmentTokenSupply: BigNumber.from(0),
  }
  private statesAfter: DepositStates = {
    depositTokenBalance: BigNumber.from(0),
    investmentTokenBalance: BigNumber.from(0),
    equityValuation: BigNumber.from(0),
    investmentTokenSupply: BigNumber.from(0),
  }
  private expect = new (class {
    constructor(private parent: DepositHelper) {}

    public success() {
      return this.parent.success()
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

  public deposit(investable: Contract, depositor: SignerWithAddress, depositArgs: DepositArgs) {
    this.investable = investable
    this.depositor = depositor
    this.depositArgs = depositArgs

    return this.expect
  }

  private async success() {
    await this.storeStates(this.statesBefore)

    await this.depositToken.connect(this.depositor).approve(this.investable.address, this.depositArgs.amount)

    await expect(
      this.investable
        .connect(this.depositor)
        .deposit(this.depositArgs.amount, this.depositArgs.investmentTokenReceiver, this.depositArgs.params)
    )
      .to.emit(this.investable, "Deposit")
      .withArgs(this.depositor.address, this.depositArgs.investmentTokenReceiver, this.depositArgs.amount)

    await this.storeStates(this.statesAfter)

    await this.compareStates(DepositResult.SUCCESS)
  }

  private async revertedWith(reason: string) {
    await this.storeStates(this.statesBefore)

    await this.depositToken.connect(this.depositor).approve(this.investable.address, this.depositArgs.amount)

    await expect(
      this.investable
        .connect(this.depositor)
        .deposit(this.depositArgs.amount, this.depositArgs.investmentTokenReceiver, this.depositArgs.params)
    ).to.be.revertedWith(reason)

    await this.storeStates(this.statesAfter)

    await this.compareStates(DepositResult.REVERTED)
  }

  private async revertedWithCustomError(reason: string) {
    await this.storeStates(this.statesBefore)

    await this.depositToken.connect(this.depositor).approve(this.investable.address, this.depositArgs.amount)

    await expect(
      this.investable
        .connect(this.depositor)
        .deposit(this.depositArgs.amount, this.depositArgs.investmentTokenReceiver, this.depositArgs.params)
    ).to.be.revertedWithCustomError(this.investable, reason)

    await this.storeStates(this.statesAfter)

    await this.compareStates(DepositResult.REVERTED)
  }

  private async storeStates(states: DepositStates) {
    const investmentToken = await ethers.getContractAt(erc20Abi, await this.investable.getInvestmentToken())

    states.depositTokenBalance = await this.depositToken.balanceOf(this.depositor.address)
    states.investmentTokenBalance = await investmentToken.balanceOf(this.depositArgs.investmentTokenReceiver)
    states.equityValuation = await this.investable.getEquityValuation(true, false)
    states.investmentTokenSupply = await this.investable.getInvestmentTokenSupply()
  }

  private async compareStates(depositResult: DepositResult) {
    if (depositResult === DepositResult.SUCCESS) {
      const investmentTokenPrice: number = this.statesBefore.investmentTokenSupply.eq(BigNumber.from(0))
        ? 1
        : this.statesBefore.equityValuation.toNumber() / this.statesBefore.investmentTokenSupply.toNumber()
      const investmentTokenMinted = Math.floor(this.depositArgs.amount.toNumber() / investmentTokenPrice)

      expect(this.statesBefore.depositTokenBalance.sub(this.statesAfter.depositTokenBalance)).to.equal(
        this.depositArgs.amount
      )
      expect(this.statesAfter.investmentTokenBalance.sub(this.statesBefore.investmentTokenBalance)).to.be.approximately(
        investmentTokenMinted,
        getErrorRange(BigNumber.from(investmentTokenMinted))
      )
      expect(this.statesAfter.equityValuation.sub(this.statesBefore.equityValuation)).to.be.approximately(
        this.depositArgs.amount,
        getErrorRange(this.depositArgs.amount)
      )
      expect(this.statesAfter.investmentTokenSupply.sub(this.statesBefore.investmentTokenSupply)).to.be.approximately(
        investmentTokenMinted,
        getErrorRange(BigNumber.from(investmentTokenMinted))
      )
    } else if (depositResult === DepositResult.REVERTED) {
      expect(this.statesAfter.depositTokenBalance.sub(this.statesBefore.depositTokenBalance)).to.equal(0)
      expect(this.statesAfter.investmentTokenBalance.sub(this.statesBefore.investmentTokenBalance)).to.equal(0)
      expect(this.statesAfter.equityValuation.sub(this.statesBefore.equityValuation)).to.equal(0)
      expect(this.statesAfter.investmentTokenSupply.sub(this.statesBefore.investmentTokenSupply)).to.equal(0)
    } else {
      expect.fail("Unexpected deposit result")
    }
  }
}
