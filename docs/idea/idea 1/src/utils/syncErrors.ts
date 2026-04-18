import { useUIStore } from '../store/useUIStore';

type SyncContext =
  | 'profile'
  | 'habits'
  | 'habit_logs'
  | 'tasks'
  | 'objectives';

const contextLabels: Record<SyncContext, string> = {
  profile: 'perfil',
  habits: 'hábitos',
  habit_logs: 'registros de hábitos',
  tasks: 'tareas',
  objectives: 'objetivos',
};

/**
 * Handles sync errors consistently across all stores.
 * Logs the error and shows a user-friendly toast.
 * Returns void so it can be used in .catch() chains.
 */
export function handleSyncError(error: unknown, context: SyncContext): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Sync Error - ${context}]`, error);

  // Avoid spamming toasts for network errors
  const isNetworkError =
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError');

  const { setToast } = useUIStore.getState();
  setToast({
    isOpen: true,
    title: isNetworkError ? 'Sin Conexión' : 'Error de Sincronización',
    message: isNetworkError
      ? `Los cambios en ${contextLabels[context]} se guardarán cuando vuelva la conexión.`
      : `No se pudo sincronizar ${contextLabels[context]}. Los cambios se mantienen localmente.`,
  });
}
