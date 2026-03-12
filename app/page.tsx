import { Navbar } from '@/components/layout/navbar';
import { HeroSection } from '@/components/sections/hero-section';
import { StatsDashboard } from '@/components/sections/stats-dashboard';
import { HowItWorks } from '@/components/sections/how-it-works';
import { ActiveCompetitions } from '@/components/sections/active-competitions';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsDashboard />
      <HowItWorks />
      <ActiveCompetitions />
    </main>
  );
}
