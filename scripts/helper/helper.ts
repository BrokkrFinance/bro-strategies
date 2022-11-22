import { expect } from "chai"
import { Contract, providers } from "ethers"
import { ethers, upgrades } from "hardhat"
type TransactionResponse = providers.TransactionResponse

export async function sleepForMilliseconds(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function retryUntilSuccess<T>(fut: Promise<T>) {
  while (true) {
    try {
      const resolved = await expectSuccess(fut)
      if (resolved !== undefined) {
        return resolved
      } else {
        console.log(`Error because resolved promise is undefined`)
        await sleepForMilliseconds(500)
      }
    } catch (e: unknown) {
      console.log(`Error when expecting Success: ${e}`)
      await sleepForMilliseconds(500)
    }
  }
}

export async function expectSuccess<T>(fut: Promise<T>) {
  let resolvedPromise: Promise<T>
  try {
    const resolved = await fut
    resolvedPromise = new Promise<T>((resolve, reject) => {
      resolve(resolved)
    })
  } catch (e: any) {
    resolvedPromise = new Promise((resolve, reject) => {
      throw e
    })
    if ("error" in e) {
      console.log(e.error)
    } else console.log(e)
  }
  await expect(resolvedPromise).not.to.be.reverted
  return await resolvedPromise
}

export async function deployFreeMoneyProvider() {
  const freeMoneyProvider = await deployContract("FreeMoneyProvider", [])
  return freeMoneyProvider
}

export async function getExecutionCostInUsd(
  transactionResponse: TransactionResponse,
  gasPriceInGwei: number = 30,
  avaxPriceInUsd: number = 24
) {
  return ((await transactionResponse.wait()).gasUsed.toNumber() * gasPriceInGwei * avaxPriceInUsd) / 1_000_000_000
}

export async function getExecutionGasAmount(transactionResponse: TransactionResponse) {
  return (await transactionResponse.wait()).gasUsed.toNumber()
}

export async function increaseEvmTimeBySeconds(seconds: number) {
  await expectSuccess(ethers.provider.send("evm_increaseTime", [3600 * 48]))
  await expectSuccess(ethers.provider.send("evm_mine", []))
}

export async function deployPriceOracle(oracleType: string, vendorFeed: string, baseCurrency: string) {
  return await deployProxyContract(oracleType, [vendorFeed, baseCurrency], {})
}

export async function deployUpgradeableStrategy(
  strategyContractName: string,
  investmentTokenName: string,
  investmentTokenTicker: string,
  depositToken: any,
  depositFee: number,
  depositFeeParams: any[],
  withdrawalFee: number,
  withdrawalFeeParams: any[],
  performanceFee: number,
  performanceFeeParams: any[],
  feeReceiver: string,
  feeReceiverParams: any[],
  totalInvestmentLimit: BigInt,
  investmentLimitPerAddress: BigInt,
  priceOracle: string,
  swapServiceProvider: number,
  swapServiceRouter: string,
  roleToUsersArray: any[],
  strategyExtraArgs: any[],
  libraries: {}
) {
  const investableToken = await retryUntilSuccess(
    deployProxyContract("InvestmentToken", [investmentTokenName, investmentTokenTicker], {})
  )
  const strategy = await retryUntilSuccess(
    deployProxyContract(
      strategyContractName,
      [
        [
          investableToken.address,
          depositToken.address,
          depositFee,
          depositFeeParams,
          withdrawalFee,
          withdrawalFeeParams,
          performanceFee,
          performanceFeeParams,
          feeReceiver,
          feeReceiverParams,
          totalInvestmentLimit,
          investmentLimitPerAddress,
          priceOracle,
          swapServiceProvider,
          swapServiceRouter,
          roleToUsersArray,
        ],
        ...strategyExtraArgs,
      ],
      libraries,
      "",
      { unsafeAllow: ["external-library-linking"] }
    )
  )
  await retryUntilSuccess(investableToken.transferOwnership(strategy.address))

  logBlue(`Successfully deployed strategy. Strategy address: ${strategy.address}`)
  logBlue(`Strategy token address: ${investableToken.address}`)
  return strategy
}

export async function deployPortfolio(
  isUpgradable: boolean,
  portfolioContractName: string,
  investmentTokenName: string,
  investmentTokenTicker: string,
  depositToken: any,
  investables: any[],
  depositFee: number,
  depositFeeParams: any[],
  withdrawalFee: number,
  withdrawalFeeParams: any[],
  performanceFee: number,
  performanceFeeParams: any[],
  feeReceiver: string,
  feeReceiverParams: any[],
  totalInvestmentLimit: BigInt,
  investmentLimitPerAddress: BigInt,
  allocations: number[][]
) {
  const investableToken = await retryUntilSuccess(
    deployProxyContract("InvestmentToken", [investmentTokenName, investmentTokenTicker], {})
  )
  let portfolio: Contract
  if (isUpgradable) {
    portfolio = await retryUntilSuccess(
      deployProxyContract(
        portfolioContractName,
        [
          [
            investableToken.address,
            depositToken.address,
            depositFee,
            depositFeeParams,
            withdrawalFee,
            withdrawalFeeParams,
            performanceFee,
            performanceFeeParams,
            feeReceiver,
            feeReceiverParams,
            totalInvestmentLimit,
            investmentLimitPerAddress,
          ],
        ],
        {}
      )
    )
  } else {
    portfolio = await retryUntilSuccess(deployContract(portfolioContractName, []))
    await retryUntilSuccess(
      portfolio.initialize([
        investableToken.address,
        depositToken.address,
        depositFee,
        depositFeeParams,
        withdrawalFee,
        withdrawalFeeParams,
        performanceFee,
        performanceFeeParams,
        feeReceiver,
        feeReceiverParams,
        totalInvestmentLimit,
        investmentLimitPerAddress,
      ])
    )
  }

  await retryUntilSuccess(investableToken.transferOwnership(portfolio.address))

  for (const [index, investable] of investables.entries()) {
    await retryUntilSuccess(portfolio.addInvestable(investable.address, allocations[index], []))
  }

  logBlue(`Successfully deployed portfolio. Portfolio address: ${portfolio.address}`)
  logBlue(`Portfolio token address: ${investableToken.address}`)
  return portfolio
}

export async function deployContract(name: string, args: any[], label?: string, options?: any) {
  let info = name
  if (label != undefined) {
    info = name + ":" + label
  }
  const contractFactory = await ethers.getContractFactory(name)
  let contract
  if (options != undefined) {
    contract = await contractFactory.deploy(...args, options)
  } else {
    contract = await contractFactory.deploy(...args)
  }
  const argStr = args.map((i) => `"${i}"`).join(" ")
  logGrey(`Deploying ${info} ${contract.address} ${argStr}`)
  await contract.deployTransaction.wait()
  return contract
}

export async function deployProxyContract(name: string, args: any[], libraries: any, label?: string, options?: any) {
  let info = name
  if (label != undefined) {
    info = name + ":" + label
  }
  const contractFactory = await ethers.getContractFactory(name, { libraries })
  let contract
  if (options != undefined) {
    contract = await upgrades.deployProxy(contractFactory, args, options)
  } else {
    contract = await upgrades.deployProxy(contractFactory, args)
  }
  const argStr = args.map((i) => `"${i}"`).join(" ")
  logGrey(`Deploying proxy -> name: ${info} || address: ${contract.address} || arguments: ${argStr}`)
  await contract.deployTransaction.wait()
  return contract
}

export async function getUsdcContract() {
  return await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", CoinAddrs.usdc)
}

export async function getUsdtContract() {
  return await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", CoinAddrs.usdt)
}

export async function getTokenContract(address: string) {
  return await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", address)
}

export async function contractAt(name: string, address: string, provider?: any) {
  let contractFactory = await ethers.getContractFactory(name)
  if (provider != undefined) {
    contractFactory = contractFactory.connect(provider)
  }
  return await contractFactory.attach(address)
}

export const CoinAddrs = {
  usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  usdt: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
  btc: "0x50b7545627a5162F82A992c33b87aDc75187B218",
  eth: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
  wAvax: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  aUsdc: "0x625E7708f30cA75bfd92586e17077590C60eb4cD",
  vBtc: "0x92b42c66840C7AD907b4BF74879FF3eF7c529473",
  vEth: "0x0c84331e39d6658Cd6e6b9ba04736cC4c4734351",
  vWavax: "0x4a1c3aD6Ed28a636ee1751C69071f6be75DEb8B8",
  gmx: "0x62edc0692BD897D2295872a9FFCac5425011c661",
}

export const ContractAddrs = {
  aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  aaveOracle: "0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C",
  gmxRewardRouter: "0x82147C5A7E850eA4E28155DF107F2590fD4ba327",
  gmxOracle: "0x81b7e71a1d9e08a6ca016a0f4d6fa50dbce89ee3",
}

export function logGrey(text: string) {
  console.log("\x1b[90m%s\x1b[0m", text)
}

export function logCyan(text: string) {
  console.log("\x1b[36m%s\x1b[0m", text)
}

export function logBlue(text: string) {
  console.log("\x1b[34m%s\x1b[0m", text)
}

export function logRed(text: string) {
  console.log("\x1b[31m%s\x1b[0m", text)
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
