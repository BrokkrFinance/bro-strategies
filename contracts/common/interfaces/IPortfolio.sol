//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../interfaces/IInvestable.sol";

struct InvestableAllocation {
    IInvestable investableAddr;
    uint24 allocationPct;
}

interface IPortfolio is IInvestable {
    error InvestableAlreadyAdded();
    error InvestableNotYetAdded();
    error InvestableHasNonZeroAllocation();
    error RebalancePercentageNot100();
    error RebalanceIncorrectAllocationsLength();

    event InvestableAdd(IInvestable investable);
    event InvestableRemove(IInvestable investable);
    event TargetInvestableAllocationsSet(uint256[] newAllocations);
    event Rebalance();

    function addInvestable(IInvestable investable) external;

    function removeInvestable(IInvestable investable) external;

    function setTargetInvestableAllocations(uint256[] calldata newAllocations)
        external;

    function rebalance(
        NameValuePair[][] calldata depositParams,
        NameValuePair[][] calldata withdrawParams
    ) external;

    function getTargetInvestableAllocations()
        external
        view
        returns (InvestableAllocation[] memory investableAllocations);
}
