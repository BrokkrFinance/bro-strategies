// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../interfaces/IPriceOracle.sol";
import "../libraries/InvestableLib.sol";
import "../libraries/Math.sol";
import "../../dependencies/venus/IVenusOracle.sol";
import "../../dependencies/venus/IVToken.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract VenusOracle is OwnableUpgradeable, UUPSUpgradeable, IPriceOracle {
    IVenusOracle public vendorFeed;
    IERC20Upgradeable internal baseToken;
    mapping(IERC20Upgradeable => IVToken) public tokenToVTokenMap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IVenusOracle vendorFeed_, IERC20Upgradeable baseToken_)
        external
        initializer
    {
        __Ownable_init();
        __UUPSUpgradeable_init();
        setVendorFeed(address(vendorFeed_));
        baseToken = baseToken_;
    }

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function setVendorFeed(address vendorFeed_) public onlyOwner {
        vendorFeed = IVenusOracle(vendorFeed_);
    }

    function setTokenToVToken(IERC20Upgradeable token, IVToken vToken)
        public
        onlyOwner
    {
        tokenToVTokenMap[token] = vToken;
    }

    function getPrice(
        IERC20Upgradeable token,
        bool,
        bool
    ) external view returns (uint256) {
        uint256 tokenPriceInUsd = vendorFeed.getUnderlyingPrice(
            tokenToVTokenMap[token]
        );
        uint256 baseTokenPriceInUsd = vendorFeed.getUnderlyingPrice(
            tokenToVTokenMap[baseToken]
        );

        if (tokenPriceInUsd == 0 || baseTokenPriceInUsd == 0)
            revert InvalidAssetPrice();

        return
            InvestableLib.convertPricePrecision(
                ((tokenPriceInUsd * Math.LONG_FIXED_DECIMAL_FACTOR) /
                    baseTokenPriceInUsd),
                Math.LONG_FIXED_DECIMAL_FACTOR,
                InvestableLib.PRICE_PRECISION_FACTOR
            );
    }
}
