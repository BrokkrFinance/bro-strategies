import { BigNumber, Contract } from "ethers"
import {
  deployUUPSUpgradeablePortfolio,
  deployUUPSUpgradeableStrategyOwnable,
  deployUUPSUpgradeableStrategyRoleable,
} from "../core/deploy"
import { verifyContract } from "../core/verify"
import { DepositTokens } from "../../constants/deposit-tokens"
import { readDeployConfig, readLiveConfig, writeLiveConfig } from "../../helper/files"
import { getLiveConfigPath } from "../../helper/paths"
import { DeployConfig, LiveConfig } from "../../interfaces/configs"
import { Investable } from "../../interfaces/investable"
import {
  InvestmentTokenArgs,
  LibraryArgs,
  PortfolioArgs,
  PortfolioExtraArgs,
  StrategyArgs,
  StrategyExtraArgs,
} from "../../interfaces/parameters"
import { deployLibraries } from "./library"
import { DeployOptions } from "../../interfaces/options"

export async function deploy(investable: Investable, options?: DeployOptions): Promise<Contract> {
  // Switch to target network.
  if (options?.forkEnabled !== true) {
    const hre = require("hardhat")

    await hre.changeNetwork(investable.network)
  }

  // Deploy an investable contract.
  const deployConfigs: DeployConfig[] = await readDeployConfig(investable)
  let contract: Contract

  for (let deployConfig of deployConfigs) {
    while (true) {
      try {
        console.log(`Deploy: Deploy ${deployConfig.name} ${deployConfig.type}.`)

        if (deployConfig.type === "portfolio") {
          // Deploy a portfolio contract.
          contract = await deployUUPSUpgradeablePortfolio(
            deployConfig.contractName,
            deployConfig.owner,
            getInvestmentTokenArgs(deployConfig),
            getPortfolioArgs(deployConfig),
            getPortfolioExtraArgs(deployConfig),
            getPortfolioInvestables(investable.network, deployConfig),
            getPortfolioAllocations(deployConfig)
          )
        } else if (deployConfig.type === "strategy") {
          // Deploy libraries.
          const librarArgs = getLibraries(deployConfig)
          const libraries = await deployLibraries(investable.network, librarArgs)

          // Deploy a strategy contract.
          if (deployConfig.subtype === "ownable") {
            contract = await deployUUPSUpgradeableStrategyOwnable(
              deployConfig.contractName,
              deployConfig.owner,
              getInvestmentTokenArgs(deployConfig),
              getStrategyArgs(deployConfig),
              getStrategyExtraArgs(deployConfig),
              libraries
            )
          } else if (deployConfig.subtype === "roleable") {
            contract = await deployUUPSUpgradeableStrategyRoleable(
              deployConfig.contractName,
              getInvestmentTokenArgs(deployConfig),
              getStrategyArgs(deployConfig),
              getStrategyExtraArgs(deployConfig),
              libraries
            )
          } else {
            console.log("Deploy: The config file must define 'type' key and value of 'portfolio' or 'strategy'.")
            throw new Error("Wrong config file")
          }
        }
        break
      } catch (e: unknown) {
        console.log(`\n${e}\n`)
        console.log("Deploy: Could be due to block confirmation. Wait for 3 seconds and then retry.")
        console.log("Deploy: Stop process if you find another problem.\n")
        await new Promise((timeout) => setTimeout(timeout, 3000)) // 3 seconds is an arbitrary period.
      }
    }

    console.log(`Deploy: ${deployConfig.name} ${deployConfig.type} is deployed at ${contract!.address}`)

    // Write live config file.
    const investableInfo = {
      network: investable.network,
      type: deployConfig.type,
      name: deployConfig.name,
    }

    if (deployConfig.subtype === "roleable") {
      writeLiveConfig(investableInfo, {
        name: deployConfig.contractName,
        address: contract!.address,
        multisig: deployConfig.multisig,
      })
    } else {
      writeLiveConfig(investableInfo, {
        name: deployConfig.contractName,
        address: contract!.address,
        owner: deployConfig.owner,
      })
    }

    console.log(`Deploy: Corresponding live config is created at ${getLiveConfigPath(investableInfo)}.`)

    // Verify contract.
    console.log("Deploy: Verify the new contract.\n")

    await verifyContract(contract!.address)

    console.log()
  }

  if (investable.type === "portfolio") {
    console.log("Deploy: Deposit $2 to and withdraw $1 from the top level portfolio.")

    await investOneDollar(investable)

    console.log()
  } else {
    console.log("Deploy: It looks like what we just deployed is not a portfolio. Skip investing $1.\n")
  }

  return contract!
}

function getInvestmentTokenArgs(deployConfig: DeployConfig): InvestmentTokenArgs {
  return {
    name: deployConfig.investmentTokenName,
    symbol: deployConfig.investmentTokenSymbol,
  }
}

function getLibraries(deployConfig: DeployConfig): LibraryArgs {
  return {
    libraries: deployConfig.libraries,
  }
}

function getPortfolioArgs(deployConfig: DeployConfig): PortfolioArgs {
  return {
    depositToken: deployConfig.depositToken,
    depositFee: {
      amount: BigNumber.from(deployConfig.depositFee),
      params: deployConfig.depositFeeParams,
    },
    withdrawalFee: {
      amount: BigNumber.from(deployConfig.withdrawalFee),
      params: deployConfig.withdrawalFeeParams,
    },
    performanceFee: {
      amount: BigNumber.from(deployConfig.performanceFee),
      params: deployConfig.performanceFeeParams,
    },
    feeReceiver: {
      address: deployConfig.feeReceiver,
      params: deployConfig.feeReceiverParams,
    },
    investmentLimit: {
      total: BigInt(deployConfig.totalInvestmentLimit),
      perAddress: BigInt(deployConfig.investmentLimitPerAddress),
    },
  }
}

function getPortfolioExtraArgs(deployConfig: DeployConfig): PortfolioExtraArgs {
  return {
    extraArgs: deployConfig.extraArgs,
  }
}

function getPortfolioInvestables(network: string, deployConfig: DeployConfig): string[] {
  const investableAddrs: string[] = []

  for (let investable of deployConfig.investables) {
    const typeAndName: string[] = investable.split("/")
    const liveConfig: LiveConfig = readLiveConfig({
      network: network,
      type: typeAndName[0],
      name: typeAndName[1],
    })

    investableAddrs.push(liveConfig.address)
  }

  return investableAddrs
}

function getPortfolioAllocations(deployConfig: DeployConfig): number[][] {
  return deployConfig.allocations
}

function getStrategyArgs(deployConfig: any): StrategyArgs {
  return {
    depositToken: deployConfig.depositToken,
    depositFee: {
      amount: BigNumber.from(deployConfig.depositFee),
      params: deployConfig.depositFeeParams,
    },
    withdrawalFee: {
      amount: BigNumber.from(deployConfig.withdrawalFee),
      params: deployConfig.withdrawalFeeParams,
    },
    performanceFee: {
      amount: BigNumber.from(deployConfig.performanceFee),
      params: deployConfig.performanceFeeParams,
    },
    feeReceiver: {
      address: deployConfig.feeReceiver,
      params: deployConfig.feeReceiverParams,
    },
    investmentLimit: {
      total: BigInt(deployConfig.totalInvestmentLimit),
      perAddress: BigInt(deployConfig.investmentLimitPerAddress),
    },
    oracle: { name: deployConfig.oracle.name, address: deployConfig.oracle.address },
    swapService: {
      provider: BigNumber.from(deployConfig.swapService.provider),
      router: deployConfig.swapService.router,
    },
    roleToUsers: deployConfig.roleToUsers,
  }
}

function getStrategyExtraArgs(deployConfig: DeployConfig): StrategyExtraArgs {
  return {
    extraArgs: deployConfig.extraArgs,
  }
}

async function investOneDollar(investable: Investable): Promise<void> {
  // Get an instance of HRE.
  const { ethers } = require("hardhat")

  // Get portfolio and its token.
  const portfolioLiveConfig = readLiveConfig(investable)
  const portfolio = await ethers.getContractAt(portfolioLiveConfig.name, portfolioLiveConfig.address)
  const portfolioToken = await ethers.getContractAt("InvestmentToken", await portfolio.getInvestmentToken())

  // Get deployer account and USDC.
  const deployer = (await ethers.getSigners())[0]
  const usdc = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    DepositTokens.get(investable.network)
  )

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
