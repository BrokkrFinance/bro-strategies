//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IDcaPortfolio } from "../interfaces/IDcaPortfolio.sol";
import { IDcaStrategy } from "../interfaces/IDcaStrategy.sol";

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

    IDcaStrategy[] public activeStrategies;

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
        __UUPSUpgradeable_init();
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        for (uint256 i = 0; i < portfolioArgs.strategies.length; i++) {
            if (
                portfolioArgs.strategies[i].depositToken() !=
                portfolioArgs.depositToken
            ) {
                revert InvalidDepositToken();
            }

            if (portfolioArgs.strategies[i].isEmergencyExited()) {
                revert InvalidDcaInvestStatus();
            }

            activeStrategies.push(portfolioArgs.strategies[i]);
        }

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

    modifier checkEmergencyExited() {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            if (activeStrategies[i].isEmergencyExited()) {
                activeStrategies[i].withdrawAllFor(
                    _msgSender(),
                    false // this param affects nothing in this case
                );

                activeStrategies[i] = activeStrategies[
                    activeStrategies.length - 1
                ];
                activeStrategies.pop();
            }
        }

        _;
    }

    function deposit(uint256 amount, uint8)
        external
        nonReentrant
        checkEmergencyExited
    {
        _deposit(_msgSender(), amount);
    }

    function depositFor(
        address sender,
        uint256 amount,
        uint8
    ) external onlyPortfolio nonReentrant checkEmergencyExited {
        _deposit(sender, amount);
    }

    function _deposit(address sender, uint256 amount) private {
        depositToken.safeTransferFrom(_msgSender(), address(this), amount);

        uint256 perDcaDeposit = amount / activeStrategies.length;
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            depositToken.safeApprove(
                address(activeStrategies[i]),
                perDcaDeposit
            );
            activeStrategies[i].depositFor(
                sender,
                perDcaDeposit,
                investAmountSplit
            );
        }
    }

    function withdrawAll(bool convertBluechipIntoDepositAsset)
        external
        nonReentrant
        checkEmergencyExited
    {
        _withdrawAll(_msgSender(), convertBluechipIntoDepositAsset);
    }

    function withdrawAllFor(
        address sender,
        bool convertBluechipIntoDepositAsset
    ) external onlyPortfolio nonReentrant checkEmergencyExited {
        _withdrawAll(sender, convertBluechipIntoDepositAsset);
    }

    function _withdrawAll(address sender, bool convertBluechipIntoDepositAsset)
        private
    {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            activeStrategies[i].withdrawAllFor(
                sender,
                convertBluechipIntoDepositAsset
            );
        }
    }

    function withdrawAll(
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    ) external nonReentrant checkEmergencyExited {
        _withdrawAll(
            _msgSender(),
            positionIndex,
            convertBluechipIntoDepositAsset
        );
    }

    function withdrawAllFor(
        address sender,
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    ) external onlyPortfolio nonReentrant checkEmergencyExited {
        _withdrawAll(sender, positionIndex, convertBluechipIntoDepositAsset);
    }

    function _withdrawAll(
        address sender,
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    ) private {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            activeStrategies[i].withdrawAllFor(
                sender,
                positionIndex,
                convertBluechipIntoDepositAsset
            );
        }
    }

    function withdrawBluechip(bool convertBluechipIntoDepositAsset)
        external
        nonReentrant
        checkEmergencyExited
    {
        _withdrawBluechip(_msgSender(), convertBluechipIntoDepositAsset);
    }

    function withdrawBluechipFor(
        address sender,
        bool convertBluechipIntoDepositAsset
    ) external onlyPortfolio nonReentrant checkEmergencyExited {
        _withdrawBluechip(sender, convertBluechipIntoDepositAsset);
    }

    function _withdrawBluechip(
        address sender,
        bool convertBluechipIntoDepositAsset
    ) private {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            activeStrategies[i].withdrawBluechipFor(
                sender,
                convertBluechipIntoDepositAsset
            );
        }
    }

    function withdrawBluechip(
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    ) external nonReentrant checkEmergencyExited {
        _withdrawBluechip(
            _msgSender(),
            positionIndex,
            convertBluechipIntoDepositAsset
        );
    }

    function withdrawBluechipFor(
        address sender,
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    ) external onlyPortfolio nonReentrant checkEmergencyExited {
        _withdrawBluechip(
            sender,
            positionIndex,
            convertBluechipIntoDepositAsset
        );
    }

    function _withdrawBluechip(
        address sender,
        uint256 positionIndex,
        bool convertBluechipIntoDepositAsset
    ) private {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            activeStrategies[i].withdrawBluechipFor(
                sender,
                positionIndex,
                convertBluechipIntoDepositAsset
            );
        }
    }

    // ----- Base Class Setters -----
    function addPortfolio(address newPortfolio) external onlyOwner {
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == newPortfolio) {
                revert PortfolioAlreadyWhitelisted();
            }
        }

        portfolios.push(newPortfolio);
    }

    function removePortfolio(address portfolio) external onlyOwner {
        for (uint256 i = 0; i < portfolios.length; i++) {
            if (portfolios[i] == portfolio) {
                portfolios[i] = portfolios[portfolios.length - 1];
                portfolios.pop();

                return;
            }
        }

        revert PortfolioNotFound();
    }

    function addDca(IDcaStrategy newDca) external onlyOwner {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            if (activeStrategies[i] == newDca) {
                revert DcaAlreadyAdded();
            }
        }

        activeStrategies.push(newDca);
    }

    // ----- Pausable -----
    function pause() external onlyOwner {
        super._pause();
    }

    function unpause() external onlyOwner {
        super._unpause();
    }

    function equityValuation()
        external
        view
        returns (DcaEquityValuation[] memory)
    {
        DcaEquityValuation[] memory strategies = new DcaEquityValuation[](
            activeStrategies.length - 1
        );
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            strategies[i].dca = activeStrategies[i];
            strategies[i].totalDepositToken = activeStrategies[i]
                .depositTokenBalance();
            strategies[i].totalBluechipToken = activeStrategies[i]
                .bluechipTokenBalance();
        }

        return strategies;
    }

    function minDepositAmount()
        external
        view
        returns (uint256 totalMinDeposit)
    {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            totalMinDeposit += activeStrategies[i].minDepositAmount();
        }
    }
}
