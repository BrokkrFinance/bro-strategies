//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IFee {
    function setFee(uint24 fee) external;

    function getFee() external returns (uint24);

    function withdrawFee(address payable recipient) external;
}
