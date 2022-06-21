//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../StrategyToken.sol";
import "./FeeOwnableUpgradeable.sol";
import "../interfaces/IAUM.sol";
import "../interfaces/IFee.sol";
import "../interfaces/IStrategyNative.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";

abstract contract StrategyNativeBaseUpgradable is
    StrategyNativeI,
    IAUM,
    ERC165Upgradeable,
    FeeOwnableUpgradeable
{
    StrategyToken public strategyToken;

    // solhint-disable-next-line func-name-mixedcase
    function __StrategyNativeBaseUpgradable_init(
        StrategyToken strategyToken_,
        uint24 fee_
    ) internal onlyInitializing {
        __ERC165_init();
        __FeeOwnableUpgradeable_init(fee_);
        strategyToken = strategyToken_;
    }

    function deposit(NameValuePair[] memory params) external payable virtual;

    function burn(uint256 amount, NameValuePair[] memory params)
        external
        virtual;

    function emergencyBurn(
        uint256 amount,
        address payable recipient,
        NameValuePair[] memory params
    ) external virtual;

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(StrategyNativeI).interfaceId ||
            interfaceId == type(IAUM).interfaceId ||
            interfaceId == type(IFee).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
