import $RefParser from "@apidevtools/json-schema-ref-parser"
import path from "path"
import Tokens from "../constants/addresses/Tokens.json"
import { getDeployConfigPath, readLiveConfig } from "./helper/paths"
import { Library } from "./interfaces/library"
import { NameValuePair } from "./interfaces/name-value-pair"
import { RoleToUsers } from "./interfaces/role-to-users"

export async function deploy(network: string, name: string) {
  const { run } = require("hardhat")

  const deployConfigSchema = await $RefParser.dereference(getDeployConfigPath(name))

  if (deployConfigSchema.properties === undefined) {
    console.log("Deploy: Wrong config file. The config file must have 'properties' key.")
    throw new Error("Wrong config file")
  }

  const deployConfigs = JSON.parse(JSON.stringify(deployConfigSchema.properties))

  for (let deployConfig of deployConfigs) {
    let deployArgs: { [key: string]: string } = Object.assign({ targetNetwork: network }, parseSharedArgs(deployConfig))

    if (deployConfig.type === "portfolio") {
      deployArgs = Object.assign(deployArgs, parsePortfolioArgs(deployConfig))
    } else if (deployConfig.type === "strategy") {
      deployArgs = Object.assign(deployArgs, parseStrategyArgs(deployConfig))
    } else {
      console.log("Deploy: The config file must define 'type' key and value of 'portfolio' or 'strategy'.")
      throw new Error("Wrong config file")
    }

    while (true) {
      try {
        await run("deploy", deployArgs)
        break
      } catch (e: unknown) {
        console.log(`\n${e}\n`)
        console.log("Deploy: This is highly likely due to block confirmation. Wait for 3 seconds and then retry.\n")
        await new Promise((timeout) => setTimeout(timeout, 3000)) // 3 seconds is a long enough time for block confirmation on Avalanche.
      }
    }
  }

  const last = deployConfigs.at(-1)

  if (last.type !== "portfolio") {
    console.log("Deploy: It looks like what we just deployed is not a portfolio. Skip investing $1.\n")
    return
  }

  console.log("Deploy: Deposit $2 to and withdraw $1 from the top level portfolio.")

  await investOneDollar(last)

  console.log()
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length != 2) {
    console.log("Deploy: Wrong arguments. The arguments must be network and contract type/name.")
    console.log("Deploy: ts-node ./scripts/deploy.ts avax_mainnet portfolio/Calm")
    throw new Error("Wrong arguments")
  }

  const network = args[0]
  const name = args[1]

  await deploy(network, name)
}

function parseSharedArgs(deployConfig: any): { [key: string]: string } {
  return {
    type: deployConfig.type,
    subtype: deployConfig.subtype,
    name: deployConfig.name,
    owner: deployConfig.owner,
    contractName: deployConfig.contractName,
    investmentTokenName: deployConfig.investmentTokenName,
    investmentTokenSymbol: deployConfig.investmentTokenSymbol,
    depositToken: deployConfig.depositToken,
    depositFee: JSON.stringify(deployConfig.depositFee),
    depositFeeParamKeys: JSON.stringify(
      deployConfig.depositFeeParams.map((depositFeeParam: NameValuePair) => depositFeeParam.key)
    ).replace(/["]/g, ""),
    depositFeeParamValues: JSON.stringify(
      deployConfig.depositFeeParams.map((depositFeeParam: NameValuePair) => depositFeeParam.value)
    ).replace(/["]/g, ""),
    withdrawalFee: JSON.stringify(deployConfig.withdrawalFee),
    withdrawalFeeParamKeys: JSON.stringify(
      deployConfig.withdrawalFeeParams.map((withdrawalFeeParam: NameValuePair) => withdrawalFeeParam.key)
    ).replace(/["]/g, ""),
    withdrawalFeeParamValues: JSON.stringify(
      deployConfig.withdrawalFeeParams.map((withdrawalFeeParam: NameValuePair) => withdrawalFeeParam.value)
    ).replace(/["]/g, ""),
    performanceFee: JSON.stringify(deployConfig.performanceFee),
    performanceFeeParamKeys: JSON.stringify(
      deployConfig.performanceFeeParams.map((performanceFeeParam: NameValuePair) => performanceFeeParam.key)
    ).replace(/["]/g, ""),
    performanceFeeParamValues: JSON.stringify(
      deployConfig.performanceFeeParams.map((performanceFeeParam: NameValuePair) => performanceFeeParam.value)
    ).replace(/["]/g, ""),
    feeReceiver: deployConfig.feeReceiver,
    feeReceiverParamKeys: JSON.stringify(
      deployConfig.feeReceiverParams.map((feeReceiverParam: NameValuePair) => feeReceiverParam.key)
    ).replace(/["]/g, ""),
    feeReceiverParamValues: JSON.stringify(
      deployConfig.feeReceiverParams.map((feeReceiverParam: NameValuePair) => feeReceiverParam.value)
    ).replace(/["]/g, ""),
    totalInvestmentLimit: JSON.stringify(deployConfig.totalInvestmentLimit),
    investmentLimitPerAddress: JSON.stringify(deployConfig.investmentLimitPerAddress),
    extraArgs: JSON.stringify(deployConfig.extraArgs).replace(/["]/g, ""),
  }
}

function parsePortfolioArgs(deployConfig: any): { [key: string]: string } {
  return {
    investables: JSON.stringify(deployConfig.investables).replace(/["]/g, ""),
    allocations: JSON.stringify(deployConfig.allocations),
  }
}

function parseStrategyArgs(deployConfig: any): { [key: string]: string } {
  return {
    oracleName: deployConfig.oracle.name,
    oracleAddress: deployConfig.oracle.address,
    swapServiceProvider: JSON.stringify(deployConfig.swapService.provider),
    swapServiceRouter: deployConfig.swapService.router,
    roles: JSON.stringify(deployConfig.roleToUsers.map((roleToUser: RoleToUsers) => roleToUser.role)).replace(
      /["]/g,
      ""
    ),
    users: JSON.stringify(deployConfig.roleToUsers.map((roleToUser: RoleToUsers) => roleToUser.users)).replace(
      /["]/g,
      ""
    ),
    libraryNames: JSON.stringify(deployConfig.libraries.map((library: Library) => library.name)).replace(/["]/g, ""),
    libraryDependencies: JSON.stringify(deployConfig.libraries.map((library: Library) => library.dependencies)).replace(
      /["]/g,
      ""
    ),
  }
}

async function investOneDollar(deployConfig: any): Promise<void> {
  // Get an instance of HRE.
  const { ethers } = require("hardhat")

  // Get portfolio and its token.
  const portfolioLiveConfig = readLiveConfig(path.join("portfolio", deployConfig.name))
  const portfolio = await ethers.getContractAt(portfolioLiveConfig.name, portfolioLiveConfig.address)
  const portfolioToken = await ethers.getContractAt("InvestmentToken", await portfolio.getInvestmentToken())

  // Get deployer account and USDC.
  const deployer = (await ethers.getSigners())[0]
  const usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", Tokens.usdc)

  // Deposit $2.
  const portfolioTokenBalanceBefore = await portfolioToken.balanceOf(deployer.address)

  await usdc.connect(deployer).approve(portfolio.address, ethers.utils.parseUnits("2", 6))
  await portfolio.connect(deployer).deposit(ethers.utils.parseUnits("2", 6), 0, deployer.address, [])

  const portfolioTokenBalanceAfter = await portfolioToken.balanceOf(deployer.address)

  console.log(`Deploy: Successfully deposited $2 to ${portfolioLiveConfig.address}.`)

  // Withdraw $1.
  const portfolioTokenBalance = ethers.BigNumber.from(portfolioTokenBalanceAfter - portfolioTokenBalanceBefore)

  await portfolioToken.connect(deployer).approve(portfolio.address, portfolioTokenBalance.div(2))
  await portfolio.connect(deployer).withdraw(portfolioTokenBalance.div(2), 0, deployer.address, [])

  console.log(`Deploy: Successfully withdrew $1 from ${portfolioLiveConfig.address}.`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
