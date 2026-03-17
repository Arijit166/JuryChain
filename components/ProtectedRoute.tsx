'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, isLoading, login } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
                <div className="glass-card p-10 max-w-md w-full border-cyan-500/20">
                    <div className="text-4xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to access this page.</p>
                    <button onClick={login} className="btn-neon-cyan w-full justify-center">
                        Connect with Google / Wallet
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}