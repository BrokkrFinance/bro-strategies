//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../../common/bases/StrategyErc20BaseUpgradable.sol";

contract GmxDn is StrategyErc20BaseUpgradable {
    function depositErc20(
        uint256 amount,
        IERC20 token,
        NameValuePair[] memory params
    ) external virtual override {}

    function burnErc20(
        uint256 amount,
        IERC20 token,
        NameValuePair[] memory params
    ) external virtual override {}

    function emergencyBurnErc20(
        uint256 amount,
        IERC20 token,
        address payable recipient,
        NameValuePair[] memory params
    ) external virtual override {}

    function getAssetsUnderManagement()
        external
        override
        returns (Assets[] memory)
    {
        Assets[] memory res;
        return res;
    }

    function withdrawFee(address payable recipient)
        external
        override(IFee, FeeOwnableUpgradeable)
    {}
}
