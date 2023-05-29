// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../interfaces/IPriceOracle.sol";
import "../libraries/InvestableLib.sol";
import "../libraries/Math.sol";
import "../../dependencies/gmx/IVaultPriceFeed.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GmxOracle is OwnableUpgradeable, UUPSUpgradeable, IPriceOracle {
    IVaultPriceFeed public vendorFeed;
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
        vendorFeed = IVaultPriceFeed(vendorFeed_);
    }

    function getPrice(
        IERC20Upgradeable token,
        bool shouldMaximise,
        bool includeAmmPrice
    ) external view returns (uint256) {
        uint256 tokenPriceInUsd = vendorFeed.getPrice(
            address(token),
            shouldMaximise,
            includeAmmPrice,
            false
        );

        uint256 usdcPriceInUsd = vendorFeed.getPrice(
            address(usdcToken),
            shouldMaximise,
            includeAmmPrice,
            false
        );

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
