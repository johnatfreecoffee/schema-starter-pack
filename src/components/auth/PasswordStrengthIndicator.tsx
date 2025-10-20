import { validatePasswordStrength, PasswordRequirements, DEFAULT_REQUIREMENTS } from '@/lib/passwordValidation';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  requirements?: PasswordRequirements;
  showChecklist?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  requirements = DEFAULT_REQUIREMENTS,
  showChecklist = true,
}: PasswordStrengthIndicatorProps) {
  const strength = validatePasswordStrength(password, requirements);

  const getColorClass = () => {
    if (strength.score === 0) return 'bg-destructive';
    if (strength.score <= 1) return 'bg-red-500';
    if (strength.score === 2) return 'bg-yellow-500';
    if (strength.score === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTextColorClass = () => {
    if (strength.score === 0) return 'text-destructive';
    if (strength.score <= 1) return 'text-red-500';
    if (strength.score === 2) return 'text-yellow-500';
    if (strength.score === 3) return 'text-blue-500';
    return 'text-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full transition-all ${getColorClass()}`}
            style={{ width: `${(strength.score / 4) * 100}%` }}
          />
        </div>
        <p className={`text-sm font-medium ${getTextColorClass()}`}>
          {strength.feedback.split(' - ')[0]}
        </p>
      </div>

      {showChecklist && (
        <div className="space-y-1 text-sm text-muted-foreground">
          <CheckItem 
            checked={strength.checks.length} 
            label={`At least ${requirements.minLength} characters`} 
          />
          {requirements.requireUppercase && (
            <CheckItem checked={strength.checks.uppercase} label="One uppercase letter" />
          )}
          {requirements.requireLowercase && (
            <CheckItem checked={strength.checks.lowercase} label="One lowercase letter" />
          )}
          {requirements.requireNumber && (
            <CheckItem checked={strength.checks.number} label="One number" />
          )}
          {requirements.requireSpecial && (
            <CheckItem checked={strength.checks.special} label="One special character" />
          )}
        </div>
      )}
    </div>
  );
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
}
