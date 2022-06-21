//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Math.sol";

struct TokenDesc {
    uint256 total;
    uint256 acquired;
}

library StrategyLib {
    address public constant NATIVE_AVAX =
        0x0000000000000000000000000000000000000001;

    function calculateMintAmount(
        TokenDesc[] memory tokenDescs,
        uint256 stratTokenSupply
    ) internal pure returns (uint256) {
        if (stratTokenSupply == 0) {
            uint256 res = 1;
            for (uint256 i = 0; i < tokenDescs.length; i++)
                res *= tokenDescs[i].acquired;
            return Math.sqrt(res);
        } else {
            uint256 res = Math.MAX_UINT;
            for (uint256 i = 0; i < tokenDescs.length; i++)
                res = Math.min(
                    res,
                    (tokenDescs[i].acquired * stratTokenSupply) /
                        tokenDescs[i].total
                );
            return res;
        }
    }
}
