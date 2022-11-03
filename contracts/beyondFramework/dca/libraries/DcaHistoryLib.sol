//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

library DcaHistoryLib {
    struct HistoricalGauge {
        uint256 amountSpent;
        uint256 amountExchanged;
    }

    struct DcaHistory {
        HistoricalGauge[] gauges;
        uint256 current;
    }

    function addHistoricalGauge(
        DcaHistory storage history,
        uint256 amountSpent,
        uint256 amountExchanged
    ) internal {
        history.gauges.push(HistoricalGauge(amountSpent, amountExchanged));
        history.current++;
    }

    function increaseGaugeAt(
        DcaHistory storage history,
        uint256 rewards,
        uint256 index
    ) internal {
        history.gauges[index].amountExchanged += rewards;
    }

    function decreaseGaugeByIndex(
        DcaHistory storage history,
        uint256 index,
        uint256 amountSpent,
        uint256 amountExchanged
    ) internal {
        history.gauges[index].amountSpent -= amountSpent;
        history.gauges[index].amountExchanged -= amountExchanged;
    }

    function currentHistoricalIndex(DcaHistory storage history)
        internal
        view
        returns (uint256)
    {
        return history.current;
    }

    function gaugeByIndex(DcaHistory storage history, uint256 index)
        internal
        view
        returns (uint256, uint256)
    {
        require(index <= history.current, "InvestQueueLib: Out of bounds");
        return (
            history.gauges[index].amountSpent,
            history.gauges[index].amountExchanged
        );
    }
}
