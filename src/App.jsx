import React, { useEffect, useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FolderGit2,
  Hash,
  Layers,
  PlusCircle,
  RefreshCw
} from "lucide-react";
import { CONTRACT_ADDRESS, EXPLORER_URL, getContract, hashEvidence, loadBoard } from "./chain";
import { BOHR_CHAIN_ID_DEC, currentChainId, switchToBohr, watchWallet } from "./wallet";
import { WalletConnect } from "./WalletConnect";
import "./styles.css";

const EXPLORER_BASE = "https://scan.bohr.life";
const short = (v) => (v ? `${v.slice(0, 6)}...${v.slice(-4)}` : "—");
const isLive = (s) => /live|ship|done|complete|deploy|merg|launch/i.test(s || "");

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// Small inline copy button used for hashes and addresses.
function CopyChip({ value, label }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="pb-copy"
      title={`Copy ${label || "value"}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard blocked — no-op */
        }
      }}
    >
      <Copy size={11} />
      {done ? "copied" : "copy"}
    </button>
  );
}

function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [board, setBoard] = useState({ projects: [], totals: { projects: 0, milestones: 0 } });
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState("");
  const [mode, setMode] = useState("project"); // "project" | "milestone"
  const [status, setStatus] = useState({ text: "Reading the on-chain build log…", err: false });
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    projectId: "",
    title: "",
    milestoneStatus: "Shipped",
    evidence: ""
  });
  const unwatch = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const say = (text, err = false) => setStatus({ text, err });

  const wrongNetwork = Boolean(account) && chainId !== null && chainId !== BOHR_CHAIN_ID_DEC;

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setReadError("");
      const data = await loadBoard();
      setBoard(data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setReadError(e.shortMessage || e.message || "Could not reach the contract over RPC.");
    }
  }, []);

  useEffect(() => {
    refresh().then(() => say("Live from BOT Chain testnet."));
  }, [refresh]);

  // Wire up wallet account/chain listeners once we have a connected account.
  useEffect(() => {
    if (!account) return;
    currentChainId().then(setChainId);
    unwatch.current = watchWallet(undefined, {
      onAccounts: (a) => {
        setAccount(a);
        if (!a) say("Wallet disconnected.");
      },
      onChain: (c) => setChainId(c)
    });
    return () => {
      unwatch.current && unwatch.current();
      unwatch.current = null;
    };
  }, [account]);

  async function runTx(label, fn) {
    try {
      setBusy(true);
      say(`Confirm ${label} in your wallet…`);
      const contract = await getContract(true);
      const tx = await fn(contract);
      say(`Submitted — waiting for confirmation (${short(tx.hash)})…`);
      await tx.wait();
      say(`${label} confirmed on-chain.`);
      await refresh();
    } catch (e) {
      say(e.shortMessage || e.message, true);
    } finally {
      setBusy(false);
    }
  }

  const submitProject = () => {
    if (!account) return say("Connect a wallet first.", true);
    if (!form.name.trim()) return say("Give the project a name first.", true);
    return runTx("project registration", (c) =>
      c.registerProject(form.name.trim(), form.description.trim())
    ).then(() => setForm((f) => ({ ...f, name: "", description: "" })));
  };

  const submitMilestone = () => {
    if (!account) return say("Connect a wallet first.", true);
    if (!form.projectId) return say("Enter the project ID to append to.", true);
    if (!form.title.trim()) return say("Give the milestone a title.", true);
    return runTx("milestone", (c) =>
      c.addMilestone(
        Number(form.projectId),
        form.title.trim(),
        form.milestoneStatus.trim() || "Shipped",
        hashEvidence(form.evidence.trim())
      )
    ).then(() => setForm((f) => ({ ...f, title: "", evidence: "" })));
  };

  const evidenceHash = form.evidence.trim() ? hashEvidence(form.evidence.trim()) : null;
  const canWrite = Boolean(account) && !wrongNetwork;

  return (
    <div className="pb-shell">
      <nav className="pb-nav">
        <div className="pb-logo">
          <span className="mark"><img src="/logo.svg" width="30" height="30" alt="ProofBoard" /></span>
          ProofBoard
        </div>
        <div className="pb-nav-right">
          <span className="pb-chainpill">
            <span className={`pb-dot${wrongNetwork ? " warn" : ""}`} /> BOT Chain testnet · 968
          </span>
          <WalletConnect
            account={account}
            onConnected={(a) => {
              setAccount(a);
              currentChainId().then(setChainId);
              say("Wallet connected. You can register and append milestones.");
            }}
          />
        </div>
      </nav>

      {wrongNetwork && (
        <div className="pb-banner">
          <AlertTriangle size={15} />
          <span>
            Your wallet is on chain {chainId}. Switch to BOT Chain testnet (968) to publish.
          </span>
          <button onClick={() => switchToBohr().then(() => currentChainId().then(setChainId))}>
            Switch network
          </button>
        </div>
      )}

      <header className="pb-hero">
        <div>
          <span className="pb-eyebrow">Open Track · Proof of progress</span>
          <h1>A public build log your backers can actually verify.</h1>
          <p className="lede">
            Register a project once, then append milestones as you ship. Each entry writes a
            metadata hash and a timestamp to BOT Chain — an append-only record that grant
            reviewers and DAOs can audit without taking your word for it.
          </p>
        </div>
        <div className="pb-stats">
          <div className="pb-stat">
            <b>{loading ? "·" : board.totals.projects}</b>
            <span>projects</span>
          </div>
          <div className="pb-stat">
            <b>{loading ? "·" : board.totals.milestones}</b>
            <span>milestones</span>
          </div>
        </div>
      </header>

      <main className="pb-main">
        {/* Compose column */}
        <aside className="pb-panel">
          <div className="pb-panel-head">
            <PlusCircle size={17} color="var(--teal-deep)" />
            <h3>Publish to the ledger</h3>
          </div>
          <div className="pb-panel-body">
            <div className="pb-seg">
              <button className={mode === "project" ? "on" : ""} onClick={() => setMode("project")}>
                New project
              </button>
              <button className={mode === "milestone" ? "on" : ""} onClick={() => setMode("milestone")}>
                Add milestone
              </button>
            </div>

            {mode === "project" ? (
              <>
                <div className="pb-field">
                  <label>Project name</label>
                  <input
                    value={form.name}
                    placeholder="e.g. Aqua Grid Sensors"
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div className="pb-field">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    placeholder="One line on what you're building."
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
                <button className="pb-btn" disabled={busy || !canWrite} onClick={submitProject}>
                  <FolderGit2 size={16} /> Register project
                </button>
              </>
            ) : (
              <>
                <div className="pb-field">
                  <label>Project ID</label>
                  <input
                    value={form.projectId}
                    placeholder="e.g. 1"
                    inputMode="numeric"
                    onChange={(e) => set("projectId", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="pb-field">
                  <label>Milestone title</label>
                  <input
                    value={form.title}
                    placeholder="e.g. Beta launched to 50 users"
                    onChange={(e) => set("title", e.target.value)}
                  />
                </div>
                <div className="pb-field">
                  <label>Status</label>
                  <input
                    value={form.milestoneStatus}
                    placeholder="Shipped / Planned"
                    onChange={(e) => set("milestoneStatus", e.target.value)}
                  />
                </div>
                <div className="pb-field">
                  <label>Evidence (text or link)</label>
                  <input
                    value={form.evidence}
                    placeholder="PR url, demo link, report…"
                    onChange={(e) => set("evidence", e.target.value)}
                  />
                  {evidenceHash && (
                    <div className="pb-hashline">
                      <Hash size={11} style={{ verticalAlign: "middle" }} /> {evidenceHash}
                      <div className="pb-hint">This hash is what gets stored on-chain — the raw text never leaves your browser.</div>
                    </div>
                  )}
                </div>
                <button className="pb-btn" disabled={busy || !canWrite} onClick={submitMilestone}>
                  <CheckCircle2 size={16} /> Append milestone
                </button>
              </>
            )}

            {!account && (
              <div className="pb-note">Connect a wallet to publish. Reading the log needs no wallet.</div>
            )}
            <div className={`pb-status${status.err ? " err" : ""}`}>{status.text}</div>
          </div>
        </aside>

        {/* Feed column */}
        <section>
          <div className="pb-feed-head">
            <h2>Build log</h2>
            <button
              className="pb-btn ghost"
              style={{ width: "auto", padding: "8px 12px" }}
              onClick={() => refresh().then(() => say("Refreshed from chain."))}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="pb-empty">Loading projects from the deployed contract…</div>
          ) : readError ? (
            <div className="pb-empty err">
              <b>Couldn't reach the contract.</b>
              {readError}
              <button className="pb-btn ghost" style={{ width: "auto", margin: "14px auto 0", padding: "8px 14px" }} onClick={refresh}>
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          ) : board.projects.length === 0 ? (
            <div className="pb-empty">
              <b>No projects on the ledger yet.</b>
              Register the first one from the panel — it appears here instantly, read straight from chain.
            </div>
          ) : (
            board.projects.map((p) => {
              const done = p.milestones.filter((m) => isLive(m.status)).length;
              const pct = p.milestones.length ? Math.round((done / p.milestones.length) * 100) : 0;
              const mine = account && p.owner.toLowerCase() === account.toLowerCase();
              return (
                <article className="pb-project" key={p.id}>
                  <div className="pb-project-head">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span className="idbadge">#{p.id}</span>
                        <h3>{p.name}</h3>
                        {mine && <span className="pb-mine">yours</span>}
                      </div>
                      {p.description && <p>{p.description}</p>}
                      <div className="pb-project-owner">
                        by{" "}
                        <a href={`${EXPLORER_BASE}/address/${p.owner}`} target="_blank" rel="noreferrer">
                          {short(p.owner)}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="pb-progress">
                    <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                    <div className="cap">
                      {done}/{p.milestones.length} milestones shipped
                    </div>
                  </div>

                  {p.milestones.length === 0 ? (
                    <div className="pb-nomiles">No milestones appended yet.</div>
                  ) : (
                    <div className="pb-timeline">
                      {p.milestones.map((m) => {
                        const live = isLive(m.status);
                        return (
                          <div className={`pb-node ${live ? "done" : "pending"}`} key={m.milestoneId}>
                            <span className="pip" />
                            <div className="pb-node-body">
                              <div className="row1">
                                <h4>{m.title}</h4>
                                <span className={`pb-tag ${live ? "live" : "plan"}`}>{m.status}</span>
                              </div>
                              <div className="meta">
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <Clock3 size={12} /> {fmtDate(m.timestamp)}
                                </span>
                                <span className="hash" title="On-chain metadata hash">
                                  {m.metadataHash.slice(0, 10)}…{m.metadataHash.slice(-6)}
                                </span>
                                <CopyChip value={m.metadataHash} label="metadata hash" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>

      <footer className="pb-foot">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          Contract{" "}
          <a href={EXPLORER_URL} target="_blank" rel="noreferrer">
            {short(CONTRACT_ADDRESS)} <ExternalLink size={11} style={{ verticalAlign: "-1px" }} />
          </a>{" "}
          on BOT Chain testnet
          <CopyChip value={CONTRACT_ADDRESS} label="contract address" />
        </span>
        <span>Every milestone is an on-chain record. No backend, no database.</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
