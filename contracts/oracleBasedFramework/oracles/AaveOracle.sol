// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../interfaces/IPriceOracle.sol";
import "../libraries/InvestableLib.sol";
import "../libraries/Math.sol";
import "../../dependencies/aave/IPriceOracleGetter.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IERC20UpgradeableExt } from "../interfaces/IERC20UpgradeableExt.sol";

contract AaveOracle is OwnableUpgradeable, UUPSUpgradeable, IPriceOracle {
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
        IERC20UpgradeableExt baseToken,
        IERC20UpgradeableExt quoteToken,
        uint8 precisionDigits,
        bool,
        bool
    ) external view returns (uint256) {
        if (quoteToken == baseToken) return 10**precisionDigits;

        // vendor returns prices in usd in 8 decimal point precision
        uint256 quoteTokenPriceInUsd = vendorFeed.getAssetPrice(
            address(quoteToken)
        );
        uint256 baseTokenPriceInUsd = vendorFeed.getAssetPrice(
            address(baseToken)
        );

        if (quoteTokenPriceInUsd == 0 || baseTokenPriceInUsd == 0)
            revert InvalidAssetPrice();

        // returns prices in usd in 6 decimal point precision
        return
            InvestableLib.convertPricePrecision(
                ((quoteTokenPriceInUsd * Math.LONG_FIXED_DECIMAL_FACTOR) /
                    baseTokenPriceInUsd),
                Math.LONG_FIXED_DECIMAL_FACTOR,
                10**precisionDigits
            );
    }
}
