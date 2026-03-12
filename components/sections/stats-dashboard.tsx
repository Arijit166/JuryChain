'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Trophy, Zap } from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  targetValue: number;
  suffix: string;
  icon: React.ReactNode;
  textColor: string;
  borderColor: string;
  gradientColor: string;
}

export function StatsDashboard() {
  const [stats, setStats] = useState<Stat[]>([
    {
      label: 'Total Prize Distributed',
      value: 0,
      targetValue: 12500000,
      suffix: '',
      icon: <TrendingUp className="w-6 h-6" />,
      textColor: '#00d9ff',
      borderColor: 'rgba(0, 217, 255, 0.2)',
      gradientColor: 'linear-gradient(to right, rgb(0, 217, 255), rgb(0, 200, 255))',
    },
    {
      label: 'Total Competitions',
      value: 0,
      targetValue: 2847,
      suffix: '',
      icon: <Trophy className="w-6 h-6" />,
      textColor: '#c77dff',
      borderColor: 'rgba(199, 125, 255, 0.2)',
      gradientColor: 'linear-gradient(to right, rgb(157, 78, 221), rgb(199, 125, 255))',
    },
    {
      label: 'Total Judges',
      value: 0,
      targetValue: 8234,
      suffix: '+',
      icon: <Users className="w-6 h-6" />,
      textColor: '#39ff14',
      borderColor: 'rgba(57, 255, 20, 0.2)',
      gradientColor: 'linear-gradient(to right, rgb(57, 255, 20), rgb(100, 255, 100))',
    },
    {
      label: 'Total Participants',
      value: 0,
      targetValue: 45000,
      suffix: '+',
      icon: <Zap className="w-6 h-6" />,
      textColor: '#a78bfa',
      borderColor: 'rgba(167, 139, 250, 0.2)',
      gradientColor: 'linear-gradient(to right, rgb(139, 92, 246), rgb(167, 139, 250))',
    },
  ]);

  useEffect(() => {
    // Animate counters
    const timers = stats.map((stat, idx) => {
      const increment = stat.targetValue / 50;
      const timer = setInterval(() => {
        setStats((prevStats) => {
          const newStats = [...prevStats];
          if (newStats[idx].value < newStats[idx].targetValue) {
            newStats[idx].value = Math.min(
              newStats[idx].value + increment,
              newStats[idx].targetValue
            );
          }
          return newStats;
        });
      }, 30);
      return timer;
    });

    return () => timers.forEach(clearInterval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return Math.floor(num).toString();
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              Platform Metrics
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real-time data from our trustless competition protocol
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-card p-6 group hover:border-cyan-500/50 transition-all duration-300 animate-float-up"
              style={{
                animationDelay: `${index * 100}ms`,
                borderColor: stat.borderColor,
              }}
            >
              {/* Icon */}
              <div 
                className="inline-flex p-3 rounded-lg bg-black/50 mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{ color: stat.textColor }}
              >
                {stat.icon}
              </div>

              {/* Value */}
              <div 
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{ color: stat.textColor }}
              >
                {formatNumber(stat.value)}
                {stat.suffix}
              </div>

              {/* Label */}
              <p className="text-gray-400 text-sm">{stat.label}</p>

              {/* Progress Bar */}
              <div className="mt-4 h-1 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(stat.value / stat.targetValue) * 100}%`,
                    background: stat.gradientColor,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
