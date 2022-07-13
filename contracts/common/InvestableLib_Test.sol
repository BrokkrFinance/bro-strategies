//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./InvestableLib.sol";

import "@mangrovedao/hardhat-test-solidity/test.sol";

// solhint-disable-next-line contract-name-camelcase
contract InvestableLib_Test {
    // solhint-disable-next-line no-empty-blocks
    receive() external payable {} // necessary to receive eth from test runner

    // solhint-disable-next-line func-name-mixedcase
    function calculateMintAmount_test() public {
        TokenDesc[] memory tokenDescs = new TokenDesc[](1);
        tokenDescs[0] = TokenDesc(100, 20);
        Test.eq(
            InvestableLib.calculateMintAmount(tokenDescs, 10),
            2,
            "test 1 failed"
        );

        tokenDescs = new TokenDesc[](2);
        tokenDescs[0] = TokenDesc(100, 20);
        tokenDescs[1] = TokenDesc(100, 15);
        Test.eq(
            InvestableLib.calculateMintAmount(tokenDescs, 10),
            1,
            "test 2 failed"
        );

        tokenDescs = new TokenDesc[](2);
        tokenDescs[0] = TokenDesc(0, 20);
        tokenDescs[1] = TokenDesc(0, 15);
        Test.eq(
            InvestableLib.calculateMintAmount(tokenDescs, 0),
            17,
            "test 3 failed"
        );
    }
}
