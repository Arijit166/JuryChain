'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function SubmitProject({ params }: { params: { competitionId: string } }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    githubLink: '',
    demoLink: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background">
          <Navbar />
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
            <div className="glass-card p-12 border-lime-400/20 max-w-md w-full text-center">
              <CheckCircle className="w-16 h-16 text-lime-300 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">Submission Successful!</h1>
              <p className="text-gray-400 mb-8">
                Your project has been submitted and stored on IPFS. Submission hash has been recorded on-chain.
              </p>
              <div className="bg-black/30 p-4 rounded-lg mb-8 text-left">
                <div className="text-xs text-gray-400 mb-2">Submission Hash (IPFS)</div>
                <div className="text-sm font-mono text-cyan-300 break-all">
                  QmX4k5P9j3K2L8M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href={`/competition/${params.competitionId}`}
                  className="btn-neon-cyan w-full block"
                >
                  View Competition
                </Link>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-ghost-neon w-full"
                >
                  Submit Another Project
                </button>
              </div>
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

        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-2">Submit Your Project</h1>
            <p className="text-xl text-gray-400">Share your innovation with our judges</p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Decentralized AI Protocol"
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Project Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      placeholder="Describe your project, what problem it solves, and why it's innovative..."
                      rows={6}
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                    />
                  </div>

                  {/* GitHub Link */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      GitHub Repository Link *
                    </label>
                    <input
                      type="url"
                      name="githubLink"
                      value={formData.githubLink}
                      onChange={handleChange}
                      required
                      placeholder="https://github.com/username/project"
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                    />
                  </div>

                  {/* Demo Link */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Demo or Live Link
                    </label>
                    <input
                      type="url"
                      name="demoLink"
                      value={formData.demoLink}
                      onChange={handleChange}
                      placeholder="https://demo.example.com"
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Additional Files (Optional)
                    </label>
                    <div className="relative border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors duration-300 cursor-pointer">
                      <Upload className="w-8 h-8 text-cyan-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 mb-1">Drag and drop files or click to browse</p>
                      <p className="text-xs text-gray-500">PDF, ZIP, or image files supported</p>
                      <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-neon-cyan w-full py-3 text-lg"
                  >
                    Submit Project
                  </button>
                </form>
              </div>

              {/* Info Sidebar */}
              <div className="space-y-6">
                {/* Info Card */}
                <div className="glass-card p-6 border-cyan-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Submission Info</h3>
                  <div className="space-y-4 text-sm text-gray-400">
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                      <p>Your submission will be stored on IPFS</p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                      <p>Submission hash recorded on blockchain</p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                      <p>Anonymous to judges during voting</p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                      <p>Can edit before deadline</p>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="glass-card p-6 border-purple-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex gap-2">
                      <span className="text-purple-300">•</span>
                      <span>Working prototype or demo</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-300">•</span>
                      <span>Public GitHub repository</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-300">•</span>
                      <span>Clear documentation</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-300">•</span>
                      <span>Team info (max 5 members)</span>
                    </li>
                  </ul>
                </div>

                {/* Warning */}
                <div className="glass-card p-6 border-orange-500/20 bg-orange-500/5">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Deadline</h4>
                      <p className="text-sm text-gray-400">
                        Submissions close on April 15, 2024 at 11:59 PM UTC
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
