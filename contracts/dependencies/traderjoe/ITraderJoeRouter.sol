// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

interface ITraderJoeRouter {
    function getAmountsOut(uint256 amountIn, address[] memory path)
        external
        returns (uint256[] memory amounts);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}
