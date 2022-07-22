import { ethers } from "hardhat"
import { deployProxyContract, deployStrategy, expectSuccess, getTokenContract, getUsdcContract } from "./helper"

deployProxyContract
deployStrategy
expectSuccess
getUsdcContract
getTokenContract

describe("DNS Vector", function () {
  this.timeout(60 * 60 * 1000)

  it("Smoke test", async function () {
    // setup accounts

    const accounts = await ethers.getSigners()
    const Alice = accounts[0].address

    let impersonatedSigner = await expectSuccess(
      ethers.getImpersonatedSigner("0x4aeFa39caEAdD662aE31ab0CE7c8C2c9c0a013E8")
    )
    const usdcContract = await expectSuccess(getUsdcContract())

    await expectSuccess(
      impersonatedSigner.sendTransaction({
        to: Alice,
        value: ethers.utils.parseEther("100"),
      })
    )
    await expectSuccess(usdcContract.connect(impersonatedSigner).transfer(Alice, ethers.utils.parseUnits("100.0", 6)))

    // depoloy contracts

    const priceOracle = await expectSuccess(
      deployProxyContract("GmxOracle", [
        "0x81b7e71a1d9e08a6ca016a0f4d6fa50dbce89ee3",
        "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      ])
    )

    const strategy = await expectSuccess(
      deployStrategy("DnsVectorStrategy", "Super Strategy Token 2", "SUP2", usdcContract, 0, 0, 0, [
        "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // usdc
        "0x625E7708f30cA75bfd92586e17077590C60eb4cD", // Aave usdc supply token
        "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // wrapped avax
        "0x4a1c3aD6Ed28a636ee1751C69071f6be75DEb8B8", // Aave variable avax debt token
        priceOracle.address, // price oracle
        "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave pool
        "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654", // Aave data provider
      ])
    )

    await expectSuccess(usdcContract.approve(strategy.address, ethers.utils.parseUnits("1.0", 6)))
    await expectSuccess(strategy.deposit(ethers.utils.parseUnits("1.0", 6), []))

    const vAaveWAvaxToken = await getTokenContract("0x4a1c3aD6Ed28a636ee1751C69071f6be75DEb8B8")
    console.log("vAaveWAvaxToken token balance", await vAaveWAvaxToken.balanceOf(strategy.address))
  })
})
