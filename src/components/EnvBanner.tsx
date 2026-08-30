import { APP_ENV, FIREBASE_PROJECT_ID } from '../lib/firebase';

/**
 * Names the environment on any non-production build, so a QA tab is never
 * mistaken for the real app. Renders nothing in production.
 */
export default function EnvBanner() {
  if (APP_ENV === 'production') return null;

  return (
    <div className="sticky top-0 z-[100] bg-amber-500 text-black text-center text-xs font-black uppercase tracking-widest py-1 px-2">
      {APP_ENV} · {FIREBASE_PROJECT_ID}
    </div>
  );
}
