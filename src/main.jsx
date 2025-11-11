import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import 'leaflet/dist/leaflet.css';

console.log('[main.jsx] Application starting');

window.addEventListener('error', (event) => {
  console.error('[Global Error Handler] Uncaught error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Error Handler] Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });
});

if (import.meta.env.DEV) {
  import('./utils/ticketDiagnostics');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
