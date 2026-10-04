import { useApp } from '../context';

/** Shown when the filters leave nothing — with the way out. */
export function EmptyState() {
  const { board, shown, actions } = useApp();
  if (shown.view === 'calendar' || board.events.length) return null;
  return (
    <p className="board__empty" id="empty">
      <strong>Nothing on the board.</strong>
      Loosen a filter — try{' '}
      <button type="button" className="linky" data-reset onClick={actions.reset}>clearing everything</button>.
    </p>
  );
}
