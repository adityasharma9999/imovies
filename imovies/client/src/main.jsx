import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/Auth';
import { UIProvider } from './context/UI';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><BrowserRouter><AuthProvider><UIProvider><App /></UIProvider></AuthProvider></BrowserRouter></StrictMode>
);
