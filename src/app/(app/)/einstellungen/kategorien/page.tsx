import { getServerSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from '@/lib/feature-flags';
import { CategorySubscriptionsClient } from './CategorySubscriptionsClient';

export default async function CategorySubscriptionsPage() {
  if (!FEATURE_CATEGORY_SUBSCRIPTIONS) {
    redirect('/einstellungen');
  }

  const session = await getServerSession();
  if (!session?.userId) {
    redirect('/login?callbackUrl=/einstellungen/kategorien');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Kategorie-Abos</h1>
        <p className="text-muted-foreground mt-2">
          Erhalte Benachrichtigungen, sobald ein neues Review in deinen Interessensbereichen erscheint.
        </p>
      </header>
      <CategorySubscriptionsClient />
    </div>
  );
}