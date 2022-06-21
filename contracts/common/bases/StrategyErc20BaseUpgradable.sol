//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../StrategyToken.sol";
import "./FeeOwnableUpgradeable.sol";
import "../interfaces/AUMI.sol";
import "../interfaces/FeeI.sol";
import "../interfaces/StrategyErc20I.sol";

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract StrategyErc20BaseUpgradable is
    StrategyErc20I,
    AUMI,
    ERC165Upgradeable,
    FeeOwnableUpgradeable
{
    StrategyToken public strategyToken;

    // solhint-disable-next-line func-name-mixedcase
    function __StrategyErc20BaseUpgradable_init(
        StrategyToken strategyToken_,
        uint24 fee_
    ) internal onlyInitializing {
        __ERC165_init();
        __FeeOwnableUpgradeable_init(fee_);
        strategyToken = strategyToken_;
    }

    function depositErc20(
        uint256 amount,
        IERC20 token,
        NameValuePair[] memory params
    ) external virtual override;

    function burnErc20(
        uint256 amount,
        IERC20 token,
        NameValuePair[] memory params
    ) external virtual override;

    function emergencyBurnErc20(
        uint256 amount,
        IERC20 token,
        address payable recipient,
        NameValuePair[] memory params
    ) external virtual override;

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(StrategyErc20I).interfaceId ||
            interfaceId == type(AUMI).interfaceId ||
            interfaceId == type(FeeI).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
