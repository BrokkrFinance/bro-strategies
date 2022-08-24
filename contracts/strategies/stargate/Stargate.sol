//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../../common/libraries/InvestableLib.sol";
import "../../dependencies/stargate/IStargateLpStaking.sol";
import "../../dependencies/stargate/IStargatePool.sol";
import "../../dependencies/stargate/IStargateRouter.sol";

contract Stargate is StrategyOwnablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidStargateLpToken();
    error NotEnoughDeltaCredit();

    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "brokkr.stargate_strategy.stargate_strategy_v1.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "Stargate Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    IStargateRouter public stargateRouter;
    IStargatePool public stargatePool;
    IStargateLpStaking public stargateLpStaking;
    IERC20Upgradeable public stargateDepositToken;
    IERC20Upgradeable public stargateLpToken;
    IERC20Upgradeable public stargateStgToken;
    uint256 public stargatePoolId;
    uint256 public stargateFarmId;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        IStargateRouter stargateRouter_,
        IStargatePool stargatePool_,
        IStargateLpStaking stargateLpStaking_,
        IERC20Upgradeable stargateLpToken_,
        IERC20Upgradeable stargateStgToken_
    ) external initializer {
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);
        stargateRouter = stargateRouter_;
        stargatePool = stargatePool_;
        stargateLpStaking = stargateLpStaking_;
        stargateLpToken = stargateLpToken_;
        stargateStgToken = stargateStgToken_;

        stargateDepositToken = IERC20Upgradeable(stargatePool.token());
        stargatePoolId = stargatePool.poolId();

        IStargateLpStaking.PoolInfo memory poolInfo;
        uint256 poolLength = stargateLpStaking.poolLength();
        for (uint256 i = 0; i < poolLength; i++) {
            poolInfo = stargateLpStaking.poolInfo(i);
            if (address(poolInfo.lpToken) == address(stargateLpToken)) {
                stargateFarmId = i;
                break;
            }
        }
        if (address(poolInfo.lpToken) != address(stargateLpToken)) {
            revert InvalidStargateLpToken();
        }
    }

    function _deposit(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        if (depositToken != stargateDepositToken) {
            amount = swapToken(depositToken, stargateDepositToken, amount);
        }

        uint256 lpBalanceBefore = stargateLpToken.balanceOf(address(this));
        stargateDepositToken.approve(address(stargateRouter), amount);
        stargateRouter.addLiquidity(stargatePoolId, amount, address(this));
        uint256 lpBalanceAfter = stargateLpToken.balanceOf(address(this));

        uint256 lpBalanceIncrement = lpBalanceAfter - lpBalanceBefore;
        stargateLpToken.approve(address(stargateLpStaking), lpBalanceIncrement);
        stargateLpStaking.deposit(stargateFarmId, lpBalanceIncrement);
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        uint256 lpBalanceToWithdraw = (getStargateLpBalance() * amount) /
            getInvestmentTokenSupply();

        if (lpBalanceToWithdraw > stargatePool.deltaCredit()) {
            revert NotEnoughDeltaCredit();
        }

        uint256 stargateDepositTokenBalanceBefore = stargateDepositToken
            .balanceOf(address(this));
        stargateLpStaking.withdraw(stargateFarmId, lpBalanceToWithdraw);
        stargateRouter.instantRedeemLocal(
            uint16(stargatePoolId),
            lpBalanceToWithdraw,
            address(this)
        );
        uint256 stargateDepositTokenBalanceAfter = stargateDepositToken
            .balanceOf(address(this));

        if (depositToken != stargateDepositToken) {
            uint256 stargateDepositTokenBalanceIncrement = stargateDepositTokenBalanceAfter -
                    stargateDepositTokenBalanceBefore;
            swapToken(
                stargateDepositToken,
                depositToken,
                stargateDepositTokenBalanceIncrement
            );
        }
    }

    function _reapReward(NameValuePair[] calldata) internal virtual override {
        stargateLpStaking.deposit(stargateFarmId, 0);

        swapToken(
            stargateStgToken,
            depositToken,
            stargateStgToken.balanceOf(address(this))
        );
    }

    function getAssetBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {
        assetBalances = new Balance[](1);
        assetBalances[0] = Balance(
            address(stargateLpToken),
            getStargateLpBalance()
        );
    }

    function getLiabilityBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory liabilityBalances)
    {}

    function getAssetValuations(bool shouldMaximise, bool shouldIncludeAmmPrice)
        public
        view
        virtual
        override
        returns (Valuation[] memory assetValuations)
    {
        assetValuations = new Valuation[](1);
        assetValuations[0] = Valuation(
            address(stargateLpToken),
            (getStargateLpBalance() * stargatePool.totalLiquidity()) /
                stargatePool.totalSupply()
        );

        if (depositToken != stargateDepositToken) {
            assetValuations[0].valuation =
                (assetValuations[0].valuation *
                    priceOracle.getPrice(
                        stargateDepositToken,
                        shouldMaximise,
                        shouldIncludeAmmPrice
                    )) /
                InvestableLib.PRICE_PRECISION_FACTOR;
        }
    }

    function getLiabilityValuations(bool, bool)
        public
        view
        virtual
        override
        returns (Valuation[] memory liabilityValuations)
    {}

    function getStargateLpBalance() public view returns (uint256) {
        return stargateLpStaking.userInfo(stargateFarmId, address(this)).amount;
    }
}
