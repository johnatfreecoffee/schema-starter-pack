import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalLeadFormModal } from "@/components/lead-form/GlobalLeadFormModal";
import { useCacheWarming } from "@/hooks/useCacheWarming";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Contacts from "./pages/dashboard/Contacts";
import ContactDetail from "./pages/dashboard/ContactDetail";
import GeneratedPage from "./pages/GeneratedPage";
import StaticPage from "./pages/StaticPage";

// Dashboard pages
import Leads from "./pages/dashboard/Leads";
import LeadDetail from "./pages/dashboard/LeadDetail";
import Accounts from "./pages/dashboard/Accounts";
import AccountDetail from "./pages/dashboard/AccountDetail";
import ProjectDetail from "./pages/dashboard/ProjectDetail";
import TasksAdvanced from "./pages/dashboard/TasksAdvanced";
import TaskDetail from "./pages/dashboard/TaskDetail";
import AppointmentsAdvanced from "./pages/dashboard/AppointmentsAdvanced";
import AppointmentDetail from "./pages/dashboard/AppointmentDetail";
import Projects from "./pages/dashboard/Projects";
import MoneyAdvanced from "./pages/dashboard/MoneyAdvanced";
import QuoteDetail from "./pages/dashboard/QuoteDetail";
import InvoiceDetail from "./pages/dashboard/InvoiceDetail";
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
import Analytics from "./pages/dashboard/Analytics";
import QATesting from "./pages/dashboard/settings/QATesting";
import PageRegenerator from "./pages/dashboard/PageRegenerator";
import EmailTemplates from "./pages/dashboard/settings/EmailTemplates";
import Notifications from "./pages/dashboard/settings/Notifications";
import PerformanceSettings from "./pages/dashboard/settings/Performance";
import BackupManagement from "./pages/dashboard/settings/BackupManagement";
import EmailQueue from "./pages/dashboard/EmailQueue";
import Team from "./pages/dashboard/Team";
import Import from "./pages/dashboard/Import";
import ImportHistory from "./pages/dashboard/ImportHistory";
import AcceptInvite from "./pages/AcceptInvite";
import Workflows from "./pages/dashboard/Workflows";
import WorkflowBuilder from "./pages/dashboard/WorkflowBuilder";
import WorkflowMonitor from "./pages/dashboard/WorkflowMonitor";
import WorkflowTemplates from "./pages/dashboard/WorkflowTemplates";
import WorkflowTesting from "./pages/dashboard/WorkflowTesting";
import SEO from "./pages/dashboard/SEO";
import Reports from "./pages/dashboard/Reports";
import ReportBuilder from "./pages/dashboard/ReportBuilder";
import ReportDetail from "./pages/dashboard/ReportDetail";
import Reviews from "./pages/dashboard/Reviews";
import ReviewDetail from "./pages/dashboard/ReviewDetail";
import ReviewNew from "./pages/dashboard/ReviewNew";
import CustomerSubmitReview from "./pages/customer/CustomerSubmitReview";
import CustomerMyReviews from "./pages/customer/CustomerMyReviews";
import ReviewsPage from "./pages/Reviews";

// Customer portal pages
import CustomerAuth from "./pages/customer/CustomerAuth";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerProjects from "./pages/customer/CustomerProjects";
import CustomerProjectDetail from "./pages/customer/CustomerProjectDetail";
import CustomerAppointments from "./pages/customer/CustomerAppointments";
import CustomerInvoices from "./pages/customer/CustomerInvoices";
import CustomerSupport from "./pages/customer/CustomerSupport";
import CustomerSubmitTicket from "./pages/customer/CustomerSubmitTicket";
import CustomerTicketDetail from "./pages/customer/CustomerTicketDetail";

// Ticket management pages
import Tickets from "./pages/dashboard/Tickets";
import TicketNew from "./pages/dashboard/TicketNew";
import TicketDetail from "./pages/dashboard/TicketDetail";
import CannedResponses from "./pages/dashboard/CannedResponses";
import TicketTemplates from "./pages/dashboard/TicketTemplates";
import AutoAssignment from "./pages/dashboard/AutoAssignment";

const queryClient = new QueryClient();

const AppContent = () => {
  // Warm cache on app initialization
  useCacheWarming();
  
  return (
    <>
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
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          
          {/* Customer Portal Routes */}
          <Route path="/customer/login" element={<CustomerAuth />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/projects" element={<CustomerProjects />} />
          <Route path="/customer/projects/:id" element={<CustomerProjectDetail />} />
          <Route path="/customer/appointments" element={<CustomerAppointments />} />
          <Route path="/customer/invoices" element={<CustomerInvoices />} />
          <Route path="/customer/support" element={<CustomerSupport />} />
          <Route path="/customer/support/new" element={<CustomerSubmitTicket />} />
          <Route path="/customer/support/:id" element={<CustomerTicketDetail />} />
          <Route path="/portal/submit-review" element={<CustomerSubmitReview />} />
          <Route path="/portal/my-reviews" element={<CustomerMyReviews />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/team" element={<Team />} />
          <Route path="/dashboard/import" element={<Import />} />
          <Route path="/dashboard/import/history" element={<ImportHistory />} />
          <Route path="/dashboard/leads" element={<Leads />} />
          <Route path="/dashboard/leads/:id" element={<LeadDetail />} />
          <Route path="/dashboard/accounts" element={<Accounts />} />
          <Route path="/dashboard/accounts/:id" element={<AccountDetail />} />
          <Route path="/dashboard/contacts" element={<Contacts />} />
          <Route path="/dashboard/contacts/:id" element={<ContactDetail />} />
          <Route path="/dashboard/projects/:id" element={<ProjectDetail />} />
          <Route path="/dashboard/tasks" element={<TasksAdvanced />} />
          <Route path="/dashboard/tasks/:id" element={<TaskDetail />} />
          <Route path="/dashboard/appointments" element={<AppointmentsAdvanced />} />
          <Route path="/dashboard/appointments/:id" element={<AppointmentDetail />} />
          <Route path="/dashboard/calendars" element={<AppointmentsAdvanced />} />
          <Route path="/dashboard/projects" element={<Projects />} />
          <Route path="/dashboard/money" element={<MoneyAdvanced />} />
          <Route path="/dashboard/quotes/:id" element={<QuoteDetail />} />
          <Route path="/dashboard/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/dashboard/logs" element={<Logs />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/reports/new" element={<ReportBuilder />} />
          <Route path="/dashboard/reports/:id" element={<ReportDetail />} />
          <Route path="/dashboard/reviews" element={<Reviews />} />
          <Route path="/dashboard/reviews/new" element={<ReviewNew />} />
          <Route path="/dashboard/reviews/:id" element={<ReviewDetail />} />
          <Route path="/dashboard/tickets" element={<Tickets />} />
          <Route path="/dashboard/tickets/new" element={<TicketNew />} />
          <Route path="/dashboard/tickets/:id" element={<TicketDetail />} />
          <Route path="/dashboard/settings/canned-responses" element={<CannedResponses />} />
          <Route path="/dashboard/settings/ticket-templates" element={<TicketTemplates />} />
          <Route path="/dashboard/settings/auto-assignment" element={<AutoAssignment />} />
          
          {/* Settings Sub-routes (Admin Only) */}
          <Route path="/dashboard/settings/company" element={<CompanySettings />} />
          <Route path="/dashboard/settings/ai-training" element={<AITraining />} />
          <Route path="/dashboard/settings/site-settings" element={<SiteSettings />} />
          <Route path="/dashboard/settings/services" element={<ServicesSettings />} />
          <Route path="/dashboard/settings/service-areas" element={<ServiceAreas />} />
          <Route path="/dashboard/settings/templates" element={<Templates />} />
          <Route path="/dashboard/settings/static-pages" element={<StaticPages />} />
          <Route path="/dashboard/settings/form-fields" element={<FormFields />} />
          <Route path="/dashboard/settings/email-templates" element={<EmailTemplates />} />
          <Route path="/dashboard/settings/notifications" element={<Notifications />} />
          <Route path="/dashboard/settings/qa-testing" element={<QATesting />} />
          <Route path="/dashboard/settings/performance" element={<PerformanceSettings />} />
          <Route path="/dashboard/settings/backup-management" element={<BackupManagement />} />
          <Route path="/dashboard/email-queue" element={<EmailQueue />} />
          <Route path="/dashboard/regenerate-pages" element={<PageRegenerator />} />
          
          {/* Workflow Automation Routes */}
          <Route path="/admin/automation/workflows" element={<Workflows />} />
          <Route path="/admin/automation/workflows/:id" element={<WorkflowBuilder />} />
          <Route path="/admin/automation/monitor" element={<WorkflowMonitor />} />
          <Route path="/admin/automation/templates" element={<WorkflowTemplates />} />
          <Route path="/admin/automation/testing" element={<WorkflowTesting />} />
          
          {/* SEO Management Routes */}
          <Route path="/dashboard/settings/seo" element={<SEO />} />
          
          {/* Dynamic Generated Pages */}
          <Route path="/:citySlug/:serviceSlug" element={<GeneratedPage />} />
          
          {/* Static Pages (must be after all other routes) */}
          <Route path="/:slug" element={<StaticPage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
