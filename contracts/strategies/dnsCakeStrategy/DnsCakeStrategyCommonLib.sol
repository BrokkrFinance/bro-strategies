// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;
import "../../dependencies/venus/VenusErrors.sol";
import "../../dependencies/pancakeswap/IPancakeMasterChefV2.sol";
import "../../dependencies/venus/IVToken.sol";

uint256 constant VENUS_FIXED_DECIMAL_FACTOR = 10**18;

library DnsCakeStrategyCommonLib {
    error VenusError(uint256 errorCode);

    function expectNoVenusError(uint256 errorCode) internal pure {
        if (errorCode != uint256(VenusErrors.NO_ERROR)) {
            revert VenusError(errorCode);
        }
    }

    function masterChefBalanceOf(
        address user,
        IPancakeMasterChefV2 masterChef,
        uint256 farmId
    ) internal view returns (uint256) {
        UserInfo memory userInfoStruct = masterChef.userInfo(farmId, user);
        return userInfoStruct.amount;
    }

    function getCurrentLendingPoolBorrowBalance(
        IVToken lendingPoolMarket,
        address account
    ) internal view returns (uint256 borrowBalance) {
        (, , borrowBalance, ) = lendingPoolMarket.getAccountSnapshot(account);
    }
}
