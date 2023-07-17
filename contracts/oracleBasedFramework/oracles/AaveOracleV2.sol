// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IPriceOracleV2 } from "../interfaces/IPriceOracleV2.sol";
import { IERC20UpgradeableExt } from "../interfaces/IERC20UpgradeableExt.sol";
import { Math } from "../libraries/Math.sol";
import { InvestableLib } from "../libraries/InvestableLib.sol";

import { IPriceOracleGetter } from "../../dependencies/aave/IPriceOracleGetter.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract AaveOracle is OwnableUpgradeable, UUPSUpgradeable, IPriceOracleV2 {
    IPriceOracleGetter public vendorFeed;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address vendorFeed_) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        setVendorFeed(vendorFeed_);
    }

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function setVendorFeed(address vendorFeed_) public onlyOwner {
        vendorFeed = IPriceOracleGetter(vendorFeed_);
    }

    function getPrice(
        IERC20UpgradeableExt quoteToken,
        IERC20UpgradeableExt baseToken,
        bool,
        bool
    ) external view returns (uint256) {
        if (quoteToken == baseToken) return 10**quoteToken.decimals();

        // vendor returns prices in usd in 8 decimal point precision
        uint256 quoteTokenPriceInUsd = vendorFeed.getAssetPrice(
            address(quoteToken)
        );
        uint256 baseTokenPriceInUsd = vendorFeed.getAssetPrice(
            address(baseToken)
        );

        if (quoteTokenPriceInUsd == 0 || baseTokenPriceInUsd == 0)
            revert InvalidAssetPrice();

        // returns prices in usd in quoteToken decimal point precision
        return
            InvestableLib.convertPricePrecision(
                ((quoteTokenPriceInUsd * Math.LONG_FIXED_DECIMAL_FACTOR) /
                    baseTokenPriceInUsd),
                Math.LONG_FIXED_DECIMAL_FACTOR,
                10**quoteToken.decimals()
            );
    }
}
