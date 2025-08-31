import { ethers } from 'ethers';
import { FACTORY_ADDRESS, FACTORY_ABI, CROWDFUNDING_ABI } from './contracts';

interface Campaign {
  campaignAddress: string;
  owner: string;
  name: string;
  creationTime: number;
}

/**
 * Web3 Service for Crowdfunding DApp
 * 
 * LOCALHOST SETUP:
 * 1. Start Hardhat node: `npx hardhat node`
 * 2. Deploy contracts: `npx hardhat run scripts/deploy.js --network localhost`
 * 3. Add localhost network to MetaMask:
 *    - Network Name: Localhost 8545
 *    - RPC URL: http://127.0.0.1:8545
 *    - Chain ID: 31337
 *    - Currency Symbol: ETH
 * 4. Import Hardhat test accounts to MetaMask using private keys
 * 
 * The service will automatically detect localhost vs testnet based on contract address.
 */

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private eventListeners: Map<string, { contract: ethers.Contract; listener: (...args: unknown[]) => void }> = new Map();
  private factoryContract: ethers.Contract | null = null;
  private campaignContracts: Map<string, ethers.Contract> = new Map();

  async connectWallet(): Promise<string | null> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Check network
      const network = await this.provider.getNetwork();
      console.log('Connected to network:', network);
      console.log('Chain ID:', network.chainId);

      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }

  async reinitializeSigner(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
    } catch (error) {
      console.error('Failed to reinitialize signer:', error);
      this.provider = null;
      this.signer = null;
    }
  }

  async getAccount(): Promise<string | null> {
    if (!this.signer) {
      // Try to reinitialize if we don't have a signer
      if (window.ethereum) {
        try {
          await this.reinitializeSigner();
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }

    try {
      return await this.signer!.getAddress();
    } catch {
      // If getting address fails, try to reinitialize once more
      try {
        await this.reinitializeSigner();
        return await this.signer?.getAddress() || null;
      } catch {
        return null;
      }
    }
  }

  async getBalance(account: string): Promise<string | null> {
    try {
      if (!this.provider) {
        if (window.ethereum) {
          this.provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          throw new Error("MetaMask is not installed");
        }
      }

      const balanceWei = await this.provider.getBalance(account);
      return ethers.formatEther(balanceWei); // returns balance in ETH as string
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return null;
    }
  }



  async getFactoryContract() {
    if (!this.signer) {
      // Try to connect if not already connected
      if (window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
      } else {
        throw new Error('Wallet not connected');
      }
    }
    return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
  }

  async getCrowdFundingContract(address: string) {
    if (!this.signer) {
      // Try to connect if not already connected
      if (window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
      } else {
        throw new Error('Wallet not connected');
      }
    }
    return new ethers.Contract(address, CROWDFUNDING_ABI, this.signer);
  }

  async createCampaign(name: string, description: string, goal: string, duration: number) {
    const factory = await this.getFactoryContract();
    const goalWei = ethers.parseEther(goal);

    const tx = await factory.createCampaign(name, description, goalWei, duration);
    return await tx.wait();
  }

  async getAllCampaigns() {
    try {
      console.log('Factory Address:', FACTORY_ADDRESS);
      console.log('Factory ABI:', FACTORY_ABI);

      // Check if we're on the correct network first
      const isCorrectNetwork = await this.isOnCorrectNetwork();
      if (!isCorrectNetwork) {
        console.log('Wrong network detected, attempting to switch...');
        const switched = await this.switchToCorrectNetwork();
        if (!switched) {
          throw new Error('Please switch to the correct network (Holesky Testnet) to view campaigns');
        }
      }

      // Check if contract exists at the address
      const contractExists = await this.checkContractExists(FACTORY_ADDRESS);
      if (!contractExists) {
        throw new Error(`No contract found at address ${FACTORY_ADDRESS}. Please check if the contract is deployed.`);
      }

      // For read-only operations, we can use a provider without signer
      let contract;
      if (this.signer) {
        contract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        contract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      console.log('Contract instance created:', contract);
      console.log('Calling getAllCampaigns...');

      const campaigns = await contract.getAllCampaigns();
      console.log('Raw campaigns result:', campaigns);
      console.log('Campaigns length:', campaigns.length);

      // Handle empty campaigns array gracefully
      if (!campaigns || campaigns.length === 0) {
        console.log('No campaigns found - this is normal for a new deployment');
        return [];
      }

      return campaigns;
    } catch (error: unknown) {
      console.error('Error fetching campaigns:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name
        });
        
        // Provide more helpful error messages
        if (error.message.includes('could not decode result data')) {
          throw new Error('Unable to decode campaign data. This might be due to network issues or the contract returning empty data. Please ensure you are connected to the correct network (Holesky Testnet).');
        }
      }
      throw error;
    }
  }

  async getUserCampaigns(userAddress: string) {
    const factory = await this.getFactoryContract();
    return await factory.getUserCampaigns(userAddress);
  }

  async getCampaignDetails(campaignAddress: string) {
    try {
      // For read-only operations, we can use a provider without signer
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const [name, description, goal, deadline, owner, paused, state, balance] = await Promise.all([
        campaign.name(),
        campaign.description(),
        campaign.goal(),
        campaign.deadline(),
        campaign.owner(),
        campaign.paused(),
        campaign.state(),
        campaign.getContractBalance()
      ]);

      // Try to get tiers, fallback to empty array if function doesn't exist
      let tiers: Array<{ name: string; amount: string; backers: number }> = [];
      try {
        const tiersResult = await campaign.getTiers();
        tiers = tiersResult.map((tier: { name: string; amount: bigint; backers: bigint }) => ({
          name: tier.name,
          amount: ethers.formatEther(tier.amount),
          backers: Number(tier.backers)
        }));
      } catch {
        console.log('getTiers function not available, using empty tiers array');
        tiers = [];
      }

      return {
        name,
        description,
        goal: ethers.formatEther(goal),
        deadline: Number(deadline),
        owner,
        paused,
        state: Number(state),
        balance: ethers.formatEther(balance),
        tiers
      };
    } catch (error) {
      console.error('Error getting campaign details:', error);
      throw error;
    }
  }

  async fundCampaign(campaignAddress: string, tierIndex: number, amount: string) {
    try {
      console.log('=== FUNDING TRANSACTION ===');
      console.log('Campaign Address:', campaignAddress);
      console.log('Tier Index:', tierIndex);
      console.log('Amount:', amount);

      const campaign = await this.getCrowdFundingContract(campaignAddress);
      const amountWei = ethers.parseEther(amount);

      console.log('Amount in Wei:', amountWei.toString());
      console.log('Contract instance:', campaign.target);

      // Try to estimate gas first to catch errors early
      try {
        const gasEstimate = await campaign.fund.estimateGas(tierIndex, { value: amountWei });
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);

        // Try to get more specific error information
        try {
          await campaign.fund.staticCall(tierIndex, { value: amountWei });
        } catch (staticError: unknown) {
          console.error('Static call failed:', staticError);

          // Parse common error messages
          const errorMessage = staticError instanceof Error ? staticError.message : String(staticError);
          if (errorMessage.includes('Invalid Tier')) {
            throw new Error('Invalid tier index - this tier does not exist');
          } else if (errorMessage.includes('Incorrect Amount')) {
            throw new Error('Incorrect amount - must match the tier amount exactly');
          } else if (errorMessage.includes('Campaign is not active')) {
            throw new Error('Campaign is not active');
          } else if (errorMessage.includes('Contract is paused')) {
            throw new Error('Campaign is paused');
          } else {
            throw new Error(`Transaction would fail: ${errorMessage}`);
          }
        }
        throw gasError;
      }

      const tx = await campaign.fund(tierIndex, { value: amountWei });
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      return receipt;
    } catch (error) {
      console.error('Error in fundCampaign:', error);
      throw error;
    }
  }

  async addTier(campaignAddress: string, name: string, amount: string) {
    const campaign = await this.getCrowdFundingContract(campaignAddress);
    const amountWei = ethers.parseEther(amount);

    const tx = await campaign.addTier(name, amountWei);
    return await tx.wait();
  }

  async removeTier(campaignAddress: string, tierIndex: number) {
    const campaign = await this.getCrowdFundingContract(campaignAddress);

    const tx = await campaign.removeTier(tierIndex);
    return await tx.wait();
  }

  async withdrawFunds(campaignAddress: string) {
    const campaign = await this.getCrowdFundingContract(campaignAddress);

    const tx = await campaign.withdraw();
    return await tx.wait();
  }

  async refund(campaignAddress: string) {
    const campaign = await this.getCrowdFundingContract(campaignAddress);

    const tx = await campaign.refund();
    return await tx.wait();
  }

  async getBackerContribution(campaignAddress: string, backerAddress: string) {
    const campaign = await this.getCrowdFundingContract(campaignAddress);
    const contribution = await campaign.backers(backerAddress);
    return ethers.formatEther(contribution.totalContribution);
  }

  async hasFundedTier(campaignAddress: string, backerAddress: string, tierIndex: number) {
    const campaign = await this.getCrowdFundingContract(campaignAddress);
    return await campaign.hasFundedTier(backerAddress, tierIndex);
  }

  async toggleCampaignPause(campaignAddress: string) {
    const campaign = await this.getCrowdFundingContract(campaignAddress);

    const tx = await campaign.togglePause();
    return await tx.wait();
  }

  async extendDeadline(campaignAddress: string, days: number) {
    const campaign = await this.getCrowdFundingContract(campaignAddress);

    const tx = await campaign.extendDeadline(days);
    return await tx.wait();
  }

  // Additional utility methods for better contract interaction

  async getCampaignStatus(campaignAddress: string) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      return await campaign.getCampaignStatus();
    } catch (error) {
      console.error('Error getting campaign status:', error);
      throw error;
    }
  }

  async getTierByIndex(campaignAddress: string, tierIndex: number) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const tier = await campaign.tiers(tierIndex);
      return {
        name: tier.name,
        amount: ethers.formatEther(tier.amount),
        backers: Number(tier.backers)
      };
    } catch (error) {
      console.error('Error getting tier:', error);
      throw error;
    }
  }

  async getCampaignByIndex(index: number) {
    try {
      let factory;
      if (this.signer) {
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      return await factory.campaigns(index);
    } catch (error) {
      console.error('Error getting campaign by index:', error);
      throw error;
    }
  }

  async getUserCampaignByIndex(userAddress: string, index: number) {
    try {
      let factory;
      if (this.signer) {
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      return await factory.userCampaigns(userAddress, index);
    } catch (error) {
      console.error('Error getting user campaign by index:', error);
      throw error;
    }
  }

  async getFactoryOwner() {
    try {
      let factory;
      if (this.signer) {
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      return await factory.owner();
    } catch (error) {
      console.error('Error getting factory owner:', error);
      throw error;
    }
  }

  async isFactoryPaused() {
    try {
      let factory;
      if (this.signer) {
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      return await factory.paused();
    } catch (error) {
      console.error('Error checking factory pause status:', error);
      throw error;
    }
  }

  async toggleFactoryPause() {
    const factory = await this.getFactoryContract();
    const tx = await factory.togglePause();
    return await tx.wait();
  }

  // Enhanced funding method with better validation
  async fundCampaignWithValidation(campaignAddress: string, tierIndex: number, amount: string) {
    try {
      console.log('=== FUNDING VALIDATION ===');
      console.log('Campaign Address:', campaignAddress);
      console.log('Tier Index:', tierIndex);
      console.log('Amount:', amount);

      // First validate the campaign and tier
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      console.log('Campaign Details:', campaignDetails);

      if (campaignDetails.tiers.length === 0) {
        throw new Error('No funding tiers available. The campaign owner needs to add tiers first.');
      }

      if (campaignDetails.paused) {
        throw new Error('Campaign is paused');
      }

      if (campaignDetails.state !== 0) { // Not active
        throw new Error('Campaign is not active');
      }

      if (tierIndex >= campaignDetails.tiers.length) {
        throw new Error(`Invalid tier index. Available tiers: 0-${campaignDetails.tiers.length - 1}`);
      }

      const tier = campaignDetails.tiers[tierIndex];
      console.log('Selected Tier:', tier);

      if (parseFloat(amount) !== parseFloat(tier.amount)) {
        throw new Error(`Amount must be exactly ${tier.amount} ETH for this tier`);
      }

      // Check if user has enough balance (optional but helpful)
      const userAddress = await this.getAccount();
      if (userAddress && this.provider) {
        const balance = await this.provider.getBalance(userAddress);
        const balanceEth = parseFloat(ethers.formatEther(balance));
        const requiredEth = parseFloat(amount);

        if (balanceEth < requiredEth) {
          throw new Error(`Insufficient balance. You have ${balanceEth.toFixed(4)} ETH but need ${requiredEth} ETH`);
        }
      }

      console.log('Validation passed, proceeding with funding...');

      // Proceed with funding
      return await this.fundCampaign(campaignAddress, tierIndex, amount);
    } catch (error) {
      console.error('Error funding campaign with validation:', error);
      throw error;
    }
  }

  // Enhanced tier management methods
  async addTierWithValidation(campaignAddress: string, name: string, amount: string) {
    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error('Tier name cannot be empty');
      }

      if (parseFloat(amount) <= 0) {
        throw new Error('Tier amount must be greater than 0');
      }

      // Check if user is the owner
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      const userAddress = await this.getAccount();

      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      if (campaignDetails.owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('Only campaign owner can add tiers');
      }

      if (campaignDetails.state !== 0) {
        throw new Error('Cannot add tiers to inactive campaigns');
      }

      return await this.addTier(campaignAddress, name, amount);
    } catch (error) {
      console.error('Error adding tier with validation:', error);
      throw error;
    }
  }

  async removeTierWithValidation(campaignAddress: string, tierIndex: number) {
    try {
      // Check if user is the owner
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      const userAddress = await this.getAccount();

      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      if (campaignDetails.owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('Only campaign owner can remove tiers');
      }

      if (campaignDetails.state !== 0) {
        throw new Error('Cannot remove tiers from inactive campaigns');
      }

      if (tierIndex >= campaignDetails.tiers.length) {
        throw new Error('Invalid tier index');
      }

      const tier = campaignDetails.tiers[tierIndex];
      if (tier.backers > 0) {
        throw new Error('Cannot remove tier that has backers');
      }

      return await this.removeTier(campaignAddress, tierIndex);
    } catch (error) {
      console.error('Error removing tier with validation:', error);
      throw error;
    }
  }

  // Campaign management helpers
  async canWithdraw(campaignAddress: string): Promise<boolean> {
    try {
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      const userAddress = await this.getAccount();

      if (!userAddress) return false;
      if (campaignDetails.owner.toLowerCase() !== userAddress.toLowerCase()) return false;
      if (campaignDetails.state !== 1) return false; // Not successful
      if (parseFloat(campaignDetails.balance) <= 0) return false;

      return true;
    } catch (error) {
      console.error('Error checking withdraw eligibility:', error);
      return false;
    }
  }

  async canRefund(campaignAddress: string): Promise<boolean> {
    try {
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      const userAddress = await this.getAccount();

      if (!userAddress) return false;
      if (campaignDetails.state !== 2) return false; // Not failed

      const contribution = await this.getBackerContribution(campaignAddress, userAddress);
      return parseFloat(contribution) > 0;
    } catch (error) {
      console.error('Error checking refund eligibility:', error);
      return false;
    }
  }

  async getCampaignProgress(campaignAddress: string): Promise<number> {
    try {
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      const progress = (parseFloat(campaignDetails.balance) / parseFloat(campaignDetails.goal)) * 100;
      return Math.min(progress, 100);
    } catch (error) {
      console.error('Error calculating campaign progress:', error);
      return 0;
    }
  }

  async getTimeRemaining(campaignAddress: string): Promise<number> {
    try {
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      const now = Math.floor(Date.now() / 1000);
      const remaining = campaignDetails.deadline - now;
      return Math.max(remaining, 0);
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 0;
    }
  }

  async checkContractExists(address: string): Promise<boolean> {
    try {
      let provider;
      if (this.provider) {
        provider = this.provider;
      } else if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const code = await provider.getCode(address);
      console.log('Contract code at', address, ':', code);
      return code !== '0x';
    } catch (error) {
      console.error('Error checking contract:', error);
      return false;
    }
  }

  async getCurrentNetwork() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      return parseInt(chainId, 16);
    } catch (error) {
      console.error('Error getting current network:', error);
      return null;
    }
  }

  async switchToCorrectNetwork(): Promise<boolean> {
    // Detect which network to use based on the factory address
    const factoryAddress = FACTORY_ADDRESS.toLowerCase();

    console.log('Factory Address:', factoryAddress);

    // Hardhat localhost default address
    if (factoryAddress === '0x5fbdb2315678afecb367f032d93f642f64180aa3') {
      console.log('Detected localhost deployment, switching to localhost network...');
      return await this.switchToLocalhost();
    }
    // Holesky deployment (current address)
    else if (factoryAddress === '0xe68969f12595a6155d85e33f6ea900eca206b2d8') {
      console.log('Detected Holesky deployment, switching to Holesky network...');
      return await this.switchToHolesky();
    }
    // Legacy Holesky deployment
    else if (factoryAddress === '0x0e88327fb445393a674194740535175c1cbf1c26') {
      console.log('Detected legacy Holesky deployment, switching to Holesky network...');
      return await this.switchToHolesky();
    }
    // Default to Holesky for production
    else {
      console.log('Unknown deployment, defaulting to Holesky network...');
      return await this.switchToHolesky();
    }
  }


  async isOnCorrectNetwork(): Promise<boolean> {
    try {
      const currentNetwork = await this.getCurrentNetwork();
      const factoryAddress = FACTORY_ADDRESS.toLowerCase();

      // Check if we're on the right network for the deployment
      if (factoryAddress === '0x5fbdb2315678afecb367f032d93f642f64180aa3') {
        return currentNetwork === 31337; // Localhost
      } else if (factoryAddress === '0xe68969f12595a6155d85e33f6ea900eca206b2d8' || 
                 factoryAddress === '0x0e88327fb445393a674194740535175c1cbf1c26') {
        return currentNetwork === 17000; // Holesky
      }

      // Default to Holesky for production
      return currentNetwork === 17000;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  async switchToLocalhost(): Promise<boolean> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to localhost network (chain ID 31337)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
      return true;
    } catch (switchError: unknown) {
      // If the chain hasn't been added to MetaMask, add it
      const error = switchError as { code?: number };
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69', // 31337 in hex
                chainName: 'Localhost 8545',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://127.0.0.1:8545'],
                blockExplorerUrls: null,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add localhost network:', addError);
          return false;
        }
      } else {
        console.error('Failed to switch to localhost network:', switchError);
        return false;
      }
    }
  }

  // Keep the old method for backward compatibility but rename it
  async switchToHolesky(): Promise<boolean> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to Holesky testnet (chain ID 17000)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x4268' }], // 17000 in hex
      });
      return true;
    } catch (switchError: unknown) {
      // If the chain hasn't been added to MetaMask, add it
      const error = switchError as { code?: number };
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x4268', // 17000 in hex
                chainName: 'Holesky Testnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://ethereum-holesky.publicnode.com'],
                blockExplorerUrls: ['https://holesky.etherscan.io/'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Holesky network:', addError);
          return false;
        }
      } else {
        console.error('Failed to switch to Holesky network:', switchError);
        return false;
      }
    }
  }

  // New campaign management methods
  async deleteCampaign(campaignAddress: string) {
    try {
      const campaign = await this.getCrowdFundingContract(campaignAddress);
      const userAddress = await this.getAccount();

      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      // Check if user is the owner
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      if (campaignDetails.owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('Only campaign owner can delete the campaign');
      }

      const tx = await campaign.deleteCampaign();
      return await tx.wait();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  async updateCampaignDetails(campaignAddress: string, newName: string, newDescription: string, newGoal: string) {
    try {
      const campaign = await this.getCrowdFundingContract(campaignAddress);
      const userAddress = await this.getAccount();

      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      // Check if user is the owner
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      if (campaignDetails.owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('Only campaign owner can update campaign details');
      }

      if (campaignDetails.state !== 0) {
        throw new Error('Cannot update details of inactive campaigns');
      }

      const goalWei = ethers.parseEther(newGoal);
      const tx = await campaign.updateCampaignDetails(newName, newDescription, goalWei);
      return await tx.wait();
    } catch (error) {
      console.error('Error updating campaign details:', error);
      throw error;
    }
  }

  async emergencyWithdraw(campaignAddress: string) {
    try {
      const campaign = await this.getCrowdFundingContract(campaignAddress);
      const userAddress = await this.getAccount();

      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      // Check if user is the owner
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      if (campaignDetails.owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('Only campaign owner can perform emergency withdrawal');
      }

      const tx = await campaign.emergencyWithdraw();
      return await tx.wait();
    } catch (error) {
      console.error('Error performing emergency withdrawal:', error);
      throw error;
    }
  }

  async isCampaignDeleted(campaignAddress: string): Promise<boolean> {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      return await campaign.deleted();
    } catch (error) {
      console.error('Error checking if campaign is deleted:', error);
      return false;
    }
  }

  async deleteCampaignFromFactory(campaignAddress: string) {
    try {
      const factory = await this.getFactoryContract();
      const userAddress = await this.getAccount();

      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      // Check if user is the campaign owner
      const campaignDetails = await this.getCampaignDetails(campaignAddress);
      if (campaignDetails.owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('Only campaign owner can delete the campaign from factory');
      }

      const tx = await factory.deleteCampaignFromFactory(campaignAddress);
      return await tx.wait();
    } catch (error) {
      console.error('Error deleting campaign from factory:', error);
      throw error;
    }
  }

  // Event listening methods for real-time updates
  async listenForCampaignCreated(callback: (campaignData: {
    campaignAddress: string;
    owner: string;
    name: string;
    creationTime: number;
  }) => void) {
    try {
      // Check if we're on the correct network first
      const isCorrectNetwork = await this.isOnCorrectNetwork();
      if (!isCorrectNetwork) {
        console.warn('Not on correct network, event listening may not work properly');
      }

      let factory;
      if (this.signer) {
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (campaignAddress: string, owner: string, name: string, timestamp: bigint) => {
        console.log('CampaignCreated event received:', {
          campaignAddress,
          owner,
          name,
          creationTime: Number(timestamp)
        });
        
        callback({
          campaignAddress,
          owner,
          name,
          creationTime: Number(timestamp)
        });
      };

      factory.on("CampaignCreated", listener);
      this.eventListeners.set('CampaignCreated', { contract: factory, listener: listener as (...args: unknown[]) => void });
      
      console.log('Started listening for CampaignCreated events');
    } catch (error) {
      console.error('Error setting up CampaignCreated listener:', error);
    }
  }

  async listenForCampaignFunded(campaignAddress: string, callback: (fundingData: {
    backer: string;
    amount: string;
    tierIndex: number;
    campaignAddress: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (backer: string, amount: bigint, tierIndex: bigint) => {
        callback({
          backer,
          amount: ethers.formatEther(amount),
          tierIndex: Number(tierIndex),
          campaignAddress
        });
      };

      // Note: You'll need to add this event to your smart contract if it doesn't exist
      campaign.on("FundReceived", listener);
      this.eventListeners.set(`FundReceived_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for FundReceived events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up FundReceived listener:', error);
    }
  }

  async listenForCampaignStateChange(campaignAddress: string, callback: (stateData: {
    newState: number;
    campaignAddress: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (newState: bigint) => {
        callback({
          newState: Number(newState),
          campaignAddress
        });
      };

      // Note: You'll need to add this event to your smart contract if it doesn't exist
      campaign.on("CampaignStateChanged", listener);
      this.eventListeners.set(`CampaignStateChanged_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for CampaignStateChanged events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up CampaignStateChanged listener:', error);
    }
  }

  // New event listeners for the updated contract events
  async listenForCampaignDeleted(campaignAddress: string, callback: (deletionData: {
    deletedBy: string;
    campaignAddress: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (deletedBy: string) => {
        callback({
          deletedBy,
          campaignAddress
        });
      };

      campaign.on("CampaignDeleted", listener);
      this.eventListeners.set(`CampaignDeleted_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for CampaignDeleted events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up CampaignDeleted listener:', error);
    }
  }

  async listenForCampaignDetailsUpdated(campaignAddress: string, callback: (updateData: {
    newName: string;
    newDescription: string;
    newGoal: string;
    campaignAddress: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (newName: string, newDescription: string, newGoal: bigint) => {
        callback({
          newName,
          newDescription,
          newGoal: ethers.formatEther(newGoal),
          campaignAddress
        });
      };

      campaign.on("CampaignDetailsUpdated", listener);
      this.eventListeners.set(`CampaignDetailsUpdated_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for CampaignDetailsUpdated events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up CampaignDetailsUpdated listener:', error);
    }
  }

  async listenForDeadlineExtended(campaignAddress: string, callback: (extensionData: {
    newDeadline: number;
    campaignAddress: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (newDeadline: bigint) => {
        callback({
          newDeadline: Number(newDeadline),
          campaignAddress
        });
      };

      campaign.on("DeadlineExtended", listener);
      this.eventListeners.set(`DeadlineExtended_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for DeadlineExtended events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up DeadlineExtended listener:', error);
    }
  }

  async listenForTierAdded(campaignAddress: string, callback: (tierData: {
    name: string;
    amount: string;
    campaignAddress: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (name: string, amount: bigint) => {
        callback({
          name,
          amount: ethers.formatEther(amount),
          campaignAddress
        });
      };

      campaign.on("TierAdded", listener);
      this.eventListeners.set(`TierAdded_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for TierAdded events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up TierAdded listener:', error);
    }
  }

  async listenForTierRemoved(campaignAddress: string, callback: (tierData: {
    tierIndex: number;
    campaignAddress: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (tierIndex: bigint) => {
        callback({
          tierIndex: Number(tierIndex),
          campaignAddress
        });
      };

      campaign.on("TierRemoved", listener);
      this.eventListeners.set(`TierRemoved_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for TierRemoved events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up TierRemoved listener:', error);
    }
  }

  async listenForEmergencyWithdraw(campaignAddress: string, callback: (withdrawData: {
    owner: string;
    amount: string;
    campaignAddress: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (owner: string, amount: bigint) => {
        callback({
          owner,
          amount: ethers.formatEther(amount),
          campaignAddress
        });
      };

      campaign.on("EmergencyWithdraw", listener);
      this.eventListeners.set(`EmergencyWithdraw_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for EmergencyWithdraw events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up EmergencyWithdraw listener:', error);
    }
  }

  async listenForFundsWithdrawn(campaignAddress: string, callback: (withdrawData: {
    owner: string;
    amount: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (owner: string, amount: bigint) => {
        callback({
          owner,
          amount: ethers.formatEther(amount)
        });
      };

      campaign.on("FundsWithdrawn", listener);
      this.eventListeners.set(`FundsWithdrawn_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for FundsWithdrawn events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up FundsWithdrawn listener:', error);
    }
  }

  async listenForRefundIssued(campaignAddress: string, callback: (refundData: {
    backer: string;
    amount: string;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (backer: string, amount: bigint) => {
        callback({
          backer,
          amount: ethers.formatEther(amount)
        });
      };

      campaign.on("RefundIssued", listener);
      this.eventListeners.set(`RefundIssued_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for RefundIssued events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up RefundIssued listener:', error);
    }
  }

  async listenForCampaignPaused(campaignAddress: string, callback: (pauseData: {
    paused: boolean;
  }) => void) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const listener = (paused: boolean) => {
        callback({ paused });
      };

      campaign.on("CampaignPaused", listener);
      this.eventListeners.set(`CampaignPaused_${campaignAddress}`, { contract: campaign, listener: listener as (...args: unknown[]) => void });
      
      console.log(`Started listening for CampaignPaused events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up CampaignPaused listener:', error);
    }
  }

  // Comprehensive event listener setup for a campaign
  async listenForCampaignEvents(campaignAddress: string, callbacks: {
    onFundReceived?: (data: { backer: string; amount: string; tierIndex: number }) => void;
    onStateChanged?: (data: { newState: number }) => void;
    onTierAdded?: (data: { name: string; amount: string }) => void;
    onTierRemoved?: (data: { index: number }) => void;
    onWithdraw?: (data: { owner: string; amount: string }) => void;
    onRefund?: (data: { backer: string; amount: string }) => void;
    onPaused?: (data: { paused: boolean }) => void;
    onDeadlineExtended?: (data: { newDeadline: number }) => void;
    onDetailsUpdated?: (data: { name: string; description: string; goal: string }) => void;
    onDeleted?: (data: { by: string }) => void;
    onEmergencyWithdraw?: (data: { owner: string; amount: string }) => void;
  }) {
    try {
      // Set up individual event listeners using existing methods
      if (callbacks.onFundReceived) {
        await this.listenForCampaignFunded(campaignAddress, (data) => {
          callbacks.onFundReceived!(data);
        });
      }

      if (callbacks.onStateChanged) {
        await this.listenForCampaignStateChange(campaignAddress, (data: { newState: number; campaignAddress: string }) => {
          callbacks.onStateChanged!({ newState: data.newState });
        });
      }

      if (callbacks.onTierAdded) {
        await this.listenForTierAdded(campaignAddress, (data) => {
          callbacks.onTierAdded!(data);
        });
      }

      if (callbacks.onTierRemoved) {
        await this.listenForTierRemoved(campaignAddress, (data: { tierIndex: number; campaignAddress: string }) => {
          callbacks.onTierRemoved!({ index: data.tierIndex });
        });
      }

      if (callbacks.onWithdraw) {
        await this.listenForFundsWithdrawn(campaignAddress, (data: { owner: string; amount: string }) => {
          callbacks.onWithdraw!(data);
        });
      }

      if (callbacks.onRefund) {
        await this.listenForRefundIssued(campaignAddress, (data: { backer: string; amount: string }) => {
          callbacks.onRefund!(data);
        });
      }

      if (callbacks.onPaused) {
        await this.listenForCampaignPaused(campaignAddress, (data: { paused: boolean }) => {
          callbacks.onPaused!(data);
        });
      }

      if (callbacks.onDeadlineExtended) {
        await this.listenForDeadlineExtended(campaignAddress, (data) => {
          callbacks.onDeadlineExtended!(data);
        });
      }

      if (callbacks.onDetailsUpdated) {
        await this.listenForCampaignDetailsUpdated(campaignAddress, (data: { newName: string; newDescription: string; newGoal: string; campaignAddress: string }) => {
          callbacks.onDetailsUpdated!({
            name: data.newName,
            description: data.newDescription,
            goal: data.newGoal
          });
        });
      }

      if (callbacks.onDeleted) {
        await this.listenForCampaignDeleted(campaignAddress, (data: { deletedBy: string; campaignAddress: string }) => {
          callbacks.onDeleted!({ by: data.deletedBy });
        });
      }

      if (callbacks.onEmergencyWithdraw) {
        await this.listenForEmergencyWithdraw(campaignAddress, (data: { owner: string; amount: string; campaignAddress: string }) => {
          callbacks.onEmergencyWithdraw!({ owner: data.owner, amount: data.amount });
        });
      }

      console.log(`Set up comprehensive event listeners for campaign: ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up comprehensive campaign event listeners:', error);
    }
  }

  // Event listening methods for real-time updates
  // Remove specific event listener
  removeEventListener(eventKey: string) {
    const listenerData = this.eventListeners.get(eventKey);
    if (listenerData) {
      try {
        const eventName = eventKey.split('_')[0];
        listenerData.contract.removeListener(eventName, listenerData.listener);
        this.eventListeners.delete(eventKey);
        console.log(`Removed event listener: ${eventKey}`);
      } catch (error) {
        console.error(`Error removing listener ${eventKey}:`, error);
      }
    }
  }

  // Remove all event listeners for a specific campaign
  removeCampaignEventListeners(campaignAddress: string) {
    const keysToRemove = Array.from(this.eventListeners.keys()).filter(key => 
      key.includes(campaignAddress)
    );
    keysToRemove.forEach(key => this.removeEventListener(key));
  }

  // Remove all event listeners
  removeAllEventListeners() {
    this.eventListeners.forEach((listenerData, key) => {
      try {
        const eventName = key.split('_')[0];
        listenerData.contract.removeListener(eventName, listenerData.listener);
      } catch (error) {
        console.error(`Error removing listener ${key}:`, error);
      }
    });
    this.eventListeners.clear();
    console.log('Removed all event listeners');
  }

  // Get historical events
  async getHistoricalEvents(campaignAddress: string, eventName: string, fromBlock: number = 0) {
    try {
      let campaign;
      if (this.signer) {
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, this.signer);
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        campaign = new ethers.Contract(campaignAddress, CROWDFUNDING_ABI, provider);
      } else {
        throw new Error('No Ethereum provider available');
      }

      const filter = campaign.filters[eventName]();
      const events = await campaign.queryFilter(filter, fromBlock);
      return events;
    } catch (error) {
      console.error(`Error getting historical events for ${eventName}:`, error);
      return [];
    }
  }

  // Utility method to check if event listeners are active
  hasActiveListeners(): boolean {
    return this.eventListeners.size > 0;
  }

  // Get active listeners count
  getActiveListenersCount(): number {
    return this.eventListeners.size;
  }

  // --- Rest of your existing methods remain the same ---



  // Removed polling methods - these will now throw errors
  stopAllEventListeners() {
    console.warn('stopAllEventListeners is deprecated. Use removeAllEventListeners instead.');
    this.removeAllEventListeners();
  }

  // Updated cleanup method
  async refreshCampaignData(campaignAddress: string) {
    try {
      return await this.getCampaignDetails(campaignAddress);
    } catch (error) {
      console.error('Error refreshing campaign data:', error);
      return null;
    }
  }

  async checkForNewCampaigns(lastKnownCount: number): Promise<Campaign[]> {
    try {
      const allCampaigns = await this.getAllCampaigns();
      if (allCampaigns.length > lastKnownCount) {
        return allCampaigns.slice(lastKnownCount);
      }
      return [];
    } catch (error) {
      console.error('Error checking for new campaigns:', error);
      return [];
    }
  }
}

export const web3Service = new Web3Service();