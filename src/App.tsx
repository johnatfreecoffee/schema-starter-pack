import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { GlobalLeadFormModal } from "@/components/lead-form/GlobalLeadFormModal";
import { useCacheWarming } from "@/hooks/useCacheWarming";
import AdminLayout from "./components/layout/AdminLayout";
import CustomerLayout from "./components/layout/CustomerLayout";
import PublicLayout from "./components/layout/PublicLayout";
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
import ServiceOverviewPage from "./pages/ServiceOverviewPage";
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
import KnowledgeBase from "./pages/dashboard/settings/KnowledgeBase";
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
import EmailSettings from "./pages/dashboard/settings/EmailSettings";
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
import SystemHealth from "./pages/dashboard/SystemHealth";

const AppContent = () => {
  // Warm cache on app initialization
  useCacheWarming();
  
  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen">
      <Toaster />
      <Sonner />
      <GlobalLeadFormModal />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:serviceSlug" element={<ServiceOverviewPage />} />
            <Route path="/services/:serviceSlug/:citySlug" element={<GeneratedPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/:slug" element={<StaticPage />} />
          </Route>
          
          {/* Customer Portal Routes */}
          <Route path="/customer/login" element={<CustomerAuth />} />
          <Route path="/customer" element={<CustomerLayout />}>
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="projects" element={<CustomerProjects />} />
            <Route path="projects/:id" element={<CustomerProjectDetail />} />
            <Route path="appointments" element={<CustomerAppointments />} />
            <Route path="invoices" element={<CustomerInvoices />} />
            <Route path="support" element={<CustomerSupport />} />
            <Route path="support/new" element={<CustomerSubmitTicket />} />
            <Route path="support/:id" element={<CustomerTicketDetail />} />
          </Route>
          <Route path="/portal/submit-review" element={<CustomerSubmitReview />} />
          <Route path="/portal/my-reviews" element={<CustomerMyReviews />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="team" element={<Team />} />
            <Route path="import" element={<Import />} />
            <Route path="import/history" element={<ImportHistory />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:id" element={<AccountDetail />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="tasks" element={<TasksAdvanced />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="appointments" element={<AppointmentsAdvanced />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="calendars" element={<AppointmentsAdvanced />} />
            <Route path="money" element={<MoneyAdvanced />} />
            <Route path="quotes/:id" element={<QuoteDetail />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="logs" element={<Logs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/new" element={<ReportBuilder />} />
            <Route path="reports/:id" element={<ReportDetail />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="reviews/new" element={<ReviewNew />} />
            <Route path="reviews/:id" element={<ReviewDetail />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="tickets/new" element={<TicketNew />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="settings/canned-responses" element={<CannedResponses />} />
            <Route path="settings/ticket-templates" element={<TicketTemplates />} />
            <Route path="settings/auto-assignment" element={<AutoAssignment />} />
            <Route path="settings/company" element={<CompanySettings />} />
            <Route path="settings/ai-training" element={<AITraining />} />
            <Route path="settings/knowledge-base" element={<KnowledgeBase />} />
            <Route path="settings/site-settings" element={<SiteSettings />} />
            <Route path="settings/services" element={<ServicesSettings />} />
            <Route path="settings/service-areas" element={<ServiceAreas />} />
            <Route path="settings/templates" element={<Templates />} />
            <Route path="settings/static-pages" element={<StaticPages />} />
            <Route path="settings/form-fields" element={<FormFields />} />
            <Route path="settings/email-templates" element={<EmailTemplates />} />
            <Route path="settings/email-settings" element={<EmailSettings />} />
            <Route path="settings/notifications" element={<Notifications />} />
            <Route path="settings/qa-testing" element={<QATesting />} />
            <Route path="settings/performance" element={<PerformanceSettings />} />
            <Route path="settings/backup-management" element={<BackupManagement />} />
            <Route path="settings/seo" element={<SEO />} />
            <Route path="email-queue" element={<EmailQueue />} />
            <Route path="regenerate-pages" element={<PageRegenerator />} />
            <Route path="system-health" element={<SystemHealth />} />
          </Route>
          
          {/* Workflow Automation Routes */}
          <Route path="/admin/automation" element={<AdminLayout />}>
            <Route path="workflows" element={<Workflows />} />
            <Route path="workflows/:id" element={<WorkflowBuilder />} />
            <Route path="monitor" element={<WorkflowMonitor />} />
            <Route path="templates" element={<WorkflowTemplates />} />
            <Route path="testing" element={<WorkflowTesting />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    );
  };

  const App = () => {
    return (
      <TooltipProvider>
        <AppContent />
        <GlobalLeadFormModal />
      </TooltipProvider>
    );
  };

  export default App;
