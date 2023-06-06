// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { DCABaseUpgradeable } from "../base/DCABaseUpgradeable.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MockDCAStrategy is DCABaseUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    IERC20Upgradeable public bluechipToken;
    uint8 private bluechipTokenDecimals;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        DCAStrategyInitArgs calldata args,
        address bluechipToken_,
        uint8 bluechipTokenDecimals_
    ) external initializer {
        __DCABaseUpgradeable_init(args);

        bluechipToken = IERC20Upgradeable(bluechipToken_);
        bluechipTokenDecimals = bluechipTokenDecimals_;
    }

    function _invest(uint256 amount) internal virtual override returns (uint256) {
        return amount;
    }

    function _claimRewards() internal virtual override returns (uint256) {
        // always claim 1 ether
        return 1e8;
    }

    function _withdrawInvestedBluechip(uint256 amount) internal virtual override returns (uint256) {
        return amount;
    }

    function _transferBluechip(address to, uint256 amount) internal virtual override {
        bluechipToken.safeTransfer(to, amount);
    }

    function _totalBluechipInvested() internal view virtual override returns (uint256) {
        if (
            bluechipInvestmentState == BluechipInvestmentState.Investing ||
            bluechipInvestmentState == BluechipInvestmentState.Withdrawn
        ) {
            return bluechipToken.balanceOf(address(this));
        }

        // When emergency exit was triggered the strategy
        // no longer holds any bluechip asset
        return 0;
    }

    function _bluechipAddress() internal view virtual override returns (address) {
        return address(bluechipToken);
    }

    function _bluechipDecimals() internal view virtual override returns (uint8) {
        return bluechipTokenDecimals;
    }
}
