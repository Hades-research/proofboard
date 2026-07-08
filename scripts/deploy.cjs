const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

// Deploys the ProofBoard contract to BOT Chain testnet and records the
// address + transaction hash under deployments/. Requires PRIVATE_KEY in .env.
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No signer available. Set PRIVATE_KEY in .env before deploying.");
  }

  console.log(`Deploying ProofBoard from ${deployer.address}…`);

  const factory = await hre.ethers.getContractFactory("ProofBoard");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction();
  const network = await hre.ethers.provider.getNetwork();

  const record = {
    project: "ProofBoard",
    contract: "ProofBoard",
    network: "Bohr / BOT Chain Testnet",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    address,
    transactionHash: tx ? tx.hash : null,
    explorerAddress: `https://scan.bohr.life/address/${address}`,
    explorerTransaction: tx ? `https://scan.bohr.life/tx/${tx.hash}` : null,
    deployedAt: new Date().toISOString()
  };

  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "bohr-testnet.json"),
    `${JSON.stringify(record, null, 2)}\n`
  );

  console.log("ProofBoard deployed.");
  console.log(`  Address:     ${record.address}`);
  console.log(`  Transaction: ${record.transactionHash}`);
  console.log(`  Explorer:    ${record.explorerAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
