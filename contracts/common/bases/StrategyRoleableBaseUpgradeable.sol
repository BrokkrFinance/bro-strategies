// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./StrategyBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

abstract contract StrategyRoleableBaseUpgradeable is
    AccessControlEnumerableUpgradeable,
    StrategyBaseUpgradeable
{
    uint256[8] private futureFeaturesGap;

    // Manages sensitive parameters of the strategy for example fee swap service.
    // Any parameter change that can result in stolen or lost funds should be managed by the governor role.
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    // Manages less sensitive parameters of the strategy for example setting investment limits.
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    // Manages routine, periodic tasks like delta neutral rebalancing and liquidation protection.
    bytes32 public constant MAINTAINER_ROLE = keccak256("KEEPER_ROLE");
    // Manages smart contract upgrades.
    bytes32 public constant UPGRADE_ROLE = keccak256("UPGRADE_ROLE");
    // Manages smart contract pausability.
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");

    // solhint-disable-next-line
    function __StrategyRoleableBaseUpgradeable_init(
        StrategyArgs calldata strategyArgs
    ) internal onlyInitializing {
        __AccessControlEnumerable_init();
        __StrategyBaseUpgradeable_init(strategyArgs);
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(GOVERNOR_ROLE, _msgSender());
        _grantRole(STRATEGIST_ROLE, _msgSender());
        _grantRole(MAINTAINER_ROLE, _msgSender());
        _grantRole(UPGRADE_ROLE, _msgSender());
        _grantRole(PAUSE_ROLE, _msgSender());
    }

    function setDepositFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setDepositFee(fee_, params);
    }

    function setWithdrawalFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setWithdrawalFee(fee_, params);
    }

    function setPerformanceFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setPerformanceFee(fee_, params);
    }

    function setFeeReceiver(
        address feeReceiver_,
        NameValuePair[] calldata params
    ) public virtual override onlyRole(GOVERNOR_ROLE) {
        super.setFeeReceiver(feeReceiver_, params);
    }

    function setInvestmentToken(IInvestmentToken investmentToken)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setInvestmentToken(investmentToken);
    }

    function setTotalInvestmentLimit(uint256 totalInvestmentLimit)
        public
        virtual
        override
        onlyRole(STRATEGIST_ROLE)
    {
        super.setTotalInvestmentLimit(totalInvestmentLimit);
    }

    function setInvestmentLimitPerAddress(uint256 investmentLimitPerAddress)
        public
        virtual
        override
        onlyRole(STRATEGIST_ROLE)
    {
        super.setInvestmentLimitPerAddress(investmentLimitPerAddress);
    }

    function setPriceOracle(IPriceOracle priceOracle)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setPriceOracle(priceOracle);
    }

    function setSwapService(SwapServiceProvider provider, address router)
        public
        virtual
        override
        onlyRole(GOVERNOR_ROLE)
    {
        super.setSwapService(provider, router);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerableUpgradeable, StrategyBaseUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
