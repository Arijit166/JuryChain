'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Copy, Eye, Shield, ArrowRight, Star } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Project {
  id: string;
  name: string;
  description: string;
  github: string;
  demo: string;
  votes: number;
}

export default function JudgeDashboard() {
  const [identityGenerated, setIdentityGenerated] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [score, setScore] = useState(5);
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [votingSecret, setVotingSecret] = useState('');

  const projects: Project[] = [
    {
      id: '1',
      name: 'Decentralized AI Protocol',
      description: 'A blockchain-based AI training and inference platform with decentralized governance',
      github: 'https://github.com/example/ai-protocol',
      demo: 'https://ai-protocol-demo.com',
      votes: 45,
    },
    {
      id: '2',
      name: 'Cross-chain Bridge',
      description: 'Secure cross-chain token transfer protocol with optimistic rollups',
      github: 'https://github.com/example/bridge',
      demo: 'https://bridge-demo.com',
      votes: 38,
    },
    {
      id: '3',
      name: 'Privacy-Focused Social Graph',
      description: 'Social network with encrypted messaging and zero-knowledge proof authentication',
      github: 'https://github.com/example/social',
      demo: 'https://social-demo.com',
      votes: 32,
    },
  ];

  const handleVote = () => {
    alert(`Vote submitted for project ${selectedProject} with score ${score}`);
    setShowVoteForm(false);
    setSelectedProject(null);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-2">Judge Dashboard</h1>
            <p className="text-xl text-gray-400">Review projects and submit your votes anonymously</p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Identity Setup Section */}
            {!identityGenerated ? (
              <div className="mb-12 glass-card p-8 border-purple-500/20">
                <div className="flex items-start gap-4 mb-6">
                  <Shield className="w-8 h-8 text-purple-300 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">Generate Anonymous Identity</h2>
                    <p className="text-gray-400 mb-4">
                      Your identity is created using hash(wallet + secret phrase). This ensures you remain anonymous to other judges while maintaining vote integrity.
                    </p>
                  </div>
                </div>

                <div className="bg-black/30 p-6 rounded-lg mb-6 border border-purple-500/10">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-white mb-2">Your Wallet Address</label>
                    <div className="px-4 py-2 bg-black/50 rounded border border-cyan-500/30 text-gray-400 font-mono text-sm">
                      0x1234567890123456789012345678901234567890
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-white mb-2">Secret Phrase (Keep Safe!)</label>
                    <input
                      type="password"
                      placeholder="Enter a secret phrase you'll remember"
                      className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      You'll need this phrase to reveal your vote after the voting period closes
                    </p>
                  </div>

                  <button
                    onClick={() => setIdentityGenerated(true)}
                    className="btn-neon-purple w-full py-3"
                  >
                    Generate Anonymous Identity
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex gap-3 text-gray-400">
                    <div className="w-1 bg-purple-500 rounded"></div>
                    <p>You'll receive a unique judge ID</p>
                  </div>
                  <div className="flex gap-3 text-gray-400">
                    <div className="w-1 bg-purple-500 rounded"></div>
                    <p>Your identity is cryptographically secure</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-12 glass-card p-6 border-lime-400/20 bg-lime-400/5">
                <div className="flex items-center gap-3 text-lime-300 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">Anonymous Judge ID Generated</span>
                </div>
                <p className="text-sm text-gray-400">
                  You are ready to review and vote on projects. Your judge ID is: <span className="text-cyan-300 font-mono">jdg_kX9mP2qR4sT5u6V7w</span>
                </p>
              </div>
            )}

            {/* Projects List */}
            {identityGenerated && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Projects Under Review</h2>

                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="glass-card p-6 border-cyan-500/20 group hover:border-cyan-500/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                          {project.name}
                        </h3>
                        <p className="text-gray-400 mb-4">{project.description}</p>

                        {/* Links */}
                        <div className="flex flex-wrap gap-4 mb-4">
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 transition-colors duration-300"
                          >
                            <Eye className="w-4 h-4" />
                            View GitHub
                          </a>
                          <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 transition-colors duration-300"
                          >
                            <Eye className="w-4 h-4" />
                            Live Demo
                          </a>
                        </div>
                      </div>

                      {/* Vote Count */}
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-purple-300">{project.votes}</div>
                        <div className="text-xs text-gray-400">votes</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {selectedProject === project.id && showVoteForm ? (
                      <div className="mt-6 pt-6 border-t border-cyan-500/10">
                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-white mb-3">Score (1-10)</label>
                          <div className="flex gap-2 mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <button
                                key={num}
                                onClick={() => setScore(num)}
                                className={`w-8 h-8 rounded flex items-center justify-center font-semibold transition-all duration-200 ${score === num
                                  ? 'bg-cyan-500 text-black scale-110'
                                  : 'bg-black/50 text-gray-300 hover:bg-cyan-500/30'
                                  }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-white mb-2">Secret Phrase (for reveal)</label>
                          <input
                            type="password"
                            placeholder="Enter your secret phrase"
                            value={votingSecret}
                            onChange={(e) => setVotingSecret(e.target.value)}
                            className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleVote}
                            className="flex-1 btn-neon-cyan py-2"
                          >
                            Submit Vote
                          </button>
                          <button
                            onClick={() => {
                              setShowVoteForm(false);
                              setSelectedProject(null);
                            }}
                            className="flex-1 btn-ghost-neon py-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedProject(project.id);
                          setShowVoteForm(true);
                        }}
                        className="btn-neon-cyan py-2 flex items-center justify-center gap-2"
                      >
                        Vote on This Project
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Voting Info */}
                <div className="glass-card p-6 border-cyan-500/20 mt-8">
                  <h3 className="text-lg font-bold text-white mb-4">How Voting Works</h3>
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex gap-3">
                      <span className="text-cyan-300 font-bold">1.</span>
                      <p>Score each project (1-10) based on innovation, execution, and impact</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-300 font-bold">2.</span>
                      <p>Your vote is committed as a hash (vote + secret phrase)</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-300 font-bold">3.</span>
                      <p>After voting closes, you reveal your vote with your secret phrase</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-300 font-bold">4.</span>
                      <p>Smart contract verifies and tallies all revealed votes</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
