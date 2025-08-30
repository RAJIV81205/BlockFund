import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import dotenv from "dotenv";


dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.30",
      },
      production: {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    holesky: {
      type: "http",
      chainType: "l1",
      url: "https://17000.rpc.thirdweb.com",
      accounts: process.env.HOLESKY_PRIVATE_KEY
        ? [process.env.HOLESKY_PRIVATE_KEY]
        : [],
      chainId: 17000,
    },
  },
};

export default config;
