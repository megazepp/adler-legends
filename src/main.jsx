import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/adler-legends/service-worker.js', { updateViaCache: 'none' }).then((registration) => registration.update()).catch((error) => {
      console.warn('Service Worker konnte nicht registriert werden:', error);
    });
  });
}