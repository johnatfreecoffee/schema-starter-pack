import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from "./App.tsx";
import { useEmailTriggers } from './hooks/useEmailTriggers';
import { queryClient } from './lib/queryClient';
import "./index.css";

// Component to initialize email triggers
const EmailTriggersProvider = ({ children }: { children: React.ReactNode }) => {
  useEmailTriggers();
  return <>{children}</>;
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <EmailTriggersProvider>
          <App />
        </EmailTriggersProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
