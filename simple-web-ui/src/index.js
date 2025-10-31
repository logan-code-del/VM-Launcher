// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// CSS is served statically from public/styles/main.css to avoid requiring css loaders

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);