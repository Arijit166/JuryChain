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
  const [txHash, setTxHash] = useState<string | null>(null);
  const [competitionId, setCompetitionId] = useState<number | null>(null);
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

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const prizeInWei = parseEther(formData.prizePool);

      const tx = await contract.createCompetition(
        Number(formData.winners),
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
      setTxHash(receipt.hash);
      setCompetitionId(contractCompetitionId);

      const res = await fetch('/api/competitions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          prizePoolUSD: formData.prizePool,
          numWinners: formData.winners,
          startDate: `${formData.startDate}T${formData.startTime}`,
          submissionDeadline: `${formData.submissionDeadlineDate}T${formData.submissionDeadlineTime}`,
          votingDeadline: `${formData.votingDeadlineDate}T${formData.votingDeadlineTime}`,
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

                {/* Transaction Hash */}
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-cyan-500/20">
                  <span className="badge-primary shrink-0">Tx Hash</span>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-cyan-300 hover:text-cyan-100 underline underline-offset-2 truncate ml-2"
                  >
                    {txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : '—'}
                  </a>
                </div>

                {/* On-chain Competition ID */}
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-cyan-500/20">
                  <span className="badge-primary shrink-0">Competition ID</span>
                  <span className="font-mono text-xs text-cyan-300 ml-2">
                    #{competitionId !== null ? competitionId : '—'}
                  </span>
                </div>

                {/* Prize */}
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-purple-500/20">
                  <span className="badge-secondary shrink-0">Prize Escrowed</span>
                  <span className="font-mono text-xs text-purple-300 ml-2">
                    {formData.prizePool} POL
                  </span>
                </div>

                {/* Split */}
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-purple-500/20">
                  <span className="badge-secondary shrink-0">Split</span>
                  <span className="font-mono text-xs text-purple-300 ml-2">
                    {formData.winners === '1' && '100%'}
                    {formData.winners === '3' && '50 / 30 / 20%'}
                    {formData.winners === '5' && '45 / 30 / 15 / 5 / 5%'}
                    {formData.winners === '10' && '30 / 20 / 15 / 10 / 7 / 7 / 3 / 3 / 2.5 / 2.5%'}
                  </span>
                </div>

                {/* Winners */}
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-lime-400/20">
                  <span className="shrink-0 text-xs text-lime-400 font-semibold">Winners</span>
                  <span className="font-mono text-xs text-lime-300 ml-2">{formData.winners}</span>
                </div>

                {/* Title */}
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-lime-400/20">
                  <span className="shrink-0 text-xs text-lime-400 font-semibold">Title</span>
                  <span className="text-xs text-lime-300 ml-2 truncate">{formData.title}</span>
                </div>

              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={`https://amoy.polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon-cyan w-full block py-3 text-sm"
                >
                  View on Polygonscan ↗
                </a>
                <a href="/competitions" className="w-full block py-3 text-sm text-center border border-cyan-500/30 rounded-lg text-gray-300 hover:border-cyan-500 hover:text-white transition-colors duration-300">
                  View All Competitions
                </a>
              </div>

            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }
}

