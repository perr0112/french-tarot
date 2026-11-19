import { useEffect, useState } from 'react';

export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'room'; readonly code: string }
  /** The card contact sheet, for reviewing card art; development builds only. */
  | { readonly name: 'cards' };

const ROOM_PATH = /^\/salle\/([A-Z0-9]{6})\/?$/;

const CARDS_PATH = /^\/dev\/cartes\/?$/;

export function routeOf(pathname: string, dev: boolean = import.meta.env.DEV): Route {
  if (dev && CARDS_PATH.test(pathname)) return { name: 'cards' };
  const match = ROOM_PATH.exec(pathname);
  return match?.[1] ? { name: 'room', code: match[1] } : { name: 'home' };
}

export const roomPath = (code: string) => `/salle/${code}`;

export function navigate(path: string): void {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => routeOf(window.location.pathname));
  useEffect(() => {
    const update = () => setRoute(routeOf(window.location.pathname));
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  return route;
}
