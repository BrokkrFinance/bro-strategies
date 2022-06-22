//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../StrategyToken.sol";
import "./FeeOwnableUpgradeable.sol";
import "../interfaces/IAUM.sol";
import "../interfaces/IFee.sol";
import "../interfaces/IStrategyErc20.sol";

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract StrategyErc20BaseUpgradeable is
    IStrategyErc20,
    IAUM,
    ERC165Upgradeable,
    FeeOwnableUpgradeable
{
    StrategyToken public strategyToken;

    // solhint-disable-next-line func-name-mixedcase
    function __StrategyErc20BaseUpgradeable_init(
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
            interfaceId == type(IStrategyErc20).interfaceId ||
            interfaceId == type(IAUM).interfaceId ||
            interfaceId == type(IFee).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
