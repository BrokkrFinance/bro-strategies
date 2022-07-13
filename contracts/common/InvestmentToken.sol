//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IInvestmentToken.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract InvestmentToken is
    ContextUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    IInvestmentToken
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name_, string memory symbol_)
        public
        initializer
    {
        __Context_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ERC20_init(name_, symbol_);
    }

    function mint(address account_, uint256 amount_) public virtual onlyOwner {
        _mint(account_, amount_);
    }

    function _authorizeUpgrade(
        address /* newImplementation */
    ) internal virtual override onlyOwner {}

    function burn(uint256 amount)
        public
        virtual
        override(IInvestmentToken, ERC20BurnableUpgradeable)
    {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount)
        public
        virtual
        override(IInvestmentToken, ERC20BurnableUpgradeable)
    {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }
}
