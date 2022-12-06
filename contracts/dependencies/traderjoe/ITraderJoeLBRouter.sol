// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface ITraderJoeLBRouter {
    struct LiquidityParameters {
        address tokenX;
        address tokenY;
        uint256 binStep;
        uint256 amountX;
        uint256 amountY;
        uint256 amountXMin;
        uint256 amountYMin;
        uint256 activeIdDesired;
        uint256 idSlippage;
        int256[] deltaIds;
        uint256[] distributionX;
        uint256[] distributionY;
        address to;
        uint256 deadline;
    }

    function addLiquidity(LiquidityParameters calldata liquidityParameters)
        external
        returns (uint256[] memory depositIds, uint256[] memory liquidityMinted);

    function removeLiquidity(
        address tokenX,
        address tokenY,
        uint16 binStep,
        uint256 amountXMin,
        uint256 amountYMin,
        uint256[] memory ids,
        uint256[] memory amounts,
        address to,
        uint256 deadline
    ) external returns (uint256 amountX, uint256 amountY);

    function getPriceFromId(address lbPair, uint24 id)
        external
        view
        returns (uint256);
}
