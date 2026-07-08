require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const privateKey = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "contracts",
    artifacts: "artifacts",
    cache: "cache"
  },
  networks: {
    botTestnet: {
      url: process.env.BOT_TESTNET_RPC_URL || "https://rpc.bohr.life",
      chainId: 968,
      accounts: privateKey ? [privateKey] : []
    }
  }
};
