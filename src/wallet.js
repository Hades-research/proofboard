export const BOHR_CHAIN_ID = "0x3c8"; // 968 in hex
export const BOHR_CHAIN_ID_DEC = 968;

let selectedProvider = null;

export async function listWallets() {
  const discovered = new Map();

  function onProvider(event) {
    const { info, provider } = event.detail;
    discovered.set(info.rdns || info.name, { info, provider });
  }

  window.addEventListener("eip6963:announceProvider", onProvider);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  await new Promise((resolve) => setTimeout(resolve, 250));
  window.removeEventListener("eip6963:announceProvider", onProvider);

  if (window.ethereum && ![...discovered.values()].some((wallet) => wallet.provider === window.ethereum)) {
    discovered.set("injected", {
      info: { name: window.ethereum.isMetaMask ? "MetaMask" : "Browser Wallet", rdns: "injected" },
      provider: window.ethereum
    });
  }

  return [...discovered.values()];
}

export async function ensureBohrNetwork(provider) {
  if (!provider) throw new Error("No EVM wallet provider found.");

  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BOHR_CHAIN_ID }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: BOHR_CHAIN_ID,
        chainName: "Bohr / BOT Chain Testnet",
        nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
        rpcUrls: ["https://rpc.bohr.life"],
        blockExplorerUrls: ["https://scan.bohr.life"]
      }]
    });
  }
}

export async function connectWallet(provider) {
  const walletProvider = provider || (await listWallets())[0]?.provider;
  if (!walletProvider) throw new Error("Install MetaMask, Rabby, OKX, Coinbase Wallet, or another EVM wallet.");

  selectedProvider = walletProvider;
  await ensureBohrNetwork(walletProvider);
  const [address] = await walletProvider.request({ method: "eth_requestAccounts" });
  return address;
}

export function getWalletProvider() {
  return selectedProvider || window.ethereum;
}

// Ask the active provider which chain it's currently on (decimal chainId, or null).
export async function currentChainId(provider) {
  const p = provider || getWalletProvider();
  if (!p) return null;
  try {
    const hex = await p.request({ method: "eth_chainId" });
    return parseInt(hex, 16);
  } catch {
    return null;
  }
}

// Subscribe to wallet account/network changes. Returns an unsubscribe fn.
export function watchWallet(provider, { onAccounts, onChain } = {}) {
  const p = provider || getWalletProvider();
  if (!p || !p.on) return () => {};
  const accHandler = (accts) => onAccounts && onAccounts(accts?.[0] || "");
  const chainHandler = (hex) => onChain && onChain(parseInt(hex, 16));
  p.on("accountsChanged", accHandler);
  p.on("chainChanged", chainHandler);
  return () => {
    p.removeListener?.("accountsChanged", accHandler);
    p.removeListener?.("chainChanged", chainHandler);
  };
}

// Nudge the active wallet onto BOT Chain testnet (adds it if missing).
export async function switchToBohr(provider) {
  await ensureBohrNetwork(provider || getWalletProvider());
}
