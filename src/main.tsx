import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './shared/components/ErrorBoundary.tsx';
import { initializeNativeAppShell } from './infrastructure/platform/NativeAppShell.ts';

void initializeNativeAppShell().catch((error) => {
  console.error('Native app shell initialization failed:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
