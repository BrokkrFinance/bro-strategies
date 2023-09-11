// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

struct NameValuePair {
    address key;
    bytes value;
}

struct RoleToUsers {
    bytes32 role;
    address[] users;
}

error NameValuePairNotFound(address investableAddress);

function expectToFindNameValuePairIndex(
    address investableAddress,
    NameValuePair[] memory nameValuePairs
) pure returns (uint256 index) {
    uint256 nameValuePairsLength = nameValuePairs.length;
    for (uint256 i = 0; i < nameValuePairsLength; ++i) {
        if (nameValuePairs[i].key == investableAddress) {
            return i;
        }
    }

    revert NameValuePairNotFound(investableAddress);
}
