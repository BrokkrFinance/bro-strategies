// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../../../strategies/stargate/StargateStorageLib.sol";
import "../../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../../../dependencies/stargate/IStargateLpStaking.sol";
import "../../../dependencies/stargate/IStargatePool.sol";
import "../../../dependencies/stargate/IStargateRouter.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract StargateV2 is UUPSUpgradeable, StrategyOwnablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidStargateLpToken();
    error NotEnoughDeltaCredit();

    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName =
        "brokkr.stargate_strategy.stargate_strategy_v2.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "Stargate Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "2.0.0";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        IStargateRouter router,
        IStargatePool pool,
        IStargateLpStaking lpStaking,
        IERC20Upgradeable lpToken,
        IERC20Upgradeable stgToken
    ) external reinitializer(2) {
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);

        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        strategyStorage.router = router;
        strategyStorage.pool = pool;
        strategyStorage.lpStaking = lpStaking;
        strategyStorage.lpToken = lpToken;
        strategyStorage.stgToken = stgToken;

        strategyStorage.poolDepositToken = IERC20Upgradeable(pool.token());
        strategyStorage.poolId = pool.poolId();

        IStargateLpStaking.PoolInfo memory poolInfo;
        uint256 poolLength = lpStaking.poolLength();
        bool isPoolFound = false;
        for (uint256 i = 0; i < poolLength; i++) {
            poolInfo = lpStaking.poolInfo(i);
            if (address(poolInfo.lpToken) == address(lpToken)) {
                strategyStorage.farmId = i;
                isPoolFound = true;
                break;
            }
        }

        if (!isPoolFound) {
            revert InvalidStargateLpToken();
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _deposit(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        if (depositToken != strategyStorage.poolDepositToken) {
            address[] memory path = new address[](3);
            path[0] = address(depositToken);
            path[1] = address(InvestableLib.WAVAX);
            path[2] = address(strategyStorage.poolDepositToken);

            amount = swapExactTokensForTokens(swapService, amount, path);
        }

        uint256 lpBalanceBefore = strategyStorage.lpToken.balanceOf(
            address(this)
        );
        strategyStorage.poolDepositToken.approve(
            address(strategyStorage.router),
            amount
        );
        strategyStorage.router.addLiquidity(
            strategyStorage.poolId,
            amount,
            address(this)
        );
        uint256 lpBalanceAfter = strategyStorage.lpToken.balanceOf(
            address(this)
        );

        uint256 lpBalanceIncrement = lpBalanceAfter - lpBalanceBefore;

        strategyStorage.lpToken.approve(
            address(strategyStorage.lpStaking),
            lpBalanceIncrement
        );
        strategyStorage.lpStaking.deposit(
            strategyStorage.farmId,
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

        if (lpBalanceToWithdraw > strategyStorage.pool.deltaCredit()) {
            revert NotEnoughDeltaCredit();
        }

        uint256 poolDepositTokenBalanceBefore = strategyStorage
            .poolDepositToken
            .balanceOf(address(this));
        strategyStorage.lpStaking.withdraw(
            strategyStorage.farmId,
            lpBalanceToWithdraw
        );
        strategyStorage.router.instantRedeemLocal(
            uint16(strategyStorage.poolId),
            lpBalanceToWithdraw,
            address(this)
        );
        uint256 poolDepositTokenBalanceAfter = strategyStorage
            .poolDepositToken
            .balanceOf(address(this));

        if (depositToken != strategyStorage.poolDepositToken) {
            uint256 poolDepositTokenBalanceIncrement = poolDepositTokenBalanceAfter -
                    poolDepositTokenBalanceBefore;
            address[] memory path = new address[](3);
            path[0] = address(strategyStorage.poolDepositToken);
            path[1] = address(InvestableLib.WAVAX);
            path[2] = address(depositToken);

            swapExactTokensForTokens(
                swapService,
                poolDepositTokenBalanceIncrement,
                path
            );
        }
    }

    function _reapReward(NameValuePair[] calldata) internal virtual override {
        StargateStorage storage strategyStorage = StargateStorageLib
            .getStorage();

        strategyStorage.lpStaking.deposit(strategyStorage.farmId, 0);

        address[] memory path = new address[](3);
        path[0] = address(strategyStorage.stgToken);
        path[1] = address(InvestableLib.WAVAX);
        path[2] = address(depositToken);

        swapExactTokensForTokens(
            swapService,
            strategyStorage.stgToken.balanceOf(address(this)),
            path
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
            address(strategyStorage.lpToken),
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
            address(strategyStorage.lpToken),
            (getStargateLpBalance() * strategyStorage.pool.totalLiquidity()) /
                strategyStorage.pool.totalSupply()
        );

        if (depositToken != strategyStorage.poolDepositToken) {
            assetValuations[0].valuation =
                (assetValuations[0].valuation *
                    priceOracle.getPrice(
                        strategyStorage.poolDepositToken,
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
                .lpStaking
                .userInfo(strategyStorage.farmId, address(this))
                .amount;
    }
}
