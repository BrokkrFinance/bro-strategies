//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../../common/bases/StrategyErc20BaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract GmxDn is StrategyErc20BaseUpgradeable {
    address payable public aavePoolAddr;
    IERC20 public usdcAddr;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        //_disableInitializers();
    }

    function initialize(address payable aavePoolAddr_, IERC20 usdcAddr_)
        external
        initializer
    {
        aavePoolAddr = aavePoolAddr_;
        usdcAddr = usdcAddr_;
    }

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
