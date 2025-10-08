import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalLeadFormModal } from "@/components/lead-form/GlobalLeadFormModal";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import GeneratedPage from "./pages/GeneratedPage";
import StaticPage from "./pages/StaticPage";

// Dashboard pages
import Leads from "./pages/dashboard/Leads";
import LeadDetail from "./pages/dashboard/LeadDetail";
import Accounts from "./pages/dashboard/Accounts";
import AccountDetail from "./pages/dashboard/AccountDetail";
import ProjectDetail from "./pages/dashboard/ProjectDetail";
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
import Templates from "./pages/dashboard/settings/Templates";
import StaticPages from "./pages/dashboard/settings/StaticPages";
import FormFields from "./pages/dashboard/settings/FormFields";
import Analytics from "./pages/dashboard/settings/Analytics";
import QATesting from "./pages/dashboard/settings/QATesting";
import PageRegenerator from "./pages/dashboard/PageRegenerator";

// Customer portal pages
import CustomerAuth from "./pages/customer/CustomerAuth";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerProjects from "./pages/customer/CustomerProjects";
import CustomerAppointments from "./pages/customer/CustomerAppointments";
import CustomerInvoices from "./pages/customer/CustomerInvoices";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlobalLeadFormModal />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Customer Portal Routes */}
          <Route path="/customer/login" element={<CustomerAuth />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/projects" element={<CustomerProjects />} />
          <Route path="/customer/appointments" element={<CustomerAppointments />} />
          <Route path="/customer/invoices" element={<CustomerInvoices />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/leads" element={<Leads />} />
          <Route path="/dashboard/leads/:id" element={<LeadDetail />} />
          <Route path="/dashboard/accounts" element={<Accounts />} />
          <Route path="/dashboard/accounts/:id" element={<AccountDetail />} />
          <Route path="/dashboard/projects/:id" element={<ProjectDetail />} />
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
          <Route path="/dashboard/settings/templates" element={<Templates />} />
          <Route path="/dashboard/settings/static-pages" element={<StaticPages />} />
          <Route path="/dashboard/settings/form-fields" element={<FormFields />} />
          <Route path="/dashboard/settings/analytics" element={<Analytics />} />
          <Route path="/dashboard/settings/qa-testing" element={<QATesting />} />
          <Route path="/dashboard/regenerate-pages" element={<PageRegenerator />} />
          
          {/* Dynamic Generated Pages */}
          <Route path="/:citySlug/:serviceSlug" element={<GeneratedPage />} />
          
          {/* Static Pages (must be after all other routes) */}
          <Route path="/:slug" element={<StaticPage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
