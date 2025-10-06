import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";

// Dashboard pages
import Leads from "./pages/dashboard/Leads";
import Accounts from "./pages/dashboard/Accounts";
import Tasks from "./pages/dashboard/Tasks";
import Calendars from "./pages/dashboard/Calendars";
import Projects from "./pages/dashboard/Projects";
import Money from "./pages/dashboard/Money";
import Logs from "./pages/dashboard/Logs";
import Settings from "./pages/dashboard/Settings";

// Settings pages
import CompanySettings from "./pages/dashboard/settings/Company";
import AITraining from "./pages/dashboard/settings/AITraining";
import SiteSettings from "./pages/dashboard/settings/SiteSettings";
import ServicesSettings from "./pages/dashboard/settings/Services";
import ServiceAreas from "./pages/dashboard/settings/ServiceAreas";
import StaticPages from "./pages/dashboard/settings/StaticPages";
import Analytics from "./pages/dashboard/settings/Analytics";
import QATesting from "./pages/dashboard/settings/QATesting";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/leads" element={<Leads />} />
          <Route path="/dashboard/accounts" element={<Accounts />} />
          <Route path="/dashboard/tasks" element={<Tasks />} />
          <Route path="/dashboard/calendars" element={<Calendars />} />
          <Route path="/dashboard/projects" element={<Projects />} />
          <Route path="/dashboard/money" element={<Money />} />
          <Route path="/dashboard/logs" element={<Logs />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          
          {/* Settings Sub-routes (Admin Only) */}
          <Route path="/dashboard/settings/company" element={<CompanySettings />} />
          <Route path="/dashboard/settings/ai-training" element={<AITraining />} />
          <Route path="/dashboard/settings/site-settings" element={<SiteSettings />} />
          <Route path="/dashboard/settings/services" element={<ServicesSettings />} />
          <Route path="/dashboard/settings/service-areas" element={<ServiceAreas />} />
          <Route path="/dashboard/settings/static-pages" element={<StaticPages />} />
          <Route path="/dashboard/settings/analytics" element={<Analytics />} />
          <Route path="/dashboard/settings/qa-testing" element={<QATesting />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
