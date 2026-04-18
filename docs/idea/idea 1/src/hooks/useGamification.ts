import { useAppStatsStore } from '../store/useAppStatsStore';

interface UseGamificationProps {
  onLevelUp?: (level: number) => void;
}

export function useGamification({ onLevelUp }: UseGamificationProps = {}) {
  const { stats, addExp, completeOnboarding, setStats } = useAppStatsStore();

  const handleAddExp = (amount: number, type: 'discipline' | 'consistency') => {
    addExp(amount, type, onLevelUp);
  };

  return { stats, addExp: handleAddExp, completeOnboarding, setStats };
}
