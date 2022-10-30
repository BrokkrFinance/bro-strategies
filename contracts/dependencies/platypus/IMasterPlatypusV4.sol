// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IMasterPlatypusV4 {
    struct UserInfo {
        uint128 amount; // How many LP tokens the user has provided.
        uint128 factor;
        uint128 rewardDebt;
        uint128 claimablePtp;
    }

    function deposit(uint256 _pid, uint256 _amount)
        external
        returns (uint256 reward, uint256[] memory additionalRewards);

    function multiClaim(uint256[] memory _pids)
        external
        returns (
            uint256 reward,
            uint256[] memory amounts,
            uint256[][] memory additionalRewards
        );

    function withdraw(uint256 _pid, uint256 _amount)
        external
        returns (uint256 reward, uint256[] memory additionalRewards);

    function getUserInfo(uint256 _pid, address _user)
        external
        view
        returns (UserInfo memory);
}
