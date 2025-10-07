interface BreadcrumbsProps {
  serviceName: string;
  serviceSlug: string;
  cityName: string;
}

const Breadcrumbs = ({ serviceName, serviceSlug, cityName }: BreadcrumbsProps) => {
  return (
    <nav aria-label="Breadcrumb" className="bg-muted/30 border-b">
      <div className="container mx-auto px-4 py-3">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <a href="/" className="text-primary hover:underline">
              Home
            </a>
          </li>
          <li className="text-muted-foreground">›</li>
          <li>
            <a href="/services" className="text-primary hover:underline">
              Services
            </a>
          </li>
          <li className="text-muted-foreground">›</li>
          <li>
            <a href={`/services/${serviceSlug}`} className="text-primary hover:underline">
              {serviceName}
            </a>
          </li>
          <li className="text-muted-foreground">›</li>
          <li className="font-medium" aria-current="page">
            {cityName}
          </li>
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
