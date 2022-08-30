//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../../dependencies/traderjoe/ITraderJoeMasterChef.sol";
import "../../dependencies/traderjoe/ITraderJoeRouter.sol";
import "../../dependencies/traderjoe/ITraderJoePair.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TraderJoe is UUPSUpgradeable, StrategyOwnablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidTraderJoeLpToken();

    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "brokkr.traderjoe_strategy.traderjoe_strategy_v1.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "TraderJoe Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    ITraderJoeRouter public router;
    IERC20Upgradeable public pairDepositToken;
    ITraderJoePair public lpToken;
    ITraderJoeMasterChef public masterChef;
    IERC20Upgradeable public joeToken;
    uint256 public farmId;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        ITraderJoeRouter router_,
        ITraderJoeMasterChef masterChef_,
        ITraderJoePair lpToken_,
        IERC20Upgradeable joeToken_
    ) external initializer {
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);

        router = router_;
        masterChef = masterChef_;
        lpToken = lpToken_;
        joeToken = joeToken_;

        address token0 = lpToken.token0();
        if (token0 != address(depositToken)) {
            pairDepositToken = IERC20Upgradeable(token0);
        } else {
            pairDepositToken = IERC20Upgradeable(lpToken.token1());
        }

        ITraderJoeMasterChef.PoolInfo memory poolInfo;
        uint256 poolLength = masterChef.poolLength();
        for (uint256 i = 0; i < poolLength; i++) {
            poolInfo = masterChef.poolInfo(i);
            if (address(poolInfo.lpToken) == address(lpToken)) {
                farmId = i;
                break;
            }
        }
        if (address(poolInfo.lpToken) != address(lpToken)) {
            revert InvalidTraderJoeLpToken();
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _deposit(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {}

    function _withdraw(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {}

    function _reapReward(NameValuePair[] calldata) internal virtual override {}

    function getAssetBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {}

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
    {}

    function getLiabilityValuations(bool, bool)
        public
        view
        virtual
        override
        returns (Valuation[] memory liabilityValuations)
    {}

    function getTraderJoeLpBalance() public view returns (uint256) {
        return masterChef.userInfo(farmId, address(this)).amount;
    }

    function getTraderJoeLpReserves()
        public
        view
        returns (uint256 depositTokenReserve, uint256 pairDepositTokenReserve)
    {
        (uint256 reserve0, uint256 reserve1, ) = lpToken.getReserves();

        if (lpToken.token0() == address(depositToken)) {
            return (reserve0, reserve1);
        } else {
            return (reserve1, reserve0);
        }
    }
}
