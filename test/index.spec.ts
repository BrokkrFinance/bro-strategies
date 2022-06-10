import { ethers, upgrades } from "hardhat"

describe("StrategyToken", function () {
  it("Testing basic functionality", async function () {
    const StrategyToken = await ethers.getContractFactory("StrategyToken")
    const strategyToken = await upgrades.deployProxy(StrategyToken, ["SuperStrategy", "SUP"])
    await strategyToken.deployed()

    const accounts = await ethers.getSigners()
    let Alice = accounts[0].address
    let Bob = accounts[1].address

    await strategyToken.mint(Alice, ethers.utils.parseEther("1.0"))
    console.log("balance: ", ethers.utils.formatUnits(await strategyToken.balanceOf(Alice), 18))
    await strategyToken.transfer(Bob, 500000000000)
    console.log("balance: ", ethers.utils.formatEther(await strategyToken.balanceOf(Bob)))
  })
})
