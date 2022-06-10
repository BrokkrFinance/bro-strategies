//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Common.sol";
import "./StrategyToken.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";

abstract contract StrategyNativeBaseUpgradable is ERC165Upgradeable {
    StrategyToken public strategyToken;

    // solhint-disable-next-line func-name-mixedcase
    function __StrategyNativeBaseUpgradable_init(StrategyToken strategyToken_)
        internal
        onlyInitializing
    {
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
            interfaceId == type(StrategyNativeBaseUpgradable).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
