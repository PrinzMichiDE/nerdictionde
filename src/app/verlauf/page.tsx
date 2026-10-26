import { getServerSession } from '@/lib/session';
import { getReadingHistory } from '@/lib/reading-history';
import { FEATURE_READING_HISTORY } from '@/lib/feature-flags';
import { ReadingHistoryClient } from './ReadingHistoryClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Leseverlauf | Nerdiction',
  description: 'Dein persönlicher Leseverlauf: Sieh, welche Reviews du bereits gelesen hast und wie weit du gekommen bist.',
  robots: {
    index: false,
    follow: true,
  },
};

async function getHistoryData(userId: string) {
  return getReadingHistory(userId, null, 20);
}

export default async function ReadingHistoryPage() {
  if (!FEATURE_READING_HISTORY) {
    notFound();
  }

  const session = await getServerSession();

  if (!session) {
    // Nicht eingeloggte User sehen Login-Prompt im Client
    return <ReadingHistoryClient initialData={null} isAuthenticated={false} />;
  }

  const data = await getHistoryData(session.userId);

  return <ReadingHistoryClient initialData={data} isAuthenticated={true} />;
}