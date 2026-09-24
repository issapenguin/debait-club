import { getServiceClient, getSessionUser } from '@/lib/supabase/server';
import { ContactForm } from './ContactForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contact Us — Debait Club',
  description: 'Questions or feedback? Send Debait Club a message.',
};

export default async function ContactPage() {
  const user = await getSessionUser();
  let asLabel: string | null = null;
  if (user) {
    const service = getServiceClient();
    if (service) {
      const { data: profile } = await service
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .maybeSingle();
      const p = profile as { username: string; display_name: string | null } | null;
      asLabel = p ? `${p.display_name ?? p.username} (@${p.username})` : (user.email ?? null);
    } else {
      asLabel = user.email ?? null;
    }
  }

  return (
    <div className="mx-auto max-w-xl pt-10 pb-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        Contact Us
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Questions or feedback? We read everything.
      </p>
      <ContactForm loggedIn={Boolean(user)} asLabel={asLabel} />
    </div>
  );
}
