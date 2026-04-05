import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './style.css';

// Ensure root element exists
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
} else {
  // Forcefully strip any rogue dark mode classes from the HTML/Body tags
  document.documentElement.classList.remove('dark');
  document.body.className = '';
  document.body.style.backgroundColor = '#fcfcfd';

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}