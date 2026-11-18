import { useRoute } from './net/routing';
import { Home } from './screens/Home';
import { Room } from './screens/Room';

export function App() {
  const route = useRoute();
  return route.name === 'room' ? <Room key={route.code} code={route.code} /> : <Home />;
}
