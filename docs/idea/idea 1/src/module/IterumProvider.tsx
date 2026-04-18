import { useEffect } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import {
  createLocalStorageAdapter,
  setIterumStorageAdapter,
  type IterumStorageAdapter,
} from '../core/storage/iterumStorage';

export interface IterumProviderProps {
  children: React.ReactNode;
  storage?: IterumStorageAdapter;
}

export function IterumProvider({ children, storage }: IterumProviderProps) {
  useEffect(() => {
    setIterumStorageAdapter(storage ?? createLocalStorageAdapter());
  }, [storage]);

  return <ThemeProvider>{children}</ThemeProvider>;
}
