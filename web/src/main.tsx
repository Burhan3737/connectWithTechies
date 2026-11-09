import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/b612/400.css';
import '@fontsource/b612/400-italic.css';
import '@fontsource/b612/700.css';
import '@fontsource/big-shoulders-display/400';
import '@fontsource/big-shoulders-display/500';
import '@fontsource/big-shoulders-display/600';
import '@fontsource/big-shoulders-display/700';
import './styles/index.css';
import { App } from './view/App';
import { prefetchDataset } from './viewmodel/useDataset';

prefetchDataset();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
