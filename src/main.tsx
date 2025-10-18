import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from "./App.tsx";
import { useEmailTriggers } from './hooks/useEmailTriggers';
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1
    }
  }
});

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
