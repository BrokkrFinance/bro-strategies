//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./StrategyBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

abstract contract StrategyOwnableBaseUpgradeable is
    StrategyBaseUpgradeable,
    OwnableUpgradeable
{
    // solhint-disable-next-line
    function __StrategyOwnableBaseUpgradeable_init(
        IInvestmentToken investmentToken_,
        IERC20Upgradeable depositToken_,
        uint24 depositFee_,
        uint24 withdrawalFee_,
        uint24 performanceFee_
    ) internal onlyInitializing {
        __Ownable_init();
        __StrategyBaseUpgradeable_init(
            investmentToken_,
            depositToken_,
            depositFee_,
            withdrawalFee_,
            performanceFee_
        );
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
