//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDcaFor {
    function depositFor(
        address sender,
        uint256 amount,
        uint8 amountSplit
    ) external;

    function withdrawAllFor(address sender) external;

    function withdrawAllFor(address sender, uint256 positionIndex) external;

    function withdrawBluechipFor(address sender) external;

    function withdrawBluechipFor(address sender, uint256 positionIndex)
        external;
}
