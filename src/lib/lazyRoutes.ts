import { lazy } from 'react';

/**
 * Lazy-loaded route components for code splitting
 * This improves initial bundle size and load time
 */

// Dashboard pages
export const Leads = lazy(() => import('@/pages/dashboard/Leads'));
export const LeadDetail = lazy(() => import('@/pages/dashboard/LeadDetail'));
export const Accounts = lazy(() => import('@/pages/dashboard/Accounts'));
export const AccountDetail = lazy(() => import('@/pages/dashboard/AccountDetail'));
export const Contacts = lazy(() => import('@/pages/dashboard/Contacts'));
export const ContactDetail = lazy(() => import('@/pages/dashboard/ContactDetail'));
export const Tasks = lazy(() => import('@/pages/dashboard/Tasks'));
export const TaskDetail = lazy(() => import('@/pages/dashboard/TaskDetail'));
export const TasksAdvanced = lazy(() => import('@/pages/dashboard/TasksAdvanced'));
export const Projects = lazy(() => import('@/pages/dashboard/Projects'));
export const ProjectDetail = lazy(() => import('@/pages/dashboard/ProjectDetail'));
export const Appointments = lazy(() => import('@/pages/dashboard/Appointments'));
export const AppointmentDetail = lazy(() => import('@/pages/dashboard/AppointmentDetail'));
export const AppointmentsAdvanced = lazy(() => import('@/pages/dashboard/AppointmentsAdvanced'));
export const Money = lazy(() => import('@/pages/dashboard/Money'));
export const MoneyAdvanced = lazy(() => import('@/pages/dashboard/MoneyAdvanced'));
export const InvoiceDetail = lazy(() => import('@/pages/dashboard/InvoiceDetail'));
export const QuoteDetail = lazy(() => import('@/pages/dashboard/QuoteDetail'));
export const Tickets = lazy(() => import('@/pages/dashboard/Tickets'));
export const TicketDetail = lazy(() => import('@/pages/dashboard/TicketDetail'));
export const TicketNew = lazy(() => import('@/pages/dashboard/TicketNew'));
export const Reviews = lazy(() => import('@/pages/dashboard/Reviews'));
export const ReviewDetail = lazy(() => import('@/pages/dashboard/ReviewDetail'));
export const ReviewNew = lazy(() => import('@/pages/dashboard/ReviewNew'));

// Analytics & Reports
export const Analytics = lazy(() => import('@/pages/dashboard/Analytics'));
export const Reports = lazy(() => import('@/pages/dashboard/Reports'));
export const ReportBuilder = lazy(() => import('@/pages/dashboard/ReportBuilder'));
export const ReportDetail = lazy(() => import('@/pages/dashboard/ReportDetail'));
export const EditReport = lazy(() => import('@/pages/dashboard/EditReport'));
export const ReviewAnalytics = lazy(() => import('@/pages/dashboard/analytics/ReviewAnalytics'));

// Workflows
export const Workflows = lazy(() => import('@/pages/dashboard/Workflows'));
export const WorkflowBuilder = lazy(() => import('@/pages/dashboard/WorkflowBuilder'));
export const WorkflowMonitor = lazy(() => import('@/pages/dashboard/WorkflowMonitor'));
export const WorkflowTemplates = lazy(() => import('@/pages/dashboard/WorkflowTemplates'));
export const WorkflowTesting = lazy(() => import('@/pages/dashboard/WorkflowTesting'));

// Settings
export const Settings = lazy(() => import('@/pages/dashboard/Settings'));
export const AccountSettings = lazy(() => import('@/pages/dashboard/settings/AccountSettings'));
export const Permissions = lazy(() => import('@/pages/dashboard/settings/Permissions'));
export const Company = lazy(() => import('@/pages/dashboard/settings/Company'));
export const AdminAIConfig = lazy(() => import('@/pages/AdminAIConfig'));
export const Services = lazy(() => import('@/pages/dashboard/settings/Services'));
export const ServiceAreas = lazy(() => import('@/pages/dashboard/settings/ServiceAreas'));
export const PageManagement = lazy(() => import('@/pages/dashboard/settings/PageManagement'));
export const SiteSettings = lazy(() => import('@/pages/dashboard/settings/SiteSettings'));
export { default as StaticPages } from '@/pages/dashboard/settings/StaticPages';
export const Sitemap = lazy(() => import('@/pages/dashboard/settings/Sitemap'));
export const EmailTemplates = lazy(() => import('@/pages/dashboard/settings/EmailTemplates'));
export const FormFields = lazy(() => import('@/pages/dashboard/settings/FormFields'));
export const Notifications = lazy(() => import('@/pages/dashboard/settings/Notifications'));
export const EmailSettings = lazy(() => import('@/pages/dashboard/settings/EmailSettings'));
export const BackupManagement = lazy(() => import('@/pages/dashboard/settings/BackupManagement'));
export const AITraining = lazy(() => import('@/pages/dashboard/settings/AITraining'));
export const Performance = lazy(() => import('@/pages/dashboard/settings/Performance'));
export const QATesting = lazy(() => import('@/pages/dashboard/settings/QATesting'));

// Admin tools
export const Team = lazy(() => import('@/pages/dashboard/Team'));
export const Calendars = lazy(() => import('@/pages/dashboard/Calendars'));
export const EmailQueue = lazy(() => import('@/pages/dashboard/EmailQueue'));
export const Import = lazy(() => import('@/pages/dashboard/Import'));
export const ImportHistory = lazy(() => import('@/pages/dashboard/ImportHistory'));
export const Logs = lazy(() => import('@/pages/dashboard/Logs'));
export const SystemHealth = lazy(() => import('@/pages/dashboard/SystemHealth'));
export const PageRegenerator = lazy(() => import('@/pages/dashboard/PageRegenerator'));

// Customer portal
export const CustomerAuth = lazy(() => import('@/pages/customer/CustomerAuth'));
export const CustomerDashboard = lazy(() => import('@/pages/customer/CustomerDashboard'));
export const CustomerProjects = lazy(() => import('@/pages/customer/CustomerProjects'));
export const CustomerProjectDetail = lazy(() => import('@/pages/customer/CustomerProjectDetail'));
export const CustomerInvoices = lazy(() => import('@/pages/customer/CustomerInvoices'));
export const CustomerAppointments = lazy(() => import('@/pages/customer/CustomerAppointments'));
export const CustomerSupport = lazy(() => import('@/pages/customer/CustomerSupport'));
export const CustomerTicketDetail = lazy(() => import('@/pages/customer/CustomerTicketDetail'));
export const CustomerSubmitTicket = lazy(() => import('@/pages/customer/CustomerSubmitTicket'));
export const CustomerProfile = lazy(() => import('@/pages/customer/CustomerProfile'));
export const CustomerSubmitReview = lazy(() => import('@/pages/customer/CustomerSubmitReview'));
export const CustomerMyReviews = lazy(() => import('@/pages/customer/CustomerMyReviews'));
