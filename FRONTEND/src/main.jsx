import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './style.css';
import transparentLogo from '../../MEDIA/transparent-logo.png';

// Ensure root element exists
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
} else {
  // Dynamically set the website favicon to the official logo
  let favicon = document.querySelector("link[rel~='icon']");
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.href = transparentLogo;

  // Respect saved theme instead of forcing light mode on load
  const savedTheme = localStorage.getItem('morpheus_theme');
  if (savedTheme === 'amoled') {
    document.documentElement.classList.add('theme-amoled', 'dark');
    document.body.style.backgroundColor = '#000000';
  } else {
    document.documentElement.classList.remove('dark', 'theme-amoled');
    document.body.className = '';
    document.body.style.backgroundColor = '#fcfcfd';
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}