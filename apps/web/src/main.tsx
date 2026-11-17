import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './design/global.css';
import { tokensCss } from './design/tokens';

const style = document.createElement('style');
style.textContent = tokensCss();
document.head.append(style);

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
