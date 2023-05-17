// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IChronosRouter {
    struct route {
        address from;
        address to;
        bool stable;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        route[] calldata routes,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}
