// Contract ABIs and addresses
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as string;

export const FACTORY_ABI = [
  "function createCampaign(string memory _name, string memory _description, uint256 _goal, uint256 _duration) external",
  "function getUserCampaigns(address _user) external view returns(tuple(address campaignAddress, address owner, string name, uint256 creationTime)[])",
  "function getAllCampaigns() external view returns(tuple(address campaignAddress, address owner, string name, uint256 creationTime)[])",
  "function deleteCampaignFromFactory(address _campaignAddr) external",
  "function togglePause() external",
  "function paused() public view returns(bool)",
  "function owner() public view returns(address)",
  "function campaigns(uint256) public view returns(address campaignAddress, address owner, string memory name, uint256 creationTime)",
  "function userCampaigns(address, uint256) public view returns(address campaignAddress, address owner, string memory name, uint256 creationTime)",
  "event CampaignCreated(address indexed campaignAddress, address indexed owner, string name, uint256 creationTime)"
];

export const CROWDFUNDING_ABI = [
  "function name() public view returns(string)",
  "function description() public view returns(string)",
  "function goal() public view returns(uint256)",
  "function deadline() public view returns(uint256)",
  "function owner() public view returns(address)",
  "function paused() public view returns(bool)",
  "function deleted() public view returns(bool)",
  "function state() public view returns(uint8)",
  "function fund(uint256 _tierIndex) public payable",
  "function addTier(string memory _name, uint256 _amount) public",
  "function removeTier(uint256 _index) public",
  "function withdraw() public",
  "function emergencyWithdraw() public",
  "function getContractBalance() public view returns(uint256)",
  "function refund() public",
  "function deleteCampaign() public",
  "function updateCampaignDetails(string memory _newName, string memory _newDescription, uint256 _newGoal) public",
  "function extendDeadline(uint256 _extendedDays) public",
  "function hasFundedTier(address _backer, uint256 _tierIndex) public view returns(bool)",
  "function getTiers() public view returns(tuple(string name, uint256 amount, uint256 backers)[])",
  "function togglePause() public",
  "function getCampaignStatus() public view returns(uint8)",
  "function tiers(uint256) public view returns(string memory name, uint256 amount, uint256 backers)",
  "function backers(address) public view returns(uint256 totalContribution)",
  "event CampaignDeleted(address indexed by)",
  "event CampaignDetailsUpdated(string newName, string newDescription, uint256 newGoal)",
  "event CampaignPaused(bool paused)",
  "event CampaignStateChanged(uint8 newState)",
  "event DeadlineExtended(uint256 newDeadline)",
  "event EmergencyWithdraw(address indexed owner, uint256 amount)",
  "event FundReceived(address indexed backer, uint256 amount, uint256 tierIndex)",
  "event FundsWithdrawn(address indexed owner, uint256 amount)",
  "event RefundIssued(address indexed backer, uint256 amount)",
  "event TierAdded(string name, uint256 amount)",
  "event TierRemoved(uint256 index)"
];

export enum CampaignState {
  Active = 0,
  Successful = 1,
  Failed = 2
}