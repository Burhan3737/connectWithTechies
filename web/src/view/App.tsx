import { useDataset } from '../viewmodel/useDataset';
import { useAppViewModel } from '../viewmodel/useAppViewModel';
import type { Indexes } from '../model/repository';
import { AppContext } from './context';
import { Masthead } from './components/Masthead';
import { FilterBar } from './components/FilterBar';
import { ResultBar } from './components/ResultBar';
import { Board } from './components/Board';
import { CalendarView } from './components/CalendarView';
import { EmptyState } from './components/EmptyState';
import { Footer } from './components/Footer';

/**
 * The composition root. Loads the data, then hands an indexed dataset to the
 * view-model; every component below reads the view-model from context.
 */
export function App() {
  const data = useDataset();
  if (data.status !== 'ready') {
    return (
      <>
        <div className="grain" aria-hidden="true" />
        <Masthead />
        <main>
          <section className="board" id="board" aria-live="polite" aria-busy={data.status === 'loading'}>
            <p className="board__loading" role={data.status === 'error' ? 'alert' : undefined}>
              {data.status === 'error' ? data.message : 'Reading the board…'}
            </p>
          </section>
        </main>
      </>
    );
  }
  return <Ready indexes={data.indexes} />;
}

function Ready({ indexes }: { indexes: Indexes }) {
  const vm = useAppViewModel(indexes);
  return (
    <AppContext value={vm}>
      <div className="grain" aria-hidden="true" />
      <Masthead />
      <FilterBar />
      <main>
        <ResultBar />
        <Board />
        <CalendarView />
        <EmptyState />
      </main>
      <Footer />
    </AppContext>
  );
}
