//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../Common.sol";
import "../interfaces/IFee.sol";
import "../libraries/Math.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract FeeUpgradeable is Initializable, IFee {
    uint24 internal withdrawalFee;
    uint24 internal depositFee;
    uint24 internal performanceFee;
    uint256 internal currentAccumulatedFee;
    uint256 internal claimedFee;
    address internal feeReceiver;
    uint256[40] private futureFeaturesGap;

    // solhint-disable-next-line func-name-mixedcase
    function __FeeUpgradeable_init(
        uint24 depositFee_,
        NameValuePair[] calldata depositFeeParams_,
        uint24 withdrawalFee_,
        NameValuePair[] calldata withdrawFeeParams_,
        uint24 performanceFee_,
        NameValuePair[] calldata performanceFeeParams_,
        address feeReceiver_,
        NameValuePair[] calldata feeReceiverParams_
    ) internal onlyInitializing {
        setDepositFee(depositFee_, depositFeeParams_);
        setWithdrawalFee(withdrawalFee_, withdrawFeeParams_);
        setPerformanceFee(performanceFee_, performanceFeeParams_);
        setFeeReceiver(feeReceiver_, feeReceiverParams_);
    }

    modifier checkFee(uint24 fee) {
        if (fee >= uint256(100) * Math.SHORT_FIXED_DECIMAL_FACTOR)
            revert InvalidFeeError();

        _;
    }

    function getDepositFee(NameValuePair[] calldata)
        public
        view
        virtual
        override
        returns (uint24)
    {
        return depositFee;
    }

    function setDepositFee(uint24 fee, NameValuePair[] calldata params)
        public
        virtual
        override
        checkFee(fee)
    {
        depositFee = fee;
        emit DepositFeeChange(depositFee, params);
    }

    function getWithdrawalFee(NameValuePair[] calldata)
        public
        view
        virtual
        override
        returns (uint24)
    {
        return withdrawalFee;
    }

    function setWithdrawalFee(uint24 fee, NameValuePair[] calldata params)
        public
        virtual
        override
        checkFee(fee)
    {
        withdrawalFee = fee;
        emit WithdrawalFeeChange(withdrawalFee, params);
    }

    function getPerformanceFee(NameValuePair[] calldata)
        public
        view
        virtual
        override
        returns (uint24)
    {
        return performanceFee;
    }

    function setPerformanceFee(uint24 fee, NameValuePair[] calldata params)
        public
        virtual
        override
        checkFee(fee)
    {
        performanceFee = fee;
        emit PerformanceFeeChange(performanceFee, params);
    }

    function getFeeReceiver(NameValuePair[] calldata)
        external
        view
        virtual
        override
        returns (address)
    {
        return feeReceiver;
    }

    function setFeeReceiver(
        address feeReceiver_,
        NameValuePair[] calldata params
    ) public virtual override {
        feeReceiver = feeReceiver_;
        emit FeeReceiverChange(feeReceiver, params);
    }

    function getCurrentAccumulatedFee()
        public
        view
        virtual
        override
        returns (uint256)
    {
        return currentAccumulatedFee;
    }

    function getClaimedFee() public view virtual override returns (uint256) {
        return claimedFee;
    }

    function setClaimedFee(uint256 claimedFee_) internal virtual {
        claimedFee = claimedFee_;
    }

    function setCurrentAccumulatedFee(uint256 currentAccumulatedFee_)
        internal
        virtual
    {
        currentAccumulatedFee = currentAccumulatedFee_;
    }
}
