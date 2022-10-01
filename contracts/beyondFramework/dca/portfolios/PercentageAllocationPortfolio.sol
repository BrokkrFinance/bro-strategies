//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IDcaPortfolio } from "../interfaces/IDcaPortfolio.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract PercentageAllocationPortfolio is
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    IDcaPortfolio
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable public depositToken;
    DcaEntry[] public strategies;

    address[] public portfolios;

    uint8 public investAmountSplit;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(DcaPortfolioInitArgs calldata portfolioArgs)
        external
        initializer
    {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        uint8 totalAllocation;
        for (uint256 i = 0; i < portfolioArgs.strategies.length; i++) {
            totalAllocation += portfolioArgs.strategies[i].allocationPercantage;
            if (
                portfolioArgs.strategies[i].dca.depositToken() !=
                portfolioArgs.depositToken
            ) {
                revert InvalidDepositToken();
            }

            strategies.push(portfolioArgs.strategies[i]);
        }

        if (totalAllocation != 100) {
            revert TotalAllocationIsNot100();
        }

        // strategies = portfolioArgs.strategies;
        depositToken = portfolioArgs.depositToken;
        investAmountSplit = portfolioArgs.investAmountSplit;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    modifier onlyPortfolio() {
        bool authorized;
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == _msgSender()) {
                authorized = true;
            }
        }

        require(authorized, "Unauthorized");
        _;
    }

    function deposit(uint256 amount, uint8) external nonReentrant {
        _deposit(_msgSender(), amount);
    }

    function depositFor(
        address sender,
        uint256 amount,
        uint8
    ) external onlyPortfolio nonReentrant {
        _deposit(sender, amount);
    }

    function _deposit(address sender, uint256 amount) private {
        depositToken.safeTransferFrom(_msgSender(), address(this), amount);

        for (uint256 i = 0; i < strategies.length; i++) {
            uint256 depositAmount = (amount / 100) *
                strategies[i].allocationPercantage;

            depositToken.safeApprove(address(strategies[i].dca), depositAmount);
            strategies[i].dca.depositFor(
                sender,
                depositAmount,
                investAmountSplit
            );
        }
    }

    function withdrawAll() external nonReentrant {
        _withdrawAll(_msgSender());
    }

    function withdrawAllFor(address sender)
        external
        onlyPortfolio
        nonReentrant
    {
        _withdrawAll(sender);
    }

    function _withdrawAll(address sender) private {
        for (uint256 i = 0; i < strategies.length; i++) {
            strategies[i].dca.withdrawAllFor(sender);
        }
    }

    function withdrawAll(uint256 positionIndex) external nonReentrant {
        _withdrawAll(_msgSender(), positionIndex);
    }

    function withdrawAllFor(address sender, uint256 positionIndex)
        external
        onlyPortfolio
        nonReentrant
    {
        _withdrawAll(sender, positionIndex);
    }

    function _withdrawAll(address sender, uint256 positionIndex) private {
        for (uint256 i = 0; i < strategies.length; i++) {
            strategies[i].dca.withdrawAllFor(sender, positionIndex);
        }
    }

    function withdrawBluechip() external nonReentrant {
        _withdrawBluechip(_msgSender());
    }

    function withdrawBluechipFor(address sender)
        external
        onlyPortfolio
        nonReentrant
    {
        _withdrawBluechip(sender);
    }

    function _withdrawBluechip(address sender) private {
        for (uint256 i = 0; i < strategies.length; i++) {
            strategies[i].dca.withdrawBluechipFor(sender);
        }
    }

    function withdrawBluechip(uint256 positionIndex) external nonReentrant {
        _withdrawBluechip(_msgSender(), positionIndex);
    }

    function withdrawBluechipFor(address sender, uint256 positionIndex)
        external
        onlyPortfolio
        nonReentrant
    {
        _withdrawBluechip(sender, positionIndex);
    }

    function _withdrawBluechip(address sender, uint256 positionIndex) private {
        for (uint256 i = 0; i < strategies.length; i++) {
            strategies[i].dca.withdrawBluechipFor(sender, positionIndex);
        }
    }

    // ----- Base Class Setters -----
    function addPortfolio(address newPortfolio) public virtual onlyOwner {
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == newPortfolio) {
                revert PortfolioAlreadyWhitelisted();
            }
        }
    }

    function removePortfolio(address portfolio) public virtual onlyOwner {
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == portfolio) {
                portfolios[i] = portfolios[portfolios.length - 1];
                portfolios.pop();

                return;
            }
        }

        revert PortfolioNotFound();
    }

    // ----- Pausable -----
    function pause() external onlyOwner {
        super._pause();
    }

    function unpause() external onlyOwner {
        super._unpause();
    }
}
// portfolio wont rebalance
// just invest tokens for the user - introduce depositFor/withdrawFor methods
