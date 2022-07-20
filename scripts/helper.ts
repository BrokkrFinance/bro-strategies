import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import erc20abi from "./abi/erc20.json"

export async function expectSuccess<T>(fut: Promise<T>) {
  var resolvedPromise: Promise<T>
  try {
    let resolved = await fut
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

export async function deployStrategy(
  strategyContractName: string,
  investnemtTokenName: string,
  investnemtTokenTicker: string,
  depositToken: any,
  depositFee: number,
  withdrawalFee: number,
  performanceFee: number,
  strategyExtraArgs: any[]
) {
  const strategyToken = await deployProxyContract("InvestmentToken", [investnemtTokenName, investnemtTokenTicker])
  const strategy = await expectSuccess(deployContract(strategyContractName, []))
  await expectSuccess(strategyToken.transferOwnership(strategy.address))
  await expectSuccess(
    strategy.initialize(
      strategyToken.address,
      depositToken.address,
      depositFee,
      withdrawalFee,
      performanceFee,
      ...strategyExtraArgs
    )
  )

  return strategy
}

export async function deployPortfolio(
  portfolioContractName: string,
  investnemtTokenName: string,
  investnemtTokenTicker: string,
  depositToken: any,
  investables: any[]
) {
  const portfolioToken = await deployProxyContract("InvestmentToken", [investnemtTokenName, investnemtTokenTicker])
  const portfolio = await expectSuccess(deployContract(portfolioContractName, []))
  await expectSuccess(portfolioToken.transferOwnership(portfolio.address))

  await expectSuccess(portfolio.initialize(portfolioToken.address, depositToken.address))
  for (let investable of investables) {
    await expectSuccess(portfolio.addInvestable(investable.address))
  }

  await expectSuccess(portfolio.setTargetInvestableAllocations([25000, 75000, 0]))
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
  console.info(`Deploying ${info} ${contract.address} ${argStr}`)
  await contract.deployTransaction.wait()
  return contract
}

export async function deployProxyContract(name: string, args: any[], label?: string, options?: any) {
  let info = name
  if (label != undefined) {
    info = name + ":" + label
  }
  const contractFactory = await ethers.getContractFactory(name)
  let contract
  if (options != undefined) {
    contract = await upgrades.deployProxy(contractFactory, args, options)
  } else {
    contract = await upgrades.deployProxy(contractFactory, args)
  }
  const argStr = args.map((i) => `"${i}"`).join(" ")
  console.info(`Deploying proxy ${info} ${contract.address} ${argStr}`)
  await contract.deployTransaction.wait()
  return contract
}

export async function contractAt(name: string, address: string, provider?: any) {
  let contractFactory = await ethers.getContractFactory(name)
  if (provider != undefined) {
    contractFactory = contractFactory.connect(provider)
  }
  return await contractFactory.attach(address)
}

export async function getUsdcContract() {
  return await ethers.getContractAt(erc20abi, "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E")
}

export const CoinAddrs = {
  usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
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
  gmxRewardRouter: "0x82147C5A7E850eA4E28155DF107F2590fD4ba327",
}
