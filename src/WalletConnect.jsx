import React, { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { connectWallet, listWallets } from "./wallet";

const short = (v) => (v ? `${v.slice(0, 6)}...${v.slice(-4)}` : "Connect wallet");

export function WalletConnect({ account, onConnected }) {
  const [wallets, setWallets] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listWallets().then(setWallets).catch(() => setWallets([]));
  }, []);

  async function connect(provider) {
    try {
      setError("");
      const address = await connectWallet(provider);
      onConnected(address);
      setOpen(false);
    } catch (e) {
      setError(e.shortMessage || e.message);
    }
  }

  const options = wallets.length
    ? wallets
    : [{ info: { name: "Browser wallet" }, provider: window.ethereum }];

  return (
    <div className="pb-wallet">
      <button
        type="button"
        className={account ? "connected" : ""}
        onClick={() => setOpen((v) => !v)}
      >
        <Wallet size={15} />
        {short(account)}
      </button>
      {open && (
        <div className="pb-wallet-menu">
          {options.map((w) => (
            <button
              key={w.info.rdns || w.info.name}
              type="button"
              onClick={() => connect(w.provider)}
            >
              {w.info.icon && <img src={w.info.icon} alt="" />}
              <span>{w.info.name}</span>
            </button>
          ))}
          {error && <p className="werr">{error}</p>}
        </div>
      )}
    </div>
  );
}
