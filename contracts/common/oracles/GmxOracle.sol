//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../interfaces/IPriceOracle.sol";
import "../libraries/InvestableLib.sol";
import "../libraries/Math.sol";
import "../../dependencies/gmx/IVaultPriceFeed.sol";

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GmxOracle is OwnableUpgradeable, UUPSUpgradeable, IPriceOracle {
    IVaultPriceFeed public gmxVaultPriceFeed;
    IERC20 internal usdcToken;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address gmxVaultPriceFeed_, address usdcToken_)
        external
        initializer
    {
        __Ownable_init();
        __UUPSUpgradeable_init();
        setGmxVaultPriceFeed(gmxVaultPriceFeed_);
        usdcToken = IERC20(usdcToken_);
    }

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function setGmxVaultPriceFeed(address gmxVaultPriceFeed_) public onlyOwner {
        gmxVaultPriceFeed = IVaultPriceFeed(gmxVaultPriceFeed_);
    }

    function getPrice(
        IERC20Upgradeable token,
        bool shouldMaximise,
        bool includeAmmPrice
    ) external view returns (uint256) {
        return
            InvestableLib.convertPricePrecision(
                ((gmxVaultPriceFeed.getPrice(
                    address(token),
                    shouldMaximise,
                    includeAmmPrice,
                    false
                ) * (10**30)) /
                    gmxVaultPriceFeed.getPrice(
                        address(usdcToken),
                        shouldMaximise,
                        includeAmmPrice,
                        false
                    )),
                10**30,
                InvestableLib.PRICE_PRECISION_FACTOR
            );
    }
}
