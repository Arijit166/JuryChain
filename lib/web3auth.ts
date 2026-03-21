import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

let _web3auth: Web3Auth | null = null;

export function getWeb3Auth(): Web3Auth {
    if (_web3auth) return _web3auth;

    _web3auth = new Web3Auth({
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        chains: [
            {
                chainNamespace: CHAIN_NAMESPACES.EIP155,
                chainId: "0x13882",
                rpcTarget: "https://rpc-amoy.polygon.technology",
                displayName: "Polygon Amoy Testnet",
                blockExplorerUrl: "https://amoy.polygonscan.com",
                ticker: "POL",
                tickerName: "Polygon",
                logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
            },
        ],
        defaultChainId: "0x13882",
    });

    return _web3auth;
}