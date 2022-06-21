//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../interfaces/IFee.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract FeeOwnableUpgradeable is IFee, OwnableUpgradeable {
    uint24 public fee;

    // solhint-disable-next-line func-name-mixedcase
    function __FeeOwnableUpgradeable_init(uint24 fee_)
        internal
        onlyInitializing
    {
        __Ownable_init();
        fee = fee_;
    }

    function setFee(uint24 fee_) external virtual override onlyOwner {
        fee = fee_;
    }

    function getFee() external view virtual override returns (uint24) {
        return fee;
    }

    function withdrawFee(address payable recipient) external virtual;
}
