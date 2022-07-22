//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Math.sol";

struct TokenDesc {
    uint256 total;
    uint256 acquired;
}

library InvestableLib {
    address public constant NATIVE_AVAX =
        0x0000000000000000000000000000000000000001;

    uint8 public constant PRICE_PRECISION_DIGITS = 6;
    uint256 public constant PRICE_PRECISION_FACTOR = 10**PRICE_PRECISION_DIGITS;

    function convertPricePrecision(
        uint256 price,
        uint256 currentPrecision,
        uint256 desiredPrecision
    ) internal pure returns (uint256) {
        if (currentPrecision > desiredPrecision)
            return (price / (currentPrecision / desiredPrecision));
        else if (currentPrecision < desiredPrecision)
            return price * (desiredPrecision / currentPrecision);
        else return price;
    }

    function calculateMintAmount(
        TokenDesc[] memory tokenDescs,
        uint256 investableTokenSupply
    ) internal pure returns (uint256) {
        if (investableTokenSupply == 0) {
            uint256 res = 1;
            for (uint256 i = 0; i < tokenDescs.length; i++)
                res *= tokenDescs[i].acquired;
            return Math.sqrt(res);
        } else {
            uint256 res = type(uint256).max;
            for (uint256 i = 0; i < tokenDescs.length; i++)
                res = Math.min(
                    res,
                    (tokenDescs[i].acquired * investableTokenSupply) /
                        tokenDescs[i].total
                );
            return res;
        }
    }

    function calculateMintAmount(
        uint256 totalAmountInvestedSoFar,
        uint256 amountInvestedNow,
        uint256 investableTokenSupplySoFar
    ) internal pure returns (uint256) {
        if (investableTokenSupplySoFar == 0) return amountInvestedNow;
        else
            return
                (amountInvestedNow * investableTokenSupplySoFar) /
                totalAmountInvestedSoFar;
    }
}
