import { lazy, Suspense } from 'react';
import { useRoute } from './net/routing';
import { Home } from './screens/Home';
import { Room } from './screens/Room';

// Vite replaces import.meta.env.DEV with false in production builds, which drops the sheet.
const ContactSheet = import.meta.env.DEV
  ? lazy(() => import('./screens/ContactSheet').then((m) => ({ default: m.ContactSheet })))
  : null;

export function App() {
  const route = useRoute();
  if (route.name === 'cards' && ContactSheet) {
    return (
      <Suspense>
        <ContactSheet />
      </Suspense>
    );
  }
  return route.name === 'room' ? <Room key={route.code} code={route.code} /> : <Home />;
}
