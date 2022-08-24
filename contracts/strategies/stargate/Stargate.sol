//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./StargateStorageLib.sol";
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

        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        strategyStorage.stargateRouter = stargateRouter_;
        strategyStorage.stargatePool = stargatePool_;
        strategyStorage.stargateLpStaking = stargateLpStaking_;
        strategyStorage.stargateLpToken = stargateLpToken_;
        strategyStorage.stargateStgToken = stargateStgToken_;

        strategyStorage.stargateDepositToken = IERC20Upgradeable(
            strategyStorage.stargatePool.token()
        );
        strategyStorage.stargatePoolId = strategyStorage.stargatePool.poolId();

        IStargateLpStaking.PoolInfo memory poolInfo;
        uint256 poolLength = strategyStorage.stargateLpStaking.poolLength();
        for (uint256 i = 0; i < poolLength; i++) {
            poolInfo = strategyStorage.stargateLpStaking.poolInfo(i);
            if (
                address(poolInfo.lpToken) ==
                address(strategyStorage.stargateLpToken)
            ) {
                strategyStorage.stargateFarmId = i;
                break;
            }
        }
        if (
            address(poolInfo.lpToken) !=
            address(strategyStorage.stargateLpToken)
        ) {
            revert InvalidStargateLpToken();
        }
    }

    function _deposit(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        if (depositToken != strategyStorage.stargateDepositToken) {
            amount = swapToken(
                depositToken,
                strategyStorage.stargateDepositToken,
                amount
            );
        }

        uint256 lpBalanceBefore = strategyStorage.stargateLpToken.balanceOf(
            address(this)
        );
        strategyStorage.stargateDepositToken.approve(
            address(strategyStorage.stargateRouter),
            amount
        );
        strategyStorage.stargateRouter.addLiquidity(
            strategyStorage.stargatePoolId,
            amount,
            address(this)
        );
        uint256 lpBalanceAfter = strategyStorage.stargateLpToken.balanceOf(
            address(this)
        );

        uint256 lpBalanceIncrement = lpBalanceAfter - lpBalanceBefore;
        strategyStorage.stargateLpToken.approve(
            address(strategyStorage.stargateLpStaking),
            lpBalanceIncrement
        );
        strategyStorage.stargateLpStaking.deposit(
            strategyStorage.stargateFarmId,
            lpBalanceIncrement
        );
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        uint256 lpBalanceToWithdraw = (getStargateLpBalance() * amount) /
            getInvestmentTokenSupply();

        if (lpBalanceToWithdraw > strategyStorage.stargatePool.deltaCredit()) {
            revert NotEnoughDeltaCredit();
        }

        uint256 stargateDepositTokenBalanceBefore = strategyStorage
            .stargateDepositToken
            .balanceOf(address(this));
        strategyStorage.stargateLpStaking.withdraw(
            strategyStorage.stargateFarmId,
            lpBalanceToWithdraw
        );
        strategyStorage.stargateRouter.instantRedeemLocal(
            uint16(strategyStorage.stargatePoolId),
            lpBalanceToWithdraw,
            address(this)
        );
        uint256 stargateDepositTokenBalanceAfter = strategyStorage
            .stargateDepositToken
            .balanceOf(address(this));

        if (depositToken != strategyStorage.stargateDepositToken) {
            uint256 stargateDepositTokenBalanceIncrement = stargateDepositTokenBalanceAfter -
                    stargateDepositTokenBalanceBefore;
            swapToken(
                strategyStorage.stargateDepositToken,
                depositToken,
                stargateDepositTokenBalanceIncrement
            );
        }
    }

    function _reapReward(NameValuePair[] calldata) internal virtual override {
        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        strategyStorage.stargateLpStaking.deposit(
            strategyStorage.stargateFarmId,
            0
        );

        swapToken(
            strategyStorage.stargateStgToken,
            depositToken,
            strategyStorage.stargateStgToken.balanceOf(address(this))
        );
    }

    function getAssetBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {
        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        assetBalances = new Balance[](1);
        assetBalances[0] = Balance(
            address(strategyStorage.stargateLpToken),
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
        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        assetValuations = new Valuation[](1);
        assetValuations[0] = Valuation(
            address(strategyStorage.stargateLpToken),
            (getStargateLpBalance() *
                strategyStorage.stargatePool.totalLiquidity()) /
                strategyStorage.stargatePool.totalSupply()
        );

        if (depositToken != strategyStorage.stargateDepositToken) {
            assetValuations[0].valuation =
                (assetValuations[0].valuation *
                    priceOracle.getPrice(
                        strategyStorage.stargateDepositToken,
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
        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        return
            strategyStorage
                .stargateLpStaking
                .userInfo(strategyStorage.stargateFarmId, address(this))
                .amount;
    }
}
