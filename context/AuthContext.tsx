'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { getWeb3Auth } from '@/lib/web3auth';
import { IProvider } from '@web3auth/base';
import { ethers } from 'ethers';

interface UserInfo {
    email?: string;
    name?: string;
    profileImage?: string;
    walletAddress?: string;
}

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    userInfo: UserInfo | null;
    provider: IProvider | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    isLoading: false,
    userInfo: null,
    provider: null,
    login: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [provider, setProvider] = useState<IProvider | null>(null);

    // Prevent init() being called more than once (React strict-mode safe)
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            try {
                const web3auth = getWeb3Auth(); // safe: only runs in the browser
                await web3auth.init();          // v10 API — replaces deprecated initModal()
                if (web3auth.connected) {
                    await hydrateUser(web3auth.provider);
                }
            } catch (e) {
                console.error('Web3Auth init error', e);
            } finally {
                setIsInitializing(false);
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hydrateUser = async (prov: IProvider | null) => {
        if (!prov) return;
        setProvider(prov);
        setIsLoggedIn(true);

        const ethersProvider = new ethers.BrowserProvider(prov as any);
        const signer = await ethersProvider.getSigner();
        const walletAddress = await signer.getAddress();

        const web3auth = getWeb3Auth();
        const info = await web3auth.getUserInfo();
        const user: UserInfo = {
            email: info.email,
            name: info.name,
            profileImage: info.profileImage,
            walletAddress,
        };
        setUserInfo(user);

        await fetch('/api/auth/upsert-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
    };

    const login = async () => {
        setIsLoggingIn(true);
        try {
            const web3auth = getWeb3Auth();
            const prov = await web3auth.connect();
            await hydrateUser(prov);
        } catch (e) {
            // User closed the modal — not a real error
            console.warn('Web3Auth connect cancelled or failed:', e);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const logout = async () => {
        const web3auth = getWeb3Auth();
        await web3auth.logout();
        setIsLoggedIn(false);
        setUserInfo(null);
        setProvider(null);
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-cyan-400 text-sm">Initializing...</span>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading: isLoggingIn, userInfo, provider, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);