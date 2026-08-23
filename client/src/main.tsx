import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { ChatProvider } from './context/ChatContext.js';
import { ChatApp } from './App.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <ChatApp />
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
