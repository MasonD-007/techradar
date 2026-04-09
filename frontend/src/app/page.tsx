import LandingPageHeader from '@/components/landing-page-header';
import { ThemeToggle } from '@/components/light-dark-button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background">
      <ThemeToggle />
      <LandingPageHeader />
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
