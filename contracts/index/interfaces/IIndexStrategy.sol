// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IChainlinkAggregatorV3 } from "../dependencies/IChainlinkAggregatorV3.sol";
import { IIndexToken } from "../interfaces/IIndexToken.sol";
import { SwapAdapter } from "../libraries/SwapAdapter.sol";

interface IIndexStrategy {
    event Mint(
        address indexed sender,
        address indexed recipient,
        uint256 amountWETH,
        uint256 amountIndex
    );

    event Burn(
        address indexed sender,
        address indexed recipient,
        uint256 amountWETH,
        uint256 amountIndex
    );

    function mintExactIndexFromToken(
        address token,
        uint256 amountTokenMax,
        uint256 amountIndex,
        address recipient
    ) external returns (uint256 amountTokenSpent);

    function burnExactIndexForToken(
        address token,
        uint256 amountTokenMin,
        uint256 amountIndex,
        address recipient
    ) external returns (uint256 amountToken);

    function getAmountIndexFromToken(address token, uint256 amountToken)
        external
        view
        returns (uint256 amountIndex, uint256 amountTokenSpent);

    function getAmountTokenFromExactIndex(address token, uint256 amountIndex)
        external
        view
        returns (uint256 amountToken);

    function setOracle(address oracle) external;

    function setSwapRoute(
        address token0,
        address token1,
        address router,
        SwapAdapter.DEX dex,
        SwapAdapter.PairData memory pairData
    ) external;

    function setWhitelistedTokens(address[] memory tokens) external;

    function equityValuation(bool maximize, bool includeAmmPrice)
        external
        view
        returns (uint256);

    function indexToken() external view returns (IIndexToken);
}
