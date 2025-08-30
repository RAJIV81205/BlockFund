// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CrowdFunding} from "./CrowdFunding.sol";

contract CrowdFundingFactory {
    address public owner;
    bool public paused;

    struct Campaign {
        address campaignAddress;
        address owner;
        string name;
        uint256 creationTime;
    }

    Campaign[] public campaigns;

    mapping(address => Campaign[]) public userCampaigns;

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed owner,
        string name,
        uint256 creationTime
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not Owner");
        _;
    }

    modifier notPaused() {
        require(!paused, " Factory is Paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createCampaign(
        string memory _name,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) external notPaused {
        CrowdFunding newCampaign = new CrowdFunding(
            msg.sender,
            _name,
            _description,
            _goal,
            _duration
        );

        address campaignAddress = address(newCampaign);

        Campaign memory campaign = Campaign({
            campaignAddress: campaignAddress,
            owner: msg.sender,
            name: _name,
            creationTime: block.timestamp
        });

        campaigns.push(campaign);
        userCampaigns[msg.sender].push(campaign);
        emit CampaignCreated(
            campaignAddress,
            msg.sender,
            _name,
            block.timestamp
        );
    }

    function getUserCampaigns(address _user)
        external
        view
        returns (Campaign[] memory)
    {
        return userCampaigns[_user];
    }

    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }

    function togglePause() external onlyOwner {
        paused = !paused;
    }

    function deleteCampaignFromFactory(address _campaignAddr) external {
    // Check campaign exists in factory
    bool exists = false;
    uint256 idx;
    for (uint256 i = 0; i < campaigns.length; i++) {
        if (campaigns[i].campaignAddress == _campaignAddr) {
            exists = true;
            idx = i;
            break;
        }
    }
    require(exists, "Campaign not found");

  
    require(msg.sender == campaigns[idx].owner, "Not campaign owner");

   
    CrowdFunding(_campaignAddr).deleteCampaign();
}

}
