import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    // Polygon Amoy testnet (chain id 80002).
    // Secrets are read from the encrypted Hardhat keystore or environment
    // variables, never from this file:
    //   npx hardhat keystore set AMOY_RPC_URL
    //   npx hardhat keystore set AMOY_PRIVATE_KEY
    amoy: {
      type: "http",
      chainType: "generic",
      url: configVariable("AMOY_RPC_URL"),
      accounts: [configVariable("AMOY_PRIVATE_KEY")],
    },
  },
  verify: {
    etherscan: {
      // One Etherscan API key covers Amoy PolygonScan:
      //   npx hardhat keystore set ETHERSCAN_API_KEY
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
