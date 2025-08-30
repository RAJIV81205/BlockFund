// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract CrowdFunding {
    string public name;
    string public description;
    uint256 public goal;
    uint256 public deadline;
    address public owner;
    bool public paused;
    bool public deleted;

    enum CampaignState {
        Active,
        Successful,
        Failed
    }
    CampaignState public state;

    struct Tier {
        string name;
        uint256 amount;
        uint256 backers;
    }

    struct Backer {
        uint256 totalContribution;
        mapping(uint256 => bool) fundedTier;
    }

    Tier[] public tiers;
    mapping(address => Backer) public backers;

    // Events
    event FundReceived(address indexed backer, uint256 amount, uint256 tierIndex);
    event CampaignStateChanged(CampaignState newState);
    event TierAdded(string name, uint256 amount);
    event TierRemoved(uint256 index);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event RefundIssued(address indexed backer, uint256 amount);
    event CampaignPaused(bool paused);
    event DeadlineExtended(uint256 newDeadline);
    event CampaignDetailsUpdated(string newName, string newDescription, uint256 newGoal);
    event CampaignDeleted(address indexed by);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "You're not the owner");
        _;
    }

    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier campaignOpen() {
        require(state == CampaignState.Active, "Campaign is not active");
        _;
    }

    modifier notDeleted() {
        require(!deleted, "Campaign has been deleted");
        _;
    }

    constructor(
        address _owner,
        string memory _name,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) {
        name = _name;
        description = _description;
        goal = _goal;
        deadline = block.timestamp + (_duration * 1 days);
        owner = _owner;
        state = CampaignState.Active;
        deleted = false;
    }

    // ---------------- Core Functions ---------------- //

    function fund(uint256 _tierIndex) public payable campaignOpen notPaused notDeleted {
        require(_tierIndex < tiers.length, "Invalid Tier");
        require(msg.value == tiers[_tierIndex].amount, "Incorrect Amount");

        tiers[_tierIndex].backers++;
        backers[msg.sender].totalContribution += msg.value;
        backers[msg.sender].fundedTier[_tierIndex] = true;

        emit FundReceived(msg.sender, msg.value, _tierIndex);
        checkAndUpdateCampaign();
    }

    function withdraw() public onlyOwner notDeleted {
        checkAndUpdateCampaign();
        require(state == CampaignState.Successful, "Campaign not successful");

        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        emit FundsWithdrawn(owner, balance);
        payable(owner).transfer(balance);
    }

    function refund() public notDeleted {
        checkAndUpdateCampaign();
        uint256 amount = backers[msg.sender].totalContribution;
        require(amount > 0, "No contributions");
        backers[msg.sender].totalContribution = 0;

        emit RefundIssued(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    // ---------------- New Features ---------------- //

    /// @notice Update campaign details (only while Active)
    function updateCampaignDetails(
        string memory _newName,
        string memory _newDescription,
        uint256 _newGoal
    ) external onlyOwner notDeleted campaignOpen {
        require(_newGoal > 0, "Goal must be > 0");
        name = _newName;
        description = _newDescription;
        goal = _newGoal;

        emit CampaignDetailsUpdated(_newName, _newDescription, _newGoal);
    }

    /// @notice Soft delete campaign (cannot be funded anymore)
    function deleteCampaign() external onlyOwner notDeleted {
        deleted = true;
        state = CampaignState.Failed; // mark failed to enable refunds
        emit CampaignDeleted(msg.sender);
    }

    /// @notice Emergency withdraw funds regardless of state
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available");

        emit EmergencyWithdraw(owner, balance);
        payable(owner).transfer(balance);
    }

    // ---------------- Helpers ---------------- //

    function checkAndUpdateCampaign() internal {
        if (state == CampaignState.Active) {
            CampaignState newState;
            if (block.timestamp >= deadline) {
                newState = address(this).balance >= goal
                    ? CampaignState.Successful
                    : CampaignState.Failed;
            } else {
                newState = address(this).balance >= goal
                    ? CampaignState.Successful
                    : CampaignState.Active;
            }

            if (newState != state) {
                state = newState;
                emit CampaignStateChanged(newState);
            }
        }
    }

    function addTier(string memory _name, uint256 _amount) public onlyOwner notDeleted {
        require(_amount > 0, "Amount must be greater than 0");
        tiers.push(Tier(_name, _amount, 0));
        emit TierAdded(_name, _amount);
    }

    function removeTier(uint256 _index) public onlyOwner notDeleted {
        require(_index < tiers.length, "Tier doesn't exist");
        tiers[_index] = tiers[tiers.length - 1];
        tiers.pop();
        emit TierRemoved(_index);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function hasFundedTier(address _backer, uint256 _tierIndex) public view returns (bool) {
        return backers[_backer].fundedTier[_tierIndex];
    }

    function getTiers() public view returns (Tier[] memory) {
        return tiers;
    }

    function togglePause() public onlyOwner {
        paused = !paused;
        emit CampaignPaused(paused);
    }

    function extendDeadline(uint256 _extendedDays) public onlyOwner campaignOpen notDeleted {
        deadline += _extendedDays * 1 days;
        emit DeadlineExtended(deadline);
    }

    function getCampaignStatus() public view returns (CampaignState) {
        if (deleted) return CampaignState.Failed;
        if (state == CampaignState.Active && block.timestamp < deadline) {
            return address(this).balance >= goal
                ? CampaignState.Successful
                : CampaignState.Active;
        }
        return state;
    }
}
