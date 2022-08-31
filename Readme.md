# Brotocol strategies

## Pending tasks

### High priority

1. <s>create a cash strategy for the wrapper portfolio</s>
1. <s>add a new price oracle supporting USDT</s>
1. mint non-recoverable tokens at the first deposit just like uniswap does
1. create reusable tests for portfolios and strategies
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
