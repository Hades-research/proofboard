# ProofBoard

*The receipts, not the pitch deck.*

Teams love to tell you how much they've shipped. ProofBoard makes them **prove** it. A team
registers a project, then appends milestones one at a time — and every milestone lands on
BOT Chain as an append-only, timestamped record with a hash of its evidence baked in. You
can add to the story. You can't quietly rewrite it.

Think of it as a public roadmap where the checkmarks are cryptographic. Built for the
**Open Track**.

---

## The problem it kills

Grant reporting runs on trust and PDFs. A team says "we hit our Q2 goals," attaches a
screenshot, and everyone nods. Six months later nobody can tell which claims were real and
which were rounded up.

ProofBoard replaces that with a ledger:

- **Register** a project — name, description, owned by the wallet that created it.
- **Append** a milestone — a title, a status, and a `bytes32` hash of your evidence (a PR
  link, a demo URL, an audit report). Hashing happens in your browser; only the digest goes
  on-chain.
- **Verify** — anyone can pull the full timeline for any project over public RPC. No account,
  no login, no backend. The contract is the database.

Because every entry is stamped with `block.timestamp` and can never be edited or removed,
the timeline is the argument.

---

## What's live

| Field | Value |
|---|---|
| Contract | `ProofBoard` |
| Network | Bohr / BOT Chain Testnet |
| Chain ID | `968` |
| RPC | `https://rpc.bohr.life` |
| Explorer | `https://scan.bohr.life` |
| Address | `0xb8F5E9902136170aD1f5960b9e33F45972AcDa90` |
| Deploy tx | `0xba3ca4b74f3baf333bc635c7de54966e75f792ee02b684c71a6d4da2257ad43b` |

→ [View on explorer](https://scan.bohr.life/address/0xb8F5E9902136170aD1f5960b9e33F45972AcDa90)

The app is wired to this exact address. No redeploy needed to run the demo.

---

## Try it

```bash
npm install
npm run dev        # http://127.0.0.1:5280
```

Reading works with **no wallet** — the build log streams from public RPC on load. To publish,
connect any injected EVM wallet (MetaMask, Rabby, OKX, Coinbase). The app auto-offers to add
BOT Chain testnet and warns you if you're on the wrong network.

```bash
npm run build      # → dist/
npm run preview    # http://127.0.0.1:5281
```

---

## How the pieces fit

```
registerProject(name, description)              → uint256 projectId
addMilestone(projectId, title, status, hash)    → uint256 milestoneId   (owner-only)

nextProjectId()                                 → uint256
milestoneCount()                                → uint256
projects(id)                                    → (owner, name, description, exists)
getMilestone(id)                                → Milestone tuple
```

`addMilestone` is gated by `onlyProjectOwner`, so a project's history can only be extended by
the wallet that registered it. The frontend hashes evidence with `ethers.id()` before it ever
touches the wire, then fans out `nextProjectId` + `milestoneCount` reads to reconstruct each
project's timeline client-side.

---

## Want your own instance?

You don't need one for the demo, but if you do:

```bash
cp .env.example .env      # drop in a deployer PRIVATE_KEY
npm run compile
npm run deploy            # rewrites deployments/bohr-testnet.json
```

`.env` and any `*.private.json` are git-ignored. Keys stay off-chain and out of commits.

---

## Under the hood

React 18 + Vite · ethers v6 · Solidity `^0.8.24` (optimizer on, 200 runs) · Hardhat for the
deploy pipeline. System font stack, zero external CDNs — the whole thing runs offline once
built.
