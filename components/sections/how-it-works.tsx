'use client';

import { Lightbulb, Users, Gift } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Create Competition',
      description: 'Set up your competition with prize pool, deadline, and judges using cryptographic verification',
      icon: <Lightbulb className="w-8 h-8" />,
      bgColor: 'rgb(0, 217, 255)',
      shadowColor: 'rgba(0, 217, 255, 0.5)',
      textColor: '#00d9ff',
    },
    {
      number: 2,
      title: 'Judge Submissions',
      description: 'Judges review and vote on projects using anonymous identity and zero-knowledge proofs',
      icon: <Users className="w-8 h-8" />,
      bgColor: 'rgb(157, 78, 221)',
      shadowColor: 'rgba(157, 78, 221, 0.5)',
      textColor: '#9d4edd',
    },
    {
      number: 3,
      title: 'Distribute Prizes',
      description: 'Winners automatically receive prizes directly to their wallets via smart contracts',
      icon: <Gift className="w-8 h-8" />,
      bgColor: 'rgb(57, 255, 20)',
      shadowColor: 'rgba(57, 255, 20, 0.5)',
      textColor: '#39ff14',
    },
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Three simple steps to run trustless competitions
          </p>
        </div>

        {/* Timeline Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Line (Desktop Only) */}
          <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-lime-400 -z-10"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative animate-float-up" style={{ animationDelay: `${index * 100}ms` }}>
              {/* Step Card */}
              <div className="glass-card p-8 border-cyan-500/20 group">
                {/* Number Circle */}
                <div 
                  className="absolute -top-6 left-6 w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-lg group-hover:shadow-lg transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${step.bgColor}, ${step.bgColor}dd)`,
                    boxShadow: `0 0 0 0, 0 0 20px ${step.shadowColor}`,
                  }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300 mt-4" style={{ color: step.textColor }}>
                  {step.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>

                {/* Bottom Accent */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${step.bgColor}80, transparent)`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Process Description */}
        <div className="mt-16 glass-card p-8 border-purple-500/20">
          <h3 className="text-2xl font-bold text-white mb-4">Zero-Knowledge Magic</h3>
          <p className="text-gray-400 leading-relaxed">
            Our protocol uses zero-knowledge proofs to ensure judge anonymity while maintaining vote integrity. Each judge generates a unique anonymous identity using their wallet signature and a secret phrase. Votes are committed first (hash-based), then revealed after the voting period closes, ensuring transparency without compromising privacy.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="badge-primary">Anonymous Identity</span>
            <span className="badge-secondary">ZK Proofs</span>
            <span className="badge-primary">Smart Contracts</span>
          </div>
        </div>
      </div>
    </section>
  );
}
