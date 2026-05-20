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

  // Register Service Worker for PWA (Faster Loads & Auto-updates)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('ServiceWorker registered with scope:', registration.scope);
        
        // Listen for new code pushed to the server (GitHub/Deployment updates)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update found - forcefully reload the page to apply the latest frontend code
              window.location.reload();
            }
          });
        });
      }).catch(err => console.error('ServiceWorker registration failed:', err));
    });
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}