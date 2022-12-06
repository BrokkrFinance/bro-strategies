// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./TraderJoeStorageLib.sol";
import "../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../../common/libraries/SwapServiceLib.sol";
import "../../dependencies/traderjoe/ITraderJoeLBPair.sol";
import "../../dependencies/traderjoe/ITraderJoeLBRouter.sol";
import "../../dependencies/traderjoe/ITraderJoeMasterChef.sol";
import "../../dependencies/traderjoe/ITraderJoeRouter.sol";
import "../../dependencies/traderjoe/ITraderJoePair.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TraderJoe is UUPSUpgradeable, StrategyOwnablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidTraderJoeLBPair();

    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName =
        "brokkr.traderjoe_strategy.traderjoe_strategy_v1.1.1";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "TraderJoe Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.1.1";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        ITraderJoeLBPair lbPair,
        ITraderJoeLBRouter lbRouter,
        uint256 binStep,
        uint256[] calldata binIds,
        uint256[] calldata binAllocationsX,
        uint256[] calldata binAllocationsY
    ) external initializer {
        __UUPSUpgradeable_init();
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);

        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        strategyStorage.lbPair = lbPair;
        strategyStorage.lbRouter = lbRouter;
        strategyStorage.tokenX = IERC20Upgradeable(lbPair.tokenX());
        strategyStorage.tokenY = IERC20Upgradeable(lbPair.tokenY());
        strategyStorage.binStep = binStep;
        strategyStorage.binIds = binIds;
        strategyStorage.binAllocationsX = binAllocationsX;
        strategyStorage.binAllocationsY = binAllocationsY;

        if (strategyStorage.tokenX == depositToken) {
            strategyStorage.pairDepositToken = IERC20Upgradeable(
                strategyStorage.tokenY
            );
        } else if (strategyStorage.tokenY == depositToken) {
            strategyStorage.pairDepositToken = IERC20Upgradeable(
                strategyStorage.tokenX
            );
        } else {
            revert InvalidTraderJoeLBPair();
        }
    }

    function reinitialize(
        ITraderJoeLBPair lbPair,
        ITraderJoeLBRouter lbRouter,
        uint256 binStep,
        uint256[] calldata binIds,
        uint256[] calldata binAllocationsX,
        uint256[] calldata binAllocationsY,
        NameValuePair[] calldata params
    ) external reinitializer(2) {
        TraderJoeStorage storage strategyStorage = TraderJoeStorageLib
            .getStorage();

        // Initialization.
        strategyStorage.lbPair = lbPair;
        strategyStorage.lbRouter = lbRouter;
        strategyStorage.tokenX = IERC20Upgradeable(lbPair.tokenX());
        strategyStorage.tokenY = IERC20Upgradeable(lbPair.tokenY());
        strategyStorage.binStep = binStep;
        strategyStorage.binIds = binIds;
        strategyStorage.binAllocationsX = binAllocationsX;
        strategyStorage.binAllocationsY = binAllocationsY;

        if (strategyStorage.tokenX == depositToken) {
            strategyStorage.pairDepositToken = IERC20Upgradeable(
                strategyStorage.tokenY
            );
        } else if (strategyStorage.tokenY == depositToken) {
            strategyStorage.pairDepositToken = IERC20Upgradeable(
                strategyStorage.tokenX
            );
        } else {
            revert InvalidTraderJoeLBPair();
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

    function _getAssetBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {}

    function _getLiabilityBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory)
    {}

    function _getAssetValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory assetValuations)
    {}

    function _getLiabilityValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory)
    {}
}
