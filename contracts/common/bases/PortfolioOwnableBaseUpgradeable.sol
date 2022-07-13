//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./PortfolioBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

abstract contract PortfolioOwnableBaseUpgradeable is
    PortfolioBaseUpgradeable,
    OwnableUpgradeable
{
    // solhint-disable-next-line
    function __PortfolioOwnableBaseUpgradeable_init(
        IInvestmentToken investmentToken_,
        IERC20Upgradeable depositToken_
    ) internal onlyInitializing {
        __Ownable_init();
        __PortfolioBaseUpgradeable_init(investmentToken_, depositToken_);
    }

    function addInvestable(IInvestable investable)
        public
        virtual
        override
        onlyOwner
    {
        super.addInvestable(investable);
    }

    function removeInvestable(IInvestable investable)
        public
        virtual
        override
        onlyOwner
    {
        super.removeInvestable(investable);
    }

    function setTargetInvestableAllocations(uint256[] calldata newAllocations)
        public
        virtual
        override
        onlyOwner
    {
        super.setTargetInvestableAllocations(newAllocations);
    }

    function rebalance(
        NameValuePair[][] calldata depositParams,
        NameValuePair[][] calldata withdrawParams
    ) public virtual override onlyOwner {
        super.rebalance(depositParams, withdrawParams);
    }

    function setDepositFee(uint24 fee_) public virtual override onlyOwner {
        super.setDepositFee(fee_);
    }

    function setWithdrawalFee(uint24 fee_) public virtual override onlyOwner {
        super.setWithdrawalFee(fee_);
    }

    function setPerformanceFee(uint24 fee_) public virtual override onlyOwner {
        super.setPerformanceFee(fee_);
    }
}
