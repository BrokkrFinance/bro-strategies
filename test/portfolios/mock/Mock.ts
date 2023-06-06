import { setBalance } from "@nomicfoundation/hardhat-network-helpers"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { Avalanche } from "../../../constants/networks/Avalanche"
import { deployPortfolio } from "../../../scripts/contracts/forking/deploy"
import { PortfolioTestOptions } from "../../helper/interfaces/options"
import { testPortfolio } from "../Portfolio.test"

const mockTestOptions: PortfolioTestOptions = {
  network: Avalanche(),
  forkAt: 29197000,
  upgradeTo: "",
}

testPortfolio("MockPortfolio - Deploy", deployMockPortfolio, mockTestOptions, [test])

async function deployMockPortfolio() {
  interface WhaleTransferDetails {
    whaleAddress: string
    tokenAddress: string
    tokenAmount: BigNumber
  }

  const whaleTransferDetails: WhaleTransferDetails[] = [
    {
      whaleAddress: "0x078f358208685046a11c85e8ad32895ded33a249",
      tokenAmount: ethers.utils.parseUnits("10", 8),
      tokenAddress: "0x50b7545627a5162f82a992c33b87adc75187b218",
    }, // wbtc
    {
      whaleAddress: "0xc73eed4494382093c6a7c284426a9a00f6c79939",
      tokenAmount: ethers.utils.parseUnits("100", 18),
      tokenAddress: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    }, // wAvax
  ]

  const signers = await ethers.getSigners()
  const userCount = 3
  for (let i = 0; i <= userCount; i++) {
    await setBalance(signers[i].address, ethers.utils.parseEther("10000"))
  }

  for (let i = 0; i < whaleTransferDetails.length; i++) {
    const impersonatedSigner = await ethers.getImpersonatedSigner(whaleTransferDetails[i].whaleAddress)
    await setBalance(impersonatedSigner.address, ethers.utils.parseEther("10000"))
    const token = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      whaleTransferDetails[i].tokenAddress
    )

    for (let j = 0; j <= userCount; j++) {
      await token.connect(impersonatedSigner).transfer(signers[j].address, whaleTransferDetails[i].tokenAmount)
    }
  }

  return await deployPortfolio("avalanche", "Mock")
}

function test() {
  describe("test", async function () {
    it("wbtc/usdc -> wavax", async function () {
      const SwapServiceLib = await ethers.getContractFactory("SwapServiceLib")
      const swapServiceLib = await SwapServiceLib.deploy()
      const wbtcToken = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        "0x50b7545627a5162f82a992c33b87adc75187b218"
      )

      await this.portfolio.connect(this.governorMember).setSwapLibAddress(swapServiceLib.address)
      await this.portfolio.connect(this.governorMember).setSwapDetail(
        "0x50b7545627a5162F82A992c33b87aDc75187B218", // wbtcE
        2,
        "0x60ae616a2155ee3d9a68541ba4544862310933d4", // router
        ["0x50b7545627a5162F82A992c33b87aDc75187B218", "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"],
        []
      )

      await wbtcToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("1", 8))
      await this.portfolio
        .connect(this.user0)
        .depositAnyToken(
          "0x50b7545627a5162F82A992c33b87aDc75187B218",
          ethers.utils.parseUnits("1", 8),
          0,
          this.user0.address,
          []
        )

      const investmentToken = await ethers.getContractAt("IInvestmentToken", await this.portfolio.getInvestmentToken())
      const tokenAmountUser0 = await this.portfolio.getInvestmentTokenBalanceOf(this.user0.address)
      const balanceBeforeWithdraw = await wbtcToken.balanceOf(this.user0.address)
      console.log("Token amount user0: ", tokenAmountUser0)
      console.log("Balance before:", balanceBeforeWithdraw.toString())
      await investmentToken.connect(this.user0).approve(this.portfolio.address, tokenAmountUser0)
      await this.portfolio
        .connect(this.user0)
        .withdrawAnyToken("0x50b7545627a5162F82A992c33b87aDc75187B218", tokenAmountUser0, 0, this.user0.address, [])
      const balanceAfterWithdraw = await wbtcToken.balanceOf(this.user0.address)
      console.log("Balance after: ", balanceAfterWithdraw)
    })

    // it("wbtc -> usdc", async function () {
    //   const SwapServiceLib = await ethers.getContractFactory("SwapServiceLib")
    //   const swapServiceLib = await SwapServiceLib.deploy()
    //   const token = await ethers.getContractAt(
    //     "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    //     "0x50b7545627a5162f82a992c33b87adc75187b218"
    //   )

    //   await this.portfolio.connect(this.governorMember).setSwapLibAddress(swapServiceLib.address)
    //   await this.portfolio.connect(this.governorMember).setSwapDetail(
    //     "0x50b7545627a5162F82A992c33b87aDc75187B218", // wbtcE
    //     2,
    //     "0x60ae616a2155ee3d9a68541ba4544862310933d4", // router
    //     ["0x50b7545627a5162F82A992c33b87aDc75187B218", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"],
    //     []
    //   )

    //   await token.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("1", 8))
    //   await this.portfolio
    //     .connect(this.user0)
    //     .depositAnyToken(
    //       "0x50b7545627a5162F82A992c33b87aDc75187B218",
    //       ethers.utils.parseUnits("1", 8),
    //       0,
    //       this.user0.address,
    //       []
    //     )

    //   const investmentToken = await ethers.getContractAt("IInvestmentToken", await this.portfolio.getInvestmentToken())
    //   const tokenAmountUser0 = await this.portfolio.getInvestmentTokenBalanceOf(this.user0.address)
    //   const balanceBeforeWithdraw = await token.balanceOf(this.user0.address)
    //   console.log("Token amount user0: ", tokenAmountUser0)
    //   console.log("Balance before:", balanceBeforeWithdraw.toString())
    //   await investmentToken.connect(this.user0).approve(this.portfolio.address, tokenAmountUser0)
    //   await this.portfolio
    //     .connect(this.user0)
    //     .withdrawAnyToken("0x50b7545627a5162F82A992c33b87aDc75187B218", tokenAmountUser0, 0, this.user0.address, [])
    //   const balanceAfterWithdraw = await token.balanceOf(this.user0.address)
    //   console.log("Balance after: ", balanceAfterWithdraw)
    // })
  })
}
