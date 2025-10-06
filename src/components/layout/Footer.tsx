import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { data: company } = useCompanySettings();

  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Section - Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">{company?.business_name}</h3>
            {company?.business_slogan && (
              <p className="text-lg text-muted-foreground italic">{company.business_slogan}</p>
            )}
            {company?.description && (
              <p className="text-sm text-muted-foreground">{company.description}</p>
            )}
            <div className="space-y-2 text-sm">
              {company?.address && <p>{company.address}</p>}
              {company?.phone && (
                <p>
                  <span className="font-medium">Phone:</span> {company.phone}
                </p>
              )}
              {company?.email && (
                <p>
                  <span className="font-medium">Email:</span> {company.email}
                </p>
              )}
            </div>
          </div>

          {/* Right Section - Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/services" className="hover:text-primary transition-colors">
                    View All Services
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Service Areas</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/services" className="hover:text-primary transition-colors">
                    View Coverage Areas
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © 2025 {company?.business_name || 'CRM Platform'} - All Rights Reserved
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span>|</span>
            <span>Licensed, Bonded, and Insured</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
