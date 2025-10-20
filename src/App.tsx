import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { GlobalLeadFormModal } from "@/components/lead-form/GlobalLeadFormModal";
import { useCacheWarming } from "@/hooks/useCacheWarming";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
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
import GeneratedPage from "./pages/GeneratedPage";
import ServiceOverviewPage from "./pages/ServiceOverviewPage";
import StaticPage from "./pages/StaticPage";
import AcceptInvite from "./pages/AcceptInvite";
import ReviewsPage from "./pages/Reviews";

// Lazy load heavy dashboard pages for better initial load time
import * as LazyRoutes from './lib/lazyRoutes';

const AppContent = () => {
  // Warm cache on app initialization
  useCacheWarming();
  
  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen">
      <Toaster />
      <Sonner />
      <GlobalLeadFormModal />
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
          
          {/* Customer Portal Routes - Lazy loaded */}
          <Route path="/customer/login" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerAuth /></Suspense>} />
          <Route path="/customer" element={<CustomerLayout />}>
            <Route path="dashboard" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerDashboard /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerProfile /></Suspense>} />
            <Route path="projects" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerProjects /></Suspense>} />
            <Route path="projects/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerProjectDetail /></Suspense>} />
            <Route path="appointments" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerAppointments /></Suspense>} />
            <Route path="invoices" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerInvoices /></Suspense>} />
            <Route path="support" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerSupport /></Suspense>} />
            <Route path="support/new" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerSubmitTicket /></Suspense>} />
            <Route path="support/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerTicketDetail /></Suspense>} />
          </Route>
          <Route path="/portal/submit-review" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerSubmitReview /></Suspense>} />
          <Route path="/portal/my-reviews" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CustomerMyReviews /></Suspense>} />
          
          {/* Dashboard Routes - Lazy loaded for better performance */}
          <Route path="/dashboard" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Analytics /></Suspense>} />
            <Route path="team" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Team /></Suspense>} />
            <Route path="import" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Import /></Suspense>} />
            <Route path="import/history" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ImportHistory /></Suspense>} />
            <Route path="leads" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Leads /></Suspense>} />
            <Route path="leads/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.LeadDetail /></Suspense>} />
            <Route path="accounts" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Accounts /></Suspense>} />
            <Route path="accounts/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.AccountDetail /></Suspense>} />
            <Route path="contacts" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Contacts /></Suspense>} />
            <Route path="contacts/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ContactDetail /></Suspense>} />
            <Route path="projects" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Projects /></Suspense>} />
            <Route path="projects/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ProjectDetail /></Suspense>} />
            <Route path="tasks" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.TasksAdvanced /></Suspense>} />
            <Route path="tasks/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.TaskDetail /></Suspense>} />
            <Route path="appointments" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.AppointmentsAdvanced /></Suspense>} />
            <Route path="appointments/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.AppointmentDetail /></Suspense>} />
            <Route path="calendars" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Calendars /></Suspense>} />
            <Route path="money" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.MoneyAdvanced /></Suspense>} />
            <Route path="quotes/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.QuoteDetail /></Suspense>} />
            <Route path="invoices/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.InvoiceDetail /></Suspense>} />
            <Route path="logs" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Logs /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Settings /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Reports /></Suspense>} />
            <Route path="reports/new" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ReportBuilder /></Suspense>} />
            <Route path="reports/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ReportDetail /></Suspense>} />
            <Route path="reports/:id/edit" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.EditReport /></Suspense>} />
            <Route path="reviews" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Reviews /></Suspense>} />
            <Route path="reviews/new" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ReviewNew /></Suspense>} />
            <Route path="reviews/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ReviewDetail /></Suspense>} />
            <Route path="analytics/reviews" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ReviewAnalytics /></Suspense>} />
            <Route path="tickets" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Tickets /></Suspense>} />
            <Route path="tickets/new" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.TicketNew /></Suspense>} />
            <Route path="tickets/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.TicketDetail /></Suspense>} />
            <Route path="settings/canned-responses" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.CannedResponses /></Suspense>} />
            <Route path="settings/ticket-templates" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.TicketTemplates /></Suspense>} />
            <Route path="settings/auto-assignment" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.AutoAssignment /></Suspense>} />
            <Route path="settings/company" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Company /></Suspense>} />
            <Route path="settings/ai-training" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.AITraining /></Suspense>} />
            <Route path="settings/knowledge-base" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.KnowledgeBase /></Suspense>} />
            <Route path="settings/site-settings" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.SiteSettings /></Suspense>} />
            <Route path="settings/services" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Services /></Suspense>} />
            <Route path="settings/service-areas" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.ServiceAreas /></Suspense>} />
            <Route path="settings/templates" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Templates /></Suspense>} />
            <Route path="settings/static-pages" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.StaticPages /></Suspense>} />
            <Route path="settings/form-fields" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.FormFields /></Suspense>} />
            <Route path="settings/email-templates" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.EmailTemplates /></Suspense>} />
            <Route path="settings/email-settings" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.EmailSettings /></Suspense>} />
            <Route path="settings/document-templates" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.DocumentTemplates /></Suspense>} />
            <Route path="settings/notifications" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Notifications /></Suspense>} />
            <Route path="settings/qa-testing" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.QATesting /></Suspense>} />
            <Route path="settings/performance" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Performance /></Suspense>} />
            <Route path="settings/backup-management" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.BackupManagement /></Suspense>} />
            <Route path="settings/permissions" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Permissions /></Suspense>} />
            <Route path="settings/seo" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.SEO /></Suspense>} />
            <Route path="email-queue" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.EmailQueue /></Suspense>} />
            <Route path="regenerate-pages" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.PageRegenerator /></Suspense>} />
            <Route path="system-health" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.SystemHealth /></Suspense>} />
          </Route>
          
          {/* Workflow Automation Routes - Lazy loaded */}
          <Route path="/admin/automation" element={<AdminLayout />}>
            <Route path="workflows" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.Workflows /></Suspense>} />
            <Route path="workflows/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.WorkflowBuilder /></Suspense>} />
            <Route path="monitor" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.WorkflowMonitor /></Suspense>} />
            <Route path="templates" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.WorkflowTemplates /></Suspense>} />
            <Route path="testing" element={<Suspense fallback={<PageLoadingSkeleton />}><LazyRoutes.WorkflowTesting /></Suspense>} />
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
    </TooltipProvider>
  );
};

export default App;
