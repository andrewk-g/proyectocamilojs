/**
 * Punto de entrada: registra los Web Components, crea los datos iniciales
 * y arranca el router.
 */
import './components/app-toast.js';
import './components/app-confirm.js';
import './components/app-navbar.js';
import './views/login-view.js';
import './views/users-view.js';

import { ensureSeed } from './data/seed.js';
import { startRouter } from './router.js';
import { toast } from './utils/dom.js';

try {
  await ensureSeed();
} catch (error) {
  console.error(error);
  toast(error.message, 'error');
}

startRouter(document.getElementById('app'));
