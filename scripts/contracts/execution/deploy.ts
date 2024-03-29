import { BigNumber, Contract } from "ethers"
import { DepositTokenAmounts, DepositTokens, NativeToken } from "../../constants/deposit-tokens"
import { readDeployConfig, readLiveConfig, writeLiveConfig } from "../../files/io"
import { getLiveConfigPath } from "../../files/paths"
import { DeployConfig, LiveConfig } from "../../interfaces/configs"
import { Investable } from "../../interfaces/investable"
import { DeployOptions } from "../../interfaces/options"
import { defaultAffiliatorAddress } from "../../../test/helper/constants"
import {
  IndexArgs,
  IndexExtraArgs,
  IndexTokenArgs,
  InvestmentTokenArgs,
  LibraryArgs,
  PortfolioArgs,
  PortfolioExtraArgs,
  StrategyArgs,
  StrategyExtraArgs,
} from "../../interfaces/parameters"
import {
  deployUUPSUpgradeableIndexOwnable,
  deployUUPSUpgradeablePortfolio,
  deployUUPSUpgradeableStrategyOwnable,
  deployUUPSUpgradeableStrategyRoleable,
} from "../core/deploy"
import { verifyContract } from "../core/verify"
import { deployLibraries } from "./library"

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
          // Deploy libraries.
          const librarArgs = getLibraries(deployConfig)
          const libraries = await deployLibraries(investable.network, librarArgs)

          // Deploy a portfolio contract.
          contract = await deployUUPSUpgradeablePortfolio(
            deployConfig.contractName,
            deployConfig.owner,
            getInvestmentTokenArgs(deployConfig),
            getPortfolioArgs(deployConfig),
            getPortfolioExtraArgs(deployConfig),
            getPortfolioInvestables(investable.network, deployConfig),
            getPortfolioAllocations(deployConfig),
            libraries
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
          } else if (deployConfig.subtype === "index") {
            contract = await deployUUPSUpgradeableIndexOwnable(
              deployConfig.contractName,
              deployConfig.owner,
              getIndexTokenArgs(deployConfig),
              getIndexArgs(deployConfig),
              getIndexExtraArgs(deployConfig),
              libraries
            )
          }
        } else {
          console.log(`Deploy: The config file has 'type' of ${deployConfig.type}.`)
          throw new Error("Wrong config file")
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

    if (deployConfig.type === "strategy" && deployConfig.subtype === "index") {
      console.log("Deploy: Deposit $2 to and withdraw $1 from the index strategy.")

      await investOneDollarToIndex(investable, deployConfig.whitelistedTokens[0], options)

      console.log()
    }
  }

  if (investable.type === "portfolio") {
    console.log("Deploy: Deposit $2 to and withdraw $1 from the top level portfolio.")

    await investOneDollarToPortfolio(investable, deployConfigs[deployConfigs.length - 1].depositToken)

    console.log()
  }

  return contract!
}

function getInvestmentTokenArgs(deployConfig: DeployConfig): InvestmentTokenArgs {
  return {
    name: deployConfig.investmentTokenName,
    symbol: deployConfig.investmentTokenSymbol,
  }
}

function getIndexTokenArgs(deployConfig: DeployConfig): IndexTokenArgs {
  return {
    name: deployConfig.indexTokenName,
    symbol: deployConfig.indexTokenSymbol,
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
    feeArgs: {
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
      managementFee: {
        amount: BigNumber.from(deployConfig.managementFee),
        params: deployConfig.managementFeeParams,
      },
      feeReceiver: {
        address: deployConfig.feeReceiver,
        params: deployConfig.feeReceiverParams,
      },
    },
    investmentLimit: {
      total: BigInt(deployConfig.totalInvestmentLimit),
      perAddress: BigInt(deployConfig.investmentLimitPerAddress),
    },
    roleToUsers: deployConfig.roleToUsers,
    oracle: { name: deployConfig.oracle.name, address: deployConfig.oracle.address },
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
    feeArgs: {
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
      managementFee: {
        amount: BigNumber.from(deployConfig.managementFee),
        params: deployConfig.performanceFeeParams,
      },
      feeReceiver: {
        address: deployConfig.feeReceiver,
        params: deployConfig.feeReceiverParams,
      },
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

function getIndexArgs(deployConfig: any): IndexArgs {
  return {
    wNATIVE: deployConfig.wNATIVE,
    components: deployConfig.components,
    swapRoutes: deployConfig.swapRoutes,
    whitelistedTokens: deployConfig.whitelistedTokens,
    oracle: deployConfig.oracle,
    equityValuationLimit: deployConfig.equityValuationLimit,
    feeSuggester: deployConfig.feeSuggester,
    feeWhitelist: deployConfig.feeWhitelist,
  }
}

function getIndexExtraArgs(deployConfig: any): IndexExtraArgs {
  return {
    extraArgs: deployConfig.extraArgs,
  }
}

async function investOneDollarToPortfolio(investable: Investable, depositTokenAddr: string): Promise<void> {
  // Get an instance of HRE.
  const { ethers } = require("hardhat")

  // Get portfolio and its token.
  const portfolioLiveConfig = readLiveConfig(investable)
  const portfolio = await ethers.getContractAt(portfolioLiveConfig.name, portfolioLiveConfig.address)
  const portfolioToken = await ethers.getContractAt("InvestmentToken", await portfolio.getInvestmentToken())

  // Get deployer account and USDC.
  const deployer = (await ethers.getSigners())[0]
  const depositToken = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
    depositTokenAddr
  )
  const depositTokenDecimals = await depositToken.decimals()

  // Deposit $2.
  const portfolioTokenBalanceBefore = await portfolioToken.balanceOf(deployer.address)

  const depositAmount = ethers.utils.parseUnits(
    DepositTokenAmounts.get(investable.network)!.get(depositTokenAddr),
    depositTokenDecimals
  )
  await depositToken.connect(deployer).approve(portfolio.address, depositAmount)
  await portfolio.connect(deployer).deposit(depositAmount, 0, deployer.address, [])

  const portfolioTokenBalanceAfter = await portfolioToken.balanceOf(deployer.address)

  console.log(`Deploy: Successfully deposited $2 to ${portfolioLiveConfig.address}.`)

  // Withdraw $1.
  const portfolioTokenBalance = portfolioTokenBalanceAfter.sub(portfolioTokenBalanceBefore)

  await portfolioToken.connect(deployer).approve(portfolio.address, portfolioTokenBalance.div(2))
  await portfolio.connect(deployer).withdraw(portfolioTokenBalance.div(2), 0, deployer.address, [])

  console.log(`Deploy: Successfully withdrew $1 from ${portfolioLiveConfig.address}.`)
}

async function investOneDollarToIndex(
  investable: Investable,
  depositTokenAddr: string,
  options?: DeployOptions
): Promise<void> {
  // Get an instance of HRE.
  const { ethers } = require("hardhat")

  // Get portfolio and its token.
  const strategyLiveConfig = readLiveConfig(investable)
  const strategy = await ethers.getContractAt(strategyLiveConfig.name, strategyLiveConfig.address)
  const indexToken = await ethers.getContractAt("IndexToken", await strategy.indexToken())

  // Get deployer account.
  const deployer = (await ethers.getSigners())[0]

  // Deposit $2.
  console.log("Deploy: Deposit $2.")

  if (depositTokenAddr === NativeToken) {
    const depositAmount = ethers.utils.parseEther("2", 18)
    const [amountIndex] = await strategy.callStatic.getAmountIndexFromNATIVE(depositAmount)
    const amountIndexWithSlippage = amountIndex.mul(995).div(1000)

    await strategy
      .connect(deployer)
      .mintIndexFromNATIVE(amountIndexWithSlippage, deployer.address, defaultAffiliatorAddress, {
        value: depositAmount,
      })
  } else {
    const depositToken = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      depositTokenAddr
    )
    const depositTokenDecimals = await depositToken.decimals()

    const depositAmount = ethers.utils.parseUnits(
      DepositTokenAmounts.get(investable.network)!.get(depositTokenAddr)!,
      depositTokenDecimals
    )
    const [amountIndex] = await strategy.callStatic.getAmountIndexFromToken(depositTokenAddr, depositAmount)
    const amountIndexWithSlippage = amountIndex.mul(995).div(1000)

    await depositToken.connect(deployer).approve(strategy.address, depositAmount)
    await strategy
      .connect(deployer)
      .mintIndexFromToken(
        depositTokenAddr,
        depositAmount,
        amountIndexWithSlippage,
        deployer.address,
        defaultAffiliatorAddress
      )
  }

  console.log(`Deploy: Successfully deposited $2 to ${strategyLiveConfig.address}.`)

  if (options !== undefined && options.testRun !== undefined && !options.testRun) {
    console.log("Deploy: Wait 1 min for block confirmation before withdrawing.")
    await new Promise((timeout) => setTimeout(timeout, 60000))
  }

  // Withdraw $1.
  console.log("Deploy: Withdraw $1.")

  const indexTokenBalance = await indexToken.balanceOf(deployer.address)

  const withdrawAmount = indexTokenBalance.div(2)

  if (depositTokenAddr === NativeToken) {
    const amountNative = await strategy.callStatic.getAmountNATIVEFromExactIndex(withdrawAmount)
    const amountNativeMin = amountNative.mul(BigNumber.from(1e2).sub(1)).div(1e2)

    await indexToken.connect(deployer).approve(strategy.address, withdrawAmount)
    await strategy.connect(deployer).burnExactIndexForNATIVE(amountNativeMin, withdrawAmount, deployer.address)
  } else {
    const amountToken = await strategy.callStatic.getAmountTokenFromExactIndex(depositTokenAddr, withdrawAmount)
    const amountTokenMin = amountToken.mul(BigNumber.from(1e2).sub(1)).div(1e2)

    await indexToken.connect(deployer).approve(strategy.address, withdrawAmount)
    await strategy
      .connect(deployer)
      .burnExactIndexForToken(depositTokenAddr, amountTokenMin, withdrawAmount, deployer.address)
  }

  console.log(`Deploy: Successfully withdrew $1 from ${strategyLiveConfig.address}.`)
}
