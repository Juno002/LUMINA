import { useEffect, useState } from 'react';

function getIsPageVisible() {
  if (typeof document === 'undefined') {
    return true;
  }

  return document.visibilityState !== 'hidden';
}

export function usePageVisibility() {
  const [isPageVisible, setIsPageVisible] = useState(getIsPageVisible);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const syncVisibility = () => {
      setIsPageVisible(getIsPageVisible());
    };

    document.addEventListener('visibilitychange', syncVisibility);
    window.addEventListener('focus', syncVisibility);
    window.addEventListener('blur', syncVisibility);

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      window.removeEventListener('focus', syncVisibility);
      window.removeEventListener('blur', syncVisibility);
    };
  }, []);

  return isPageVisible;
}
