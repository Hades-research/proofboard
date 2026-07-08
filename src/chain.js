import deployment from "../deployments/bohr-testnet.json";
import { ethers } from "ethers";
import { ensureBohrNetwork, getWalletProvider } from "./wallet";

export const CONTRACT_ADDRESS = deployment.address;
export const EXPLORER_URL = deployment.explorerAddress;
export const RPC_URL = "https://rpc.bohr.life";

export const ABI = [
  "function nextProjectId() view returns (uint256)",
  "function milestoneCount() view returns (uint256)",
  "function projects(uint256) view returns (address owner,string name,string description,bool exists)",
  "function getMilestone(uint256 milestoneId) view returns (tuple(uint256 projectId,string title,string status,bytes32 metadataHash,uint256 timestamp))",
  "function registerProject(string name,string description) returns (uint256)",
  "function addMilestone(uint256 projectId,string title,string status,bytes32 metadataHash) returns (uint256)"
];

function readProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export async function getContract(write = false) {
  if (!write) {
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider());
  }
  const walletProvider = getWalletProvider();
  await ensureBohrNetwork(walletProvider);
  const provider = new ethers.BrowserProvider(walletProvider);
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, await provider.getSigner());
}

// Hash arbitrary evidence text/link into the bytes32 metadata field stored on-chain.
export function hashEvidence(text) {
  return ethers.id(text || "");
}

// Read every registered project and every milestone, then group milestones by project.
// Returns { projects: [{ id, owner, name, description, milestones: [...] }], totals }.
export async function loadBoard() {
  const contract = await getContract();
  const [nextIdRaw, msCountRaw] = await Promise.all([
    contract.nextProjectId(),
    contract.milestoneCount()
  ]);

  const nextId = Number(nextIdRaw);
  const msCount = Number(msCountRaw);

  const projectIds = [];
  for (let id = 1; id < nextId; id++) projectIds.push(id);

  const projectRecords = await Promise.all(
    projectIds.map((id) => contract.projects(id))
  );

  const milestoneRecords = await Promise.all(
    Array.from({ length: msCount }, (_, i) => contract.getMilestone(i))
  );

  const byProject = new Map();
  milestoneRecords.forEach((m, milestoneId) => {
    const pid = Number(m.projectId);
    if (!byProject.has(pid)) byProject.set(pid, []);
    byProject.get(pid).push({
      milestoneId,
      projectId: pid,
      title: m.title,
      status: m.status,
      metadataHash: m.metadataHash,
      timestamp: Number(m.timestamp)
    });
  });

  const projects = projectIds
    .map((id, i) => ({ id, record: projectRecords[i] }))
    .filter(({ record }) => record.exists)
    .map(({ id, record }) => ({
      id,
      owner: record.owner,
      name: record.name,
      description: record.description,
      milestones: (byProject.get(id) || []).sort((a, b) => a.timestamp - b.timestamp)
    }))
    .reverse(); // newest project first

  return {
    projects,
    totals: { projects: projects.length, milestones: msCount }
  };
}
