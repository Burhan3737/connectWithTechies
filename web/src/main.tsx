import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import '@fontsource/b612/400.css';
import '@fontsource/b612/700.css';
import '@fontsource/big-shoulders-display/400';
import '@fontsource/big-shoulders-display/500';
import '@fontsource/big-shoulders-display/600';
import '@fontsource/big-shoulders-display/700';
import './styles/index.css';
import { App } from './view/App';
import { prefetchDataset, prefetchPlaces } from './viewmodel/useDataset';

prefetchDataset();
prefetchPlaces();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {import.meta.env.VITE_ON_VERCEL && <Analytics />}
  </StrictMode>,
);
