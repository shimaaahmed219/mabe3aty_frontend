import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import './index.css';
import App from './App';
import { RootErrorBoundary } from './components/RootErrorBoundary';

{
  const raw = localStorage.getItem('theme');
  const stored = raw === 'light' || raw === 'dark' ? raw : null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = stored ?? (prefersDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('عنصر #root غير موجود في index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <RootErrorBoundary>
      <Provider store={store}>
        <App />
      </Provider>
    </RootErrorBoundary>
  </StrictMode>
);
