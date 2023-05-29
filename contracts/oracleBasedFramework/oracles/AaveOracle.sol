// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../interfaces/IPriceOracle.sol";
import "../libraries/InvestableLib.sol";
import "../libraries/Math.sol";
import "../../dependencies/aave/IPriceOracleGetter.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AaveOracle is OwnableUpgradeable, UUPSUpgradeable, IPriceOracle {
    IPriceOracleGetter public vendorFeed;
    IERC20 internal usdcToken;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address vendorFeed_, address usdcToken_)
        external
        initializer
    {
        __Ownable_init();
        __UUPSUpgradeable_init();
        setVendorFeed(vendorFeed_);
        usdcToken = IERC20(usdcToken_);
    }

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function setVendorFeed(address vendorFeed_) public onlyOwner {
        vendorFeed = IPriceOracleGetter(vendorFeed_);
    }

    function getPrice(
        IERC20Upgradeable token,
        bool,
        bool
    ) external view returns (uint256) {
        uint256 tokenPriceInUsd = vendorFeed.getAssetPrice(address(token));
        uint256 usdcPriceInUsd = vendorFeed.getAssetPrice(address(usdcToken));

        if (tokenPriceInUsd == 0 || usdcPriceInUsd == 0)
            revert InvalidAssetPrice();

        return
            InvestableLib.convertPricePrecision(
                ((tokenPriceInUsd * Math.LONG_FIXED_DECIMAL_FACTOR) /
                    usdcPriceInUsd),
                Math.LONG_FIXED_DECIMAL_FACTOR,
                InvestableLib.PRICE_PRECISION_FACTOR
            );
    }
}
