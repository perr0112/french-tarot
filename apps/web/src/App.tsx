import { lazy, Suspense, useEffect } from 'react';
import { preloadScans } from './cards';
import { SeasonalAmbience } from './components/SeasonalAmbience';
import { useRoute } from './net/routing';
import { Home } from './screens/Home';
import { Room } from './screens/Room';

// Vite replaces import.meta.env.DEV with false in production builds, which drops the sheet.
const ContactSheet = import.meta.env.DEV
  ? lazy(() => import('./screens/ContactSheet').then((m) => ({ default: m.ContactSheet })))
  : null;

export function App() {
  const route = useRoute();
  // From the first page on, so the cards are cached long before a deal (about 2 MB).
  useEffect(preloadScans, []);
  if (route.name === 'cards' && ContactSheet) {
    return (
      <Suspense>
        <ContactSheet />
      </Suspense>
    );
  }
  return (
    <>
      {/* The season's drifting decorations, behind every screen. */}
      <SeasonalAmbience />
      {route.name === 'room' ? <Room key={route.code} code={route.code} /> : <Home />}
    </>
  );
}
