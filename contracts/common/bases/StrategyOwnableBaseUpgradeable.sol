//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./StrategyBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

abstract contract StrategyOwnableBaseUpgradeable is
    OwnableUpgradeable,
    StrategyBaseUpgradeable
{
    uint256[8] private futureFeaturesGap;

    // solhint-disable-next-line
    function __StrategyOwnableBaseUpgradeable_init(
        StrategyArgs calldata strategyArgs
    ) internal onlyInitializing {
        __Ownable_init();
        __StrategyBaseUpgradeable_init(strategyArgs);
    }

    function setDepositFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyOwner
    {
        super.setDepositFee(fee_, params);
    }

    function setWithdrawalFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyOwner
    {
        super.setWithdrawalFee(fee_, params);
    }

    function setPerformanceFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyOwner
    {
        super.setPerformanceFee(fee_, params);
    }

    function setFeeReceiver(
        address feeReceiver_,
        NameValuePair[] calldata params
    ) public virtual override onlyOwner {
        super.setFeeReceiver(feeReceiver_, params);
    }

    function setInvestmentToken(IInvestmentToken investmentToken)
        public
        virtual
        override
        onlyOwner
    {
        super.setInvestmentToken(investmentToken);
    }

    function setTotalInvestmentLimit(uint256 totalInvestmentLimit)
        public
        virtual
        override
        onlyOwner
    {
        super.setTotalInvestmentLimit(totalInvestmentLimit);
    }

    function setInvestmentLimitPerAddress(uint256 investmentLimitPerAddress)
        public
        virtual
        override
        onlyOwner
    {
        super.setInvestmentLimitPerAddress(investmentLimitPerAddress);
    }
}
