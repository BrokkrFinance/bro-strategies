// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

interface IStargatePool {
    function token() external view returns (address);

    function poolId() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function totalLiquidity() external view returns (uint256);
}
