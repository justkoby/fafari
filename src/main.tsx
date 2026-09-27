import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/header.css';
import './styles/hero.css';
import './styles/search.css';
import './styles/discovery.css';
import './styles/shop.css';
import './styles/founder.css';
import './styles/client-cam.css';
import './styles/custom-order.css';
import './styles/footer.css';
import './styles/assistant.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
