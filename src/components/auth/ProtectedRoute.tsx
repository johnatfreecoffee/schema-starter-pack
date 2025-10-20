import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: {
    module: string;
    action: string;
  };
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requireAdmin = false,
  fallback,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading, isAdmin } = usePermissions();
  const { role, loading: roleLoading } = useUserRole();

  const loading = permissionsLoading || roleLoading;

  useEffect(() => {
    // If loading, wait
    if (loading) return;

    // If customer role and trying to access admin area, redirect
    if (role === 'customer' && (requireAdmin || requiredPermission)) {
      navigate('/customer/dashboard');
    }
  }, [loading, role, requireAdmin, requiredPermission, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return (
      fallback || (
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access this page. Only administrators can view this content.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      )
    );
  }

  // Check specific permission requirement
  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return (
      fallback || (
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have the required permissions to access this page.
              {' '}
              Required: {requiredPermission.module}.{requiredPermission.action}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
