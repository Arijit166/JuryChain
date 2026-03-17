import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

// Lazily created so it is only instantiated in the browser.
// new Web3Auth() must NOT run at module-level because Next.js evaluates
// modules on the server where `window` is undefined, breaking the Modal.
let _web3auth: Web3Auth | null = null;

export function getWeb3Auth(): Web3Auth {
    if (_web3auth) return _web3auth;

    // In @web3auth/modal v10, use the `chains` array for EVM — NOT privateKeyProvider.
    // privateKeyProvider is for MPC/XRPL only and causes the AuthConnector to crash.
    _web3auth = new Web3Auth({
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        chains: [
            {
                chainNamespace: CHAIN_NAMESPACES.EIP155,
                chainId: "0x1",
                rpcTarget: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/eth",
                displayName: "Ethereum Mainnet",
                blockExplorerUrl: "https://etherscan.io",
                ticker: "ETH",
                tickerName: "Ethereum",
                logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
            },
        ],
        defaultChainId: "0x1",
    });

    return _web3auth;
}