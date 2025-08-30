import { ethers } from 'ethers';
import { FACTORY_ADDRESS, FACTORY_ABI, CROWDFUNDING_ABI } from './contracts';

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
  private eventListeners: Map<string, any> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;

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

      return campaigns;
    } catch (error: unknown) {
      console.error('Error fetching campaigns:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name
        });
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
        const tiersResult = await campaign.fetTiers();
        tiers = tiersResult.map((tier: { name: string; amount: bigint; backers: bigint }) => ({
          name: tier.name,
          amount: ethers.formatEther(tier.amount),
          backers: Number(tier.backers)
        }));
      } catch {
        console.log('fetTiers function not available, using empty tiers array');
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
    // Holesky deployment (your previous address)
    else if (factoryAddress === '0x0e88327fb445393a674194740535175c1cbf1c26') {
      console.log('Detected Holesky deployment, switching to Holesky network...');
      return await this.switchToHolesky();
    }
    // Default to localhost for development
    else {
      console.log('Unknown deployment, defaulting to localhost network...');
      return await this.switchToLocalhost();
    }
  }


  async isOnCorrectNetwork(): Promise<boolean> {
    try {
      const currentNetwork = await this.getCurrentNetwork();
      const factoryAddress = FACTORY_ADDRESS.toLowerCase();

      // Check if we're on the right network for the deployment
      if (factoryAddress === '0x5fbdb2315678afecb367f032d93f642f64180aa3') {
        return currentNetwork === 31337; // Localhost
      } else if (factoryAddress === '0x0e88327fb445393a674194740535175c1cbf1c26') {
        return currentNetwork === 17000; // Holesky
      }

      return false;
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

  // Event listening methods for real-time updates
  async listenForCampaignCreated(callback: (campaignData: any) => void) {
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

      const listener = (campaignAddress: string, owner: string, name: string, timestamp: bigint) => {
        callback({
          campaignAddress,
          owner,
          name,
          creationTime: Number(timestamp)
        });
      };

      factory.on("CampaignCreated", listener);
      this.eventListeners.set('CampaignCreated', { contract: factory, listener });
      
      console.log('Started listening for CampaignCreated events');
    } catch (error) {
      console.error('Error setting up CampaignCreated listener:', error);
    }
  }

  async listenForCampaignFunded(campaignAddress: string, callback: (fundingData: any) => void) {
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
      this.eventListeners.set(`FundReceived_${campaignAddress}`, { contract: campaign, listener });
      
      console.log(`Started listening for FundReceived events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up FundReceived listener:', error);
    }
  }

  async listenForCampaignStateChange(campaignAddress: string, callback: (stateData: any) => void) {
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
      this.eventListeners.set(`CampaignStateChanged_${campaignAddress}`, { contract: campaign, listener });
      
      console.log(`Started listening for CampaignStateChanged events on campaign ${campaignAddress}`);
    } catch (error) {
      console.error('Error setting up CampaignStateChanged listener:', error);
    }
  }

  // Polling method for campaigns that don't have events
  startPollingForUpdates(callback: (campaigns: any[]) => void, intervalMs: number = 30000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const campaigns = await this.getAllCampaigns();
        callback(campaigns);
      } catch (error) {
        console.error('Error polling for campaign updates:', error);
      }
    }, intervalMs);

    console.log(`Started polling for campaign updates every ${intervalMs}ms`);
  }

  stopPollingForUpdates() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Stopped polling for campaign updates');
    }
  }

  // Stop all event listeners
  stopAllEventListeners() {
    this.eventListeners.forEach((listenerData, key) => {
      try {
        listenerData.contract.removeListener(key.split('_')[0], listenerData.listener);
      } catch (error) {
        console.error(`Error removing listener ${key}:`, error);
      }
    });
    this.eventListeners.clear();
    this.stopPollingForUpdates();
    console.log('Stopped all event listeners');
  }

  // Method to refresh campaign data when events are received
  async refreshCampaignData(campaignAddress: string) {
    try {
      return await this.getCampaignDetails(campaignAddress);
    } catch (error) {
      console.error('Error refreshing campaign data:', error);
      return null;
    }
  }

  // Method to check for new campaigns periodically
  async checkForNewCampaigns(lastKnownCount: number): Promise<any[]> {
    try {
      const allCampaigns = await this.getAllCampaigns();
      if (allCampaigns.length > lastKnownCount) {
        // Return only the new campaigns
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