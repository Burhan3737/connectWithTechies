import { createContext, use } from 'react';
import type { AppViewModel } from '../viewmodel/useAppViewModel';

/** The view-model, shared with every view. Views read it; they never build state of their own. */
export const AppContext = createContext<AppViewModel | null>(null);

export function useApp(): AppViewModel {
  const vm = use(AppContext);
  if (!vm) throw new Error('useApp() must be used inside <AppContext>');
  return vm;
}

/** The view-model when there is one (the masthead also renders while loading). */
export const useMaybeApp = () => use(AppContext);
