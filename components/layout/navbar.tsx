'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="glass-card sticky top-0 z-50 border-t-0 border-l-0 border-r-0 rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* JuryChain SVG Icon: gavel + blockchain hex motif */}
            <div className="relative w-11 h-11 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(0,217,255,0.6)]">
                <defs>
                  <linearGradient id="jc-logo-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d9ff" />
                    <stop offset="100%" stopColor="#9d4edd" />
                  </linearGradient>
                  <linearGradient id="jc-logo-g2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9d4edd" />
                    <stop offset="100%" stopColor="#00d9ff" />
                  </linearGradient>
                  <filter id="jc-glow">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {/* Outer hex ring */}
                <polygon
                  points="18,2 31,9.5 31,26.5 18,34 5,26.5 5,9.5"
                  stroke="url(#jc-logo-g1)"
                  strokeWidth="1.5"
                  fill="rgba(0,217,255,0.06)"
                  filter="url(#jc-glow)"
                />
                {/* Inner hex */}
                <polygon
                  points="18,8 26,12.5 26,23.5 18,28 10,23.5 10,12.5"
                  stroke="url(#jc-logo-g2)"
                  strokeWidth="1"
                  fill="rgba(157,78,221,0.1)"
                />
                {/* Gavel head */}
                <rect
                  x="14" y="13" width="10" height="5" rx="1.5"
                  fill="url(#jc-logo-g1)"
                />
                {/* Gavel handle */}
                <rect
                  x="17.5" y="18" width="2.5" height="7" rx="1"
                  fill="url(#jc-logo-g2)"
                />
                {/* Chain link dots */}
                <circle cx="10" cy="18" r="1.5" fill="#00d9ff" opacity="0.8" />
                <circle cx="26" cy="18" r="1.5" fill="#9d4edd" opacity="0.8" />
                <circle cx="18" cy="8" r="1.2" fill="#00d9ff" opacity="0.6" />
              </svg>
            </div>
            <div className="flex flex-col leading-none hidden sm:flex">
              <span className="text-base font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent tracking-wide">
                JuryChain
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/explore" className="text-base text-gray-300 hover:text-cyan-300 transition-colors duration-300">
              Explore
            </Link>
            <Link href="/create-competition" className="text-base text-gray-300 hover:text-cyan-300 transition-colors duration-300">
              Create
            </Link>
            <Link href="/transparency-explorer" className="text-base text-gray-300 hover:text-cyan-300 transition-colors duration-300">
              Transparency
            </Link>
            <Link href="/dashboard" className="text-base text-gray-300 hover:text-cyan-300 transition-colors duration-300">
              Dashboard
            </Link>
          </div>

          {/* Connect Wallet Button */}
          <div className="hidden md:flex items-center gap-4">
            <button className="btn-ghost-neon text-base">
              Connect Wallet
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-cyan-500/10 rounded-lg transition-colors duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-cyan-300" />
            ) : (
              <Menu className="w-5 h-5 text-cyan-300" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-cyan-500/20 animate-float-up">
            <div className="flex flex-col gap-3 mt-4">
              <Link
                href="/explore"
                className="px-4 py-2 text-sm text-gray-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors duration-300"
              >
                Explore
              </Link>
              <Link
                href="/create-competition"
                className="px-4 py-2 text-sm text-gray-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors duration-300"
              >
                Create
              </Link>
              <Link
                href="/transparency-explorer"
                className="px-4 py-2 text-sm text-gray-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors duration-300"
              >
                Transparency
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm text-gray-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors duration-300"
              >
                Dashboard
              </Link>
              <button className="btn-ghost-neon text-sm w-full justify-center mt-2">
                Connect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
