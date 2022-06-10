//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Common.sol";
import "./StrategyToken.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract StrategyErc20BaseUpgradable is ERC165Upgradeable {
    StrategyToken public strategyToken;

    // solhint-disable-next-line func-name-mixedcase
    function __StrategyErc20BaseUpgradable_init(StrategyToken strategyToken_)
        internal
        onlyInitializing
    {
        strategyToken = strategyToken_;
    }

    function depositErc20(
        uint256 amount,
        IERC20Upgradeable token,
        NameValuePair[] memory params
    ) external virtual;

    function burnErc20(
        uint256 amount,
        IERC20Upgradeable token,
        NameValuePair[] memory params
    ) external virtual;

    function emergencyBurnErc20(
        uint256 amount,
        IERC20Upgradeable token,
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
            interfaceId == type(StrategyErc20BaseUpgradable).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
