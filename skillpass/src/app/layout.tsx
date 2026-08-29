import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillPass',
  description: 'One subscription for verified local activities for children aged 6–17.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
