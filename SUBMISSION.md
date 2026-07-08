# ProofBoard — Submission

## Project
**ProofBoard** — an on-chain, tamper-proof proof-of-progress ledger for teams. Register a
project, then append milestones (each carrying a hashed piece of evidence) to build a public
build log that grant reviewers, DAOs, and backers can verify instead of trust.

## Track
**Open**

## Summary
Grant and accountability reporting today runs on screenshots and good faith. ProofBoard turns
progress into a cryptographic record: a team registers a project on BOT Chain, then appends
milestones one at a time. Each milestone stores a title, a status, a `block.timestamp`, and a
`bytes32` hash of its evidence (a PR link, demo URL, or report — hashed client-side so the raw
text never leaves the browser). Milestones are append-only and owner-gated, so a project's
history can be extended but never quietly rewritten. Anyone can read the full timeline of any
project over public RPC — no wallet, login, or backend required. The contract *is* the database.

## Deployed contract (BOT Chain testnet)
- **Live app:** https://proofboard-gamma.vercel.app/
- **Network:** Bohr / BOT Chain Testnet
- **Chain ID:** `968`
- **RPC:** `https://rpc.bohr.life`
- **Explorer:** `https://scan.bohr.life`
- **Contract address:** `0xb8F5E9902136170aD1f5960b9e33F45972AcDa90`
- **Transaction hash:** `0xba3ca4b74f3baf333bc635c7de54966e75f792ee02b684c71a6d4da2257ad43b`
- Explorer: https://scan.bohr.life/address/0xb8F5E9902136170aD1f5960b9e33F45972AcDa90

## Technical write-up
**How it uses BOT Chain — immutable milestone attestations.** The `ProofBoard` contract keeps
a mapping of projects (owner, name, description) and a single append-only `Milestone[]` array.
`registerProject` mints a sequential project ID and records the caller as owner. `addMilestone`
is guarded by an `onlyProjectOwner` modifier, so only the wallet that created a project can
extend its timeline; it pushes a `Milestone { projectId, title, status, metadataHash, timestamp }`
and emits `MilestoneAdded`. Because the array is push-only and every entry is stamped with
`block.timestamp`, the on-chain history is monotonic — nothing can be edited or deleted. The
`metadataHash` is a `bytes32` commitment to off-chain evidence, giving verifiable integrity
without putting sensitive content on-chain.

**Frontend.** React 18 + Vite + ethers v6, no external CDNs (fully offline-capable once built).
Evidence is hashed with `ethers.id()` in the browser before submission. Reads fan out
`nextProjectId()` + `milestoneCount()` and reconstruct each project's milestone timeline
client-side over public RPC — so the build log renders with no wallet connected. Writes go
through an injected EVM wallet (MetaMask, Rabby, OKX, Coinbase) via EIP-6963 discovery. The app
detects the connected chain, offers to add/switch to BOT Chain testnet (968), shows a
wrong-network banner, and reacts live to `accountsChanged` / `chainChanged`. Graceful loading,
empty, RPC-error, and unconnected states throughout. Bright teal SaaS milestone-timeline UI —
a public-roadmap feel, deliberately not a dark dApp.

**Contract interface**
```
registerProject(string name, string description)                    → uint256 projectId
addMilestone(uint256 projectId, string title, string status, bytes32 metadataHash)  → uint256 (owner-only)
nextProjectId() view   → uint256
milestoneCount() view  → uint256
projects(uint256) view → (owner, name, description, exists)
getMilestone(uint256) view → Milestone tuple
```

## Next steps
- Store an event-derived on-chain link so each milestone card deep-links to its own tx on the explorer.
- Optional IPFS pinning: keep the on-chain hash, add a resolvable pointer to the evidence file.
- Milestone reactions / attestations from third parties (e.g. a grant committee co-signs "verified").
- ENS / profile resolution for project owners instead of raw addresses.
- Project-level filters and a shareable per-project permalink for embedding in grant applications.

## Draft X tweet
> Shipped ProofBoard on @BOTChain_ai 🧾
>
> A public, tamper-proof build log for teams: register a project, append milestones, and every
> checkmark lands on-chain with a hashed proof + timestamp. Backers verify progress instead of
> trusting screenshots.
>
> Append-only. Owner-gated. No backend. #BOTChain
