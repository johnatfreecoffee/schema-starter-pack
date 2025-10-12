export const REPORT_TEMPLATES = [
  {
    name: "Lead Source Analysis",
    description: "Analyze where your leads are coming from",
    data_source: "leads",
    selected_fields: ["source", "id"],
    grouping: { field: "source", aggregationType: "count" },
    visualization_type: "pie"
  },
  {
    name: "Monthly Revenue",
    description: "Track invoice totals by month",
    data_source: "invoices",
    selected_fields: ["created_at", "total_amount"],
    grouping: { field: "created_at", aggregationType: "sum" },
    visualization_type: "line"
  },
  {
    name: "Project Status Overview",
    description: "See projects broken down by status",
    data_source: "projects",
    selected_fields: ["status", "id"],
    grouping: { field: "status", aggregationType: "count" },
    visualization_type: "bar"
  },
  {
    name: "Lead Conversion Funnel",
    description: "Track lead conversion by status",
    data_source: "leads",
    selected_fields: ["status", "id"],
    grouping: { field: "status", aggregationType: "count" },
    visualization_type: "bar"
  },
  {
    name: "Account Industry Distribution",
    description: "View accounts by industry",
    data_source: "accounts",
    selected_fields: ["industry", "id"],
    grouping: { field: "industry", aggregationType: "count" },
    visualization_type: "pie"
  },
  {
    name: "Task Completion Rate",
    description: "Track task completion over time",
    data_source: "tasks",
    selected_fields: ["status", "id"],
    grouping: { field: "status", aggregationType: "count" },
    visualization_type: "bar"
  }
];
