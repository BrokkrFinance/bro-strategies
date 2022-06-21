//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../interfaces/FeeI.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract FeeOwnableUpgradeable is FeeI, OwnableUpgradeable {
    uint24 public fee;

    // solhint-disable-next-line func-name-mixedcase
    function __FeeOwnableUpgradeable_init(uint24 fee_)
        internal
        onlyInitializing
    {
        __Ownable_init();
        fee = fee_;
    }

    function setFee(uint24 fee_) external override onlyOwner {
        fee = fee_;
    }

    function getFee() external view override returns (uint24) {
        return fee;
    }

    function withdrawFee(address payable recipient) external virtual;
}
