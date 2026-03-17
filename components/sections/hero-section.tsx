'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function HeroSection() {
  const { login, isLoggedIn } = useAuth();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-black to-purple-950"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full animate-float-up">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span className="text-sm text-cyan-300">Web3 Protocol on Mainnet</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent animate-float-up">
            Universal Trustless
          </span>
          <br />
          <span className="text-white animate-float-up">
            Competition Protocol
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed animate-float-up">
          Decentralized platform for hackathons, startup pitches, research grants, DAO proposals, and innovation challenges with cryptographic judging and smart contract-based prize distribution.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-float-up">
          <Link href="/explore" className="btn-neon-cyan flex items-center justify-center gap-2">
            Explore Competitions
            <ArrowRight className="w-4 h-4" />
          </Link>
          {!isLoggedIn && (
            <button onClick={login} className="btn-ghost-neon flex items-center justify-center gap-2">
              Connect Wallet
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-12 animate-float-up">
          <div className="glass-card p-4 border-cyan-500/20">
            <div className="text-2xl font-bold text-cyan-300">$12.5M</div>
            <div className="text-xs text-gray-400 mt-1">Prize Distributed</div>
          </div>
          <div className="glass-card p-4 border-purple-500/20">
            <div className="text-2xl font-bold text-purple-300">2,847</div>
            <div className="text-xs text-gray-400 mt-1">Competitions</div>
          </div>
          <div className="glass-card p-4 border-lime-400/20">
            <div className="text-2xl font-bold text-lime-300">45K+</div>
            <div className="text-xs text-gray-400 mt-1">Participants</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500">Scroll to explore</span>
          <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
