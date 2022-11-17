import $RefParser from "@apidevtools/json-schema-ref-parser"
import { execSync } from "child_process"
import { ethers } from "hardhat"
import path from "path"
import Tokens from "../constants/addresses/Tokens.json"
import { getDeployConfigPath, readLiveConfig } from "./helper/paths"
import { NameValuePair } from "./interfaces/name-value-pair"
import { RoleToUsers } from "./interfaces/role-to-users"

async function main() {
  const args = process.argv.slice(2)

  if (args.length != 2) {
    console.log("Deploy: Wrong arguments. The arguments must be network and contract type/name.")
    console.log("Deploy: ts-node ./scripts/deploy.ts avax_mainnet portfolio/Calm")
    throw new Error("Wrong arguments")
  }

  const network = args[0]
  const name = args[1]

  const deployConfigSchema = await $RefParser.dereference(getDeployConfigPath(name))

  if (deployConfigSchema.properties === undefined) {
    console.log("Deploy: Wrong config file. The config file must have 'properties' key.")
    throw new Error("Wrong config file")
  }

  const deployConfigs = JSON.parse(JSON.stringify(deployConfigSchema.properties))

  for (let deployConfig of deployConfigs) {
    let deployArgs = parseSharedArgs(deployConfig)

    if (deployConfig.type === "portfolio") {
      deployArgs += parsePortfolioArgs(deployConfig)
    } else if (deployConfig.type === "strategy") {
      deployArgs += parseStrategyArgs(deployConfig)
    } else {
      console.log("Deploy: The config file must define 'type' key and value of 'portfolio' or 'strategy'.")
      throw new Error("Wrong config file")
    }

    while (true) {
      try {
        execSync(`npx hardhat --network ${network} deploy ${deployArgs}`, {
          stdio: "inherit",
        })
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
    console.log("Deploy: It looks like what we just deployed is not a portfolio. Skip investing $1.")
    return
  }

  console.log("Deploy: Deposit $2 to and withdraw $1 from the top level portfolio.")

  await investOneDollar(last)
}

function parseSharedArgs(deployConfig: any): string {
  return ` \
  --type ${deployConfig.type} \
  --name ${deployConfig.name} \
  --owner ${deployConfig.owner} \
  --contract-name ${deployConfig.contractName} \
  --investment-token-name "${deployConfig.investmentTokenName}" \
  --investment-token-symbol ${deployConfig.investmentTokenSymbol} \
  --deposit-token ${deployConfig.depositToken} \
  --deposit-fee ${deployConfig.depositFee} \
  --deposit-fee-param-keys ${JSON.stringify(
    deployConfig.depositFeeParams.map((depositFeeParam: NameValuePair) => depositFeeParam.key)
  )} \
  --deposit-fee-param-values ${JSON.stringify(
    deployConfig.depositFeeParams.map((depositFeeParam: NameValuePair) => depositFeeParam.value)
  )} \
  --withdrawal-fee ${deployConfig.withdrawalFee} \
  --withdrawal-fee-param-keys ${JSON.stringify(
    deployConfig.withdrawalFeeParams.map((withdrawalFeeParam: NameValuePair) => withdrawalFeeParam.key)
  )} \
  --withdrawal-fee-param-values ${JSON.stringify(
    deployConfig.withdrawalFeeParams.map((withdrawalFeeParam: NameValuePair) => withdrawalFeeParam.value)
  )} \
  --performance-fee ${deployConfig.performanceFee} \
  --performance-fee-param-keys ${JSON.stringify(
    deployConfig.performanceFeeParams.map((performanceFeeParam: NameValuePair) => performanceFeeParam.key)
  )} \
  --performance-fee-param-values ${JSON.stringify(
    deployConfig.performanceFeeParams.map((performanceFeeParam: NameValuePair) => performanceFeeParam.value)
  )} \
  --fee-receiver ${deployConfig.feeReceiver} \
  --fee-receiver-param-keys ${JSON.stringify(
    deployConfig.feeReceiverParams.map((feeReceiverParam: NameValuePair) => feeReceiverParam.key)
  )} \
  --fee-receiver-param-values ${JSON.stringify(
    deployConfig.feeReceiverParams.map((feeReceiverParam: NameValuePair) => feeReceiverParam.value)
  )} \
  --total-investment-limit ${deployConfig.totalInvestmentLimit} \
  --investment-limit-per-address ${deployConfig.investmentLimitPerAddress} \
  --extra-args ${JSON.stringify(deployConfig.extraArgs)}`
}

function parsePortfolioArgs(deployConfig: any): string {
  return ` \
  --investables ${JSON.stringify(deployConfig.investables)} \
  --allocations ${JSON.stringify(deployConfig.allocations)}`
}

function parseStrategyArgs(deployConfig: any): string {
  return ` \
  --oracle-name ${deployConfig.oracle.name} \
  --oracle-address ${deployConfig.oracle.address} \
  --swap-service-provider ${deployConfig.swapService.provider} \
  --swap-service-router ${deployConfig.swapService.router} \
  --roles ${JSON.stringify(deployConfig.roleToUsers.map((roleToUser: RoleToUsers) => roleToUser.role))} \
  --users ${JSON.stringify(deployConfig.roleToUsers.map((roleToUser: RoleToUsers) => roleToUser.users))}`
}

async function investOneDollar(deployConfig: any): Promise<void> {
  const portfolioLiveConfig = readLiveConfig(path.join("portfolio", deployConfig.name))
  const portfolio = await ethers.getContractAt(portfolioLiveConfig.name, portfolioLiveConfig.address)
  const portfolioToken = await ethers.getContractAt("InvestmentToken", await portfolio.getInvestmentToken())

  const deployer = (await ethers.getSigners())[0]
  const usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", Tokens.usdc)

  const portfolioTokenBalanceBefore = await portfolioToken.balanceOf(deployer.address)

  await usdc.approve(portfolio.address, ethers.utils.parseUnits("2", 6))
  await portfolio.deposit(ethers.utils.parseUnits("2", 6), 0, deployer.address, [])

  const portfolioTokenBalanceAfter = await portfolioToken.balanceOf(deployer.address)

  const portfolioTokenBalance = portfolioTokenBalanceAfter - portfolioTokenBalanceBefore

  await portfolioToken.approve(portfolio.address, portfolioTokenBalance / 2)
  await portfolio.withdraw(portfolioTokenBalance / 2, 0, deployer.address, [])
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
