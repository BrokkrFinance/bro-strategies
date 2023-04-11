# Brotocol strategies

## Deployment

To deploy the contracts, set the correct environment variables needed in `hardhat.config.ts`.
Then, modify the config file `scripts/deploymentConfig.json`.

Finally run:

```
npx hardhat run scripts/deploy.ts
```

## Releasing a new strategy

The following section explains how the versioning of the strategies needs to be done in order to
always be able to retrieve the source code of the deployed strategies, even if the strategy was not verified on the blockchain. Even if the strategy was verified, we would still need a way to easily find the git commit from which the deployed strategy was built.

### Git

Currently we have a very simple git workflow. New strategies are released from the main branch
and tagged by part of the 'name' of the strategy. For example if a new version of the cash strategy is released, and the current 'name' property in the source code of that strategy has the value of **block42.cash_strategy.cash_strategy_v1.0.2**, then the following git commands has to be executed.

```bash
git checkout main
git pull
# the tag name will be the the string following the last dot of the name, in the example the name was
# block42.cash_strategy.cash_strategy_v1.0.2
git tag -a cash_strategy_v1.0.2
# the command above will open a text editor, please write down how this version is different from the previuos one
git push origin cash_strategy_v1.0.2
```

If you release multiple strategies at once, please create the tags for all strategies.

### Versioning of strategies

Each strategy has a version number in semver format: https://semver.org/. This version number has to be part of the git tag.

The most important thing is to bump the major version number at each breaking changes for example if the current verstion was 2.3.1, and there was a breaking change, then the new version should be 3.0.0

## Pending tasks

### High priority

1. remove unsafeSkipStorageCheck in the next release
1. <s>create a cash strategy for the wrapper portfolio</s>
1. <s>add a new price oracle supporting USDT</s>
1. <s>allow changing the name of ERC-20 tokens</s>
1. <s>reinvest (all USDC that is the contract balance - unclaimed fee) during reap reward</s>
1. verify existing contracts using tenderly and analyze the gas cost
1. mint non-recoverable tokens at the first deposit just like uniswap does
1. <s>create reusable tests for portfolios and strategies</s>
1. deposits on the portfolio should respect the caps on the the embedded investables
1. deposits on the portfolio should respect the pausability of the embedded investables
1. rebalancing of portfolios should respect the caps on the embedded investables
1. rebalancing of portfolios should respect the pausability on the embedded investables
1. reducing the gas cost of withdrawals, by having cash strategies and fulfilling withdrawal requests from them
1. reducing the gas cost of deposits by investing only into one investables
1. fees should not be taken during rebalancing: (requires whitelisting in investables)
1. move all the base classes and interfaces into a new git repo and create npm packages for proper versioning

### Medium priority

1. create our own price oracle instead of depending on other projects
1. remove wrapper portfolio idea to save gas cost
1. rebalancing should be precise even in the presence of fees
1. add rebalancePair(IInvestable investable1, uint256 allocationPercentage1, IInvestable investable2, uint256 allocationPercentage2) to the portfolio interface, and implement it, so rebalancing can be done offchain
1. implement taking all 3 kind of fees on the portfolio level
1. implement taking deposit and performance fees on the strategy level

### Low priority

1. rebalancing should be precise even in the presence of fees
1. implement withdrawReward for non auto compounding tasks
1. rebalancing should be done entirely offchain
1. gas optimization
1. refactoring: scripts/helper.ts
1. add comments to unified test scripts
1. improve unified test performance
1. write our own version of safeApprove: https://github.com/OpenZeppelin/openzeppelin-contracts/issues/2219
1. In the current implementation a strategy cannot hold depositToken assets apart from the uninvested depositToken.
