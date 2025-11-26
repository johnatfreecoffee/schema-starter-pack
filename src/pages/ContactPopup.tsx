import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UniversalLeadForm } from '@/components/lead-form/UniversalLeadForm';

export default function ContactPopup() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPopup = searchParams.get('popup') === 'true';
  const formType = searchParams.get('type') || 'General Inquiry';

  useEffect(() => {
    if (isPopup) {
      // Minimal popup styling
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
    }
  }, [isPopup]);

  const handleSuccess = () => {
    // Close popup after successful submission
    if (isPopup && window.opener) {
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  };

  if (!isPopup) {
    // If not in popup mode, redirect to main site or show error
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Access</h2>
          <p className="text-muted-foreground">This page must be opened in popup mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">{formType}</h2>
        <UniversalLeadForm 
          mode="embed"
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}