import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { IterumModule } from './index.ts';
import { IterumProvider } from './module/IterumProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <IterumProvider>
        <IterumModule />
      </IterumProvider>
    </ErrorBoundary>
  </StrictMode>,
);
