import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import type { BandMark } from '../model/bands';

type Jump = (mark: BandMark) => void;
interface Jumper {
  /** The board says how to reach a band; returns how to take that back. */
  register(fn: Jump): () => void;
  jump: Jump;
}

const JumpContext = createContext<Jumper>({ register: () => () => {}, jump() {} });
export const useJump = () => useContext(JumpContext);

/**
 * Lets the controls that sit beside the board (the phone's jump chips) ask it
 * to scroll, without the board's scroller being handed around as a prop.
 */
export function JumpProvider({ children }: { children: ReactNode }) {
  const current = useRef<Jump | null>(null);
  const value = useMemo<Jumper>(() => ({
    register(fn) {
      current.current = fn;
      return () => { if (current.current === fn) current.current = null; };
    },
    jump: (mark) => current.current?.(mark),
  }), []);
  return <JumpContext value={value}>{children}</JumpContext>;
}
