'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { ArrowRight, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { buildMerkleRootFromJudges, CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { BrowserProvider, parseEther, Contract } from 'ethers';
import { useAuth } from '@/context/AuthContext';

export default function CreateCompetitionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prizePool: '',
    winners: '3',
    startDate: '',
    startTime: '00:00',
    submissionDeadlineDate: '',
    submissionDeadlineTime: '23:59',
    votingDeadlineDate: '',
    votingDeadlineTime: '23:59',
    applyDeadlineDate: '',
    applyDeadlineTime: '23:59',
    pptRequired: false,
    category: 'Any' as 'ML' | 'Web3' | 'IoT' | 'Any',
    venue: '',
    teamSize: '5',
    isPublic: true,
  });

  const [judges, setJudges] = useState<Array<{ type: 'wallet' | 'email'; value: string }>>([]);
  const [judgeInput, setJudgeInput] = useState('');
  const [judgeType, setJudgeType] = useState<'wallet' | 'email'>('wallet');
  const { provider: web3authProvider } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addJudge = () => {
    if (judgeInput.trim()) {
      setJudges([...judges, { type: judgeType, value: judgeInput }]);
      setJudgeInput('');
    }
  };

  const removeJudge = (index: number) => {
    setJudges(judges.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (judges.length < 3) return;

    try {
      // Use Web3Auth provider (works for Google Sign-In users too)
      if (!web3authProvider) throw new Error('Not logged in. Please connect your wallet.');

      const provider = new BrowserProvider(web3authProvider as any);
      const signer = await provider.getSigner();
      const sponsorWallet = await signer.getAddress();

      const judgeMerkleRoot = buildMerkleRootFromJudges(judges);

      const startTs = Math.floor(new Date(`${formData.startDate}T${formData.startTime}`).getTime() / 1000);
      const submissionTs = Math.floor(new Date(`${formData.submissionDeadlineDate}T${formData.submissionDeadlineTime}`).getTime() / 1000);
      const votingTs = Math.floor(new Date(`${formData.votingDeadlineDate}T${formData.votingDeadlineTime}`).getTime() / 1000);

      const now = new Date();
      const applyDt = new Date(`${formData.applyDeadlineDate}T${formData.applyDeadlineTime}`);
      const startDt = new Date(`${formData.startDate}T${formData.startTime}`);

      if (applyDt >= startDt) {
        alert('Last date to apply must be before the competition start date.');
        return;
      }

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const prizeInWei = parseEther(formData.prizePool);
      const CATEGORY_MAP: Record<string, number> = { Any: 0, ML: 1, Web3: 2, IoT: 3 };

      const tx = await contract.createCompetition(
        Number(formData.winners),
        CATEGORY_MAP[formData.category],
        startTs,
        submissionTs,
        votingTs,
        judgeMerkleRoot,
        formData.isPublic,
        { value: prizeInWei }
      );

      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === 'CompetitionCreated');
      const contractCompetitionId = event ? Number(event.args.id) : null;

      const res = await fetch('/api/competitions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          prizePoolPOL: formData.prizePool,
          numWinners: formData.winners,
          startDate: `${formData.startDate}T${formData.startTime}`,
          submissionDeadline: `${formData.submissionDeadlineDate}T${formData.submissionDeadlineTime}`,
          votingDeadline: `${formData.votingDeadlineDate}T${formData.votingDeadlineTime}`,
          applyDeadline: `${formData.applyDeadlineDate}T${formData.applyDeadlineTime}`,
          pptRequired: formData.pptRequired,
          category: formData.category,
          venue: formData.venue,
          teamSize: Number(formData.teamSize),
          judges,
          judgeMerkleRoot,
          isPublic: formData.isPublic,
          sponsorWallet,
          txHash: receipt.hash,
          contractCompetitionId,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Transaction failed');
    }
  };

  if (submitted) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background">
          <Navbar />
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
            <div className="glass-card p-12 border-lime-400/20 text-center max-w-md w-full">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-lime-400/20 border border-lime-400/50 flex items-center justify-center animate-glow-pulse">
                  <Check className="w-8 h-8 text-lime-300" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Competition Created!</h2>
              <p className="text-gray-400 mb-8">Your competition has been published and is now live on the network.</p>
              <div className="space-y-3 text-sm text-gray-400 mb-8">
                <div className="flex items-center justify-center gap-2">
                  <span className="badge-primary">Transaction ID</span>
                  <span className="font-mono text-xs text-cyan-300">0x742d...8f9a</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="badge-secondary">Prize Escrowed</span>
                  <span className="font-mono text-xs text-purple-300">{formData.prizePool} POL</span>
                </div>
              </div>
              <a href="/" className="btn-neon-cyan w-full block py-3">
                Back to Home
              </a>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <Navbar />

        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-12 text-center">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  Create a Competition
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                Set up a new trustless competition with cryptographic judging and smart contract-based prize distribution.
              </p>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="glass-card p-8 border-cyan-500/20 space-y-8">
              {/* Competition Details */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 text-sm font-bold">1</span>
                  Competition Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Competition Title *</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g., Web3 Hackathon 2024"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Description *</label>
                    <textarea
                      name="description"
                      placeholder="Describe your competition, rules, evaluation criteria..."
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Venue & Team */}
              <div className="border-t border-cyan-500/10 pt-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 text-sm font-bold">2</span>
                  Venue & Team
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Venue / Platform *</label>
                    <input
                      type="text"
                      name="venue"
                      placeholder="e.g., Online / Devfolio / ETHGlobal"
                      value={formData.venue}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Max Team Size *</label>
                    <select
                      name="teamSize"
                      value={formData.teamSize}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    >
                      <option value="1">Solo only</option>
                      <option value="2">Up to 2</option>
                      <option value="3">Up to 3</option>
                      <option value="4">Up to 4</option>
                      <option value="5">Up to 5</option>
                      <option value="10">Up to 10</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Prize & Timeline */}
              <div className="border-t border-cyan-500/10 pt-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300 text-sm font-bold">3</span>
                  Prize & Timeline
                </h2>

                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Prize Pool (POL) *</label>
                    <input
                      type="number"
                      name="prizePool"
                      placeholder="e.g., 10"
                      value={formData.prizePool}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Number of Winners *</label>
                    <select
                      name="winners"
                      value={formData.winners}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    >
                      <option value="1">1 Winner</option>
                      <option value="3">3 Winners</option>
                      <option value="5">5 Winners</option>
                      <option value="10">10 Winners</option>
                    </select>
                  </div>
                </div>

                {/* Start Date & Time */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-2">Competition Start *</label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>

                {/* Apply Deadline */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-2">Last Date to Apply *</label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input type="date" name="applyDeadlineDate" value={formData.applyDeadlineDate}
                      onChange={handleInputChange} required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                    <input type="time" name="applyDeadlineTime" value={formData.applyDeadlineTime}
                      onChange={handleInputChange} required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                  </div>
                </div>

                {/* Submission Deadline */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-2">Submission Deadline *</label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="date"
                      name="submissionDeadlineDate"
                      value={formData.submissionDeadlineDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <input
                      type="time"
                      name="submissionDeadlineTime"
                      value={formData.submissionDeadlineTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>

                {/* Voting Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Voting Deadline *</label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="date"
                      name="votingDeadlineDate"
                      value={formData.votingDeadlineDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <input
                      type="time"
                      name="votingDeadlineTime"
                      value={formData.votingDeadlineTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2 mt-6">Category *</label>
                    <select name="category" value={formData.category} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                      <option value="Any">Any</option>
                      <option value="ML">ML / AI</option>
                      <option value="Web3">Web3</option>
                      <option value="IoT">IoT</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-cyan-500/20 self-end">
                    <input type="checkbox" id="pptRequired" checked={formData.pptRequired}
                      onChange={(e) => setFormData(prev => ({ ...prev, pptRequired: e.target.checked }))}
                      className="w-4 h-4 rounded cursor-pointer" />
                    <label htmlFor="pptRequired" className="flex-1 cursor-pointer">
                      <div className="text-sm font-semibold text-white">PPT Required</div>
                      <div className="text-xs text-gray-400">Teams must submit a presentation</div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Judges */}
              <div className="border-t border-cyan-500/10 pt-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-lime-400/20 border border-lime-400/50 flex items-center justify-center text-lime-300 text-sm font-bold">4</span>
                  Judges & Settings
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-3">Add Judge *</label>
                  <div className="flex gap-3 mb-4">
                    <select
                      value={judgeType}
                      onChange={(e) => setJudgeType(e.target.value as 'wallet' | 'email')}
                      className="px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="wallet">Wallet Address</option>
                      <option value="email">Email Address</option>
                    </select>
                    <input
                      type={judgeType === 'wallet' ? 'text' : 'email'}
                      value={judgeInput}
                      onChange={(e) => setJudgeInput(e.target.value)}
                      placeholder={judgeType === 'wallet' ? '0x...' : 'judge@example.com'}
                      className="flex-1 px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addJudge())}
                    />
                    <button
                      type="button"
                      onClick={addJudge}
                      className="p-3 bg-cyan-500 text-black rounded-lg hover:bg-cyan-600 transition-colors duration-300"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {judges.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <label className="block text-sm font-semibold text-white">Judges ({judges.length})</label>
                      <div className="space-y-2">
                        {judges.map((judge, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-black/30 rounded border border-purple-500/20">
                            <div>
                              <div className="text-xs text-gray-400">{judge.type === 'wallet' ? 'Wallet' : 'Email'}</div>
                              <div className="text-white font-mono text-sm">{judge.value}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeJudge(idx)}
                              className="p-2 hover:bg-red-500/20 rounded transition-colors duration-300"
                            >
                              <Trash2 className="w-5 h-5 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-cyan-500/20">
                  <input
                    type="checkbox"
                    id="public"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="public" className="flex-1 cursor-pointer">
                    <div className="text-sm font-semibold text-white">Public Competition</div>
                    <div className="text-xs text-gray-400">Allow public submissions and participation</div>
                  </label>
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-300">
                    <strong>Transparent & Trustless:</strong> Prize funds are escrowed on-chain. Submissions are stored with IPFS hashes. Winners are determined by judges using zero-knowledge proofs, ensuring anonymity while preventing fraud.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={judges.length < 3}
                className="w-full btn-neon-cyan flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create & Publish Competition
                <ArrowRight className="w-4 h-4" />
              </button>
              {judges.length < 3 && (
                <p className="text-center text-sm text-gray-400">Add at least 3 judges to continue</p>
              )}
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}