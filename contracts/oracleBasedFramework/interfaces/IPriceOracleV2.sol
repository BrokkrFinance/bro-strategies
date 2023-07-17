// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IERC20UpgradeableExt } from "../interfaces/IERC20UpgradeableExt.sol";

interface IPriceOracleV2 {
    error InvalidAssetPrice();

    function getPrice(
        IERC20UpgradeableExt quoteToken,
        IERC20UpgradeableExt baseToken,
        bool shouldMaximise,
        bool includeAmmPrice
    ) external view returns (uint256);

    function setVendorFeed(address vendorFeed_) external;
}
