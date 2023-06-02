# Index strategies

## Introduction

This project is an index protocol on EVM chains.

## Install dependencies

```
cd ../..
yarn
```

## Run test

```
cd ../..
yarn test test/index/
```

## How to deposit and withdraw

### Deposit

To mint index token, you need to set minimum amount of index token to mint for slippage protection. You can get the value by calling `getAmountIndexFromToken` and multiplying your slippage tolerance value. With the value, now you can call `mintIndexFromToken`.

### Withdrawal

Withdrawal is symmetrical to deposit. You can set minimum amount of token to receive by calling `getAmountTokenFromExactIndex` and multiplying your slippage tolerance value. You can call `burnExactIndexForToken` afterward.

## Deployment

Let's say you want to deploy `IndexArbitrumDeFi` on Arbitrum. First, you need to setup deployment config `../../configs/arbitrum/deploy/strategy/IndexArbitrumDeFi.json`. When you're done, you can run the following commands.

```
cd ../..
ts-node ./scripts/contracts/deploy.ts arbitrum strategy IndexArbitrumDeFi
```
