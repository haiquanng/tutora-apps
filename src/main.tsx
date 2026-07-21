import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// KaTeX import ở đây (không phải index.css) để Vite resolve được đường dẫn font.
import 'katex/dist/katex.min.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
