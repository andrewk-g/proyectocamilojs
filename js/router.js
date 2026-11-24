/**
 * Router basado en hash (#/ruta). Cada ruta monta un Web Component dentro
 * del <main>. Las rutas "private" exigen sesión; las "guestOnly" solo se
 * muestran sin sesión (p. ej. el login).
 */
import { isAuthenticated } from './services/auth.service.js';

const REDIRECT_KEY = 'acme:redirect';
const HOME_PRIVATE = '/usuarios';
const HOME_PUBLIC = '/login';

const routes = [
  { path: '/login', tag: 'login-view', title: 'Iniciar sesión', guestOnly: true },
  { path: '/usuarios', tag: 'users-view', title: 'Gestión de usuarios', private: true },
];

function compile(path) {
  const names = [];
  const pattern = path.replace(/:(\w+)/g, (_, name) => {
    names.push(name);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${pattern}/?$`), names };
}

const compiled = routes.map((route) => ({ route, ...compile(route.path) }));

function match(path) {
  for (const { route, regex, names } of compiled) {
    const result = path.match(regex);
    if (result) {
      const params = Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(result[i + 1])]));
      return { route, params };
    }
  }
  return null;
}

const currentPath = () => location.hash.slice(1) || '/';

export function navigate(path) {
  if (currentPath() === path) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = `#${path}`;
  }
}

/** Ruta a la que se envía al usuario después de iniciar sesión. */
export function consumeRedirect() {
  const target = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return target && match(target)?.route.private ? target : HOME_PRIVATE;
}

function render(outlet) {
  const path = currentPath();
  const found = match(path);
  const authenticated = isAuthenticated();

  if (!found) {
    navigate(authenticated ? HOME_PRIVATE : HOME_PUBLIC);
    return;
  }

  const { route, params } = found;

  if (route.private && !authenticated) {
    sessionStorage.setItem(REDIRECT_KEY, path);
    navigate('/login');
    return;
  }
  if (route.guestOnly && authenticated) {
    navigate(HOME_PRIVATE);
    return;
  }

  const view = document.createElement(route.tag);
  view.params = params;
  view.classList.add('view');

  outlet.focus({ preventScroll: true });
  outlet.replaceChildren(view);
  window.scrollTo({ top: 0 });
  document.title = `${route.title} · Acme School`;
  window.dispatchEvent(new CustomEvent('route:change', { detail: { path } }));
}

export function startRouter(outlet) {
  window.addEventListener('hashchange', () => render(outlet));
  render(outlet);
}
