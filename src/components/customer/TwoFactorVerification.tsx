import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { verifyTOTPCode, verifyBackupCode } from "@/lib/twoFactor";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerificationProps {
  userId: string;
  secret: string;
  hashedBackupCodes: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorVerification = ({
  userId,
  secret,
  hashedBackupCodes,
  onSuccess,
  onCancel,
}: TwoFactorVerificationProps) => {
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleVerify = async () => {
    if (!code) {
      toast.error("Please enter a code");
      return;
    }

    setLoading(true);
    try {
      let isValid = false;
      let updatedBackupCodes = hashedBackupCodes;

      if (useBackupCode) {
        // Verify backup code
        isValid = await verifyBackupCode(code.toUpperCase(), hashedBackupCodes);
        
        if (isValid) {
          // Remove used backup code
          const encoder = new TextEncoder();
          const data = encoder.encode(code.toUpperCase());
          const hashBuffer = await crypto.subtle.digest("SHA-256", data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          
          updatedBackupCodes = hashedBackupCodes.filter(c => c !== hashHex);
          
          // Update backup codes in database
          await supabase
            .from("user_profiles")
            .update({ two_factor_backup_codes: JSON.stringify(updatedBackupCodes) })
            .eq("id", userId);

          const remaining = updatedBackupCodes.length;
          toast.success(`Backup code accepted. ${remaining} codes remaining.`);
        }
      } else {
        // Verify TOTP code
        isValid = verifyTOTPCode(secret, code);
      }

      if (isValid) {
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          toast.error("Too many failed attempts. Please try again later.");
          setTimeout(() => {
            onCancel();
          }, 2000);
        } else {
          toast.error(`Invalid code. ${5 - newAttempts} attempts remaining.`);
          setCode("");
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {useBackupCode
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{useBackupCode ? "Backup Code" : "Authentication Code"}</Label>
            <Input
              type="text"
              inputMode={useBackupCode ? "text" : "numeric"}
              pattern={useBackupCode ? undefined : "[0-9]*"}
              maxLength={useBackupCode ? 9 : 6}
              value={code}
              onChange={(e) => {
                const value = e.target.value;
                if (useBackupCode) {
                  setCode(value.toUpperCase());
                } else {
                  setCode(value.replace(/\D/g, ""));
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          {attempts > 0 && attempts < 5 && (
            <Alert variant="destructive">
              <AlertDescription>
                Invalid code. {5 - attempts} attempts remaining before lockout.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleVerify}
            disabled={loading || code.length < (useBackupCode ? 8 : 6) || attempts >= 5}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode("");
                setAttempts(0);
              }}
              className="text-sm text-primary hover:underline"
            >
              {useBackupCode
                ? "Use authenticator app instead"
                : "Use a backup code instead"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:underline"
            >
              Cancel and sign out
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
