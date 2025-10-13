import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";
import {
  generateTOTPSecret,
  generateTOTPUri,
  generateQRCode,
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCodes,
  formatSecretForDisplay,
  downloadBackupCodes,
} from "@/lib/twoFactor";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userEmail: string;
}

export const TwoFactorSetup = ({ open, onOpenChange, onSuccess, userEmail }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<"qr" | "backup">("qr");
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      initializeSetup();
    }
  }, [open]);

  const initializeSetup = async () => {
    try {
      const newSecret = generateTOTPSecret();
      setSecret(newSecret);

      const uri = generateTOTPUri(newSecret, userEmail, "Your Company");
      const qrUrl = await generateQRCode(uri);
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Failed to initialize 2FA setup:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      // Verify the code
      const isValid = verifyTOTPCode(secret, verificationCode);
      if (!isValid) {
        toast.error("Invalid code. Please try again.");
        setLoading(false);
        return;
      }

      // Generate backup codes
      const codes = generateBackupCodes();
      const hashedCodes = await hashBackupCodes(codes);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          two_factor_enabled: true,
          two_factor_secret: secret,
          two_factor_backup_codes: JSON.stringify(hashedCodes),
          two_factor_enabled_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Show backup codes
      setBackupCodes(codes);
      setStep("backup");
      toast.success("Two-factor authentication enabled!");
    } catch (error) {
      console.error("Failed to enable 2FA:", error);
      toast.error("Failed to enable two-factor authentication");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  const handleDownloadBackupCodes = () => {
    downloadBackupCodes(backupCodes, userEmail);
    toast.success("Backup codes downloaded");
  };

  const handleComplete = () => {
    if (!savedConfirmed) {
      toast.error("Please confirm you've saved your backup codes");
      return;
    }
    onSuccess();
    onOpenChange(false);
    // Reset state
    setStep("qr");
    setVerificationCode("");
    setBackupCodes([]);
    setSavedConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "qr" ? "Set Up Two-Factor Authentication" : "Save Your Backup Codes"}
          </DialogTitle>
        </DialogHeader>

        {step === "qr" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Step 1: Scan this QR code</Label>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Or enter this code manually:</Label>
              <div className="flex gap-2">
                <Input
                  value={formatSecretForDisplay(secret)}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Step 2: Enter the 6-digit code from your app</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Alert>
              <AlertDescription>
                Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code or enter the code manually.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleVerifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Enable"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription className="font-semibold">
                ⚠️ Save these codes in a safe place. You won't see them again.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your Backup Codes</Label>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadBackupCodes}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyBackupCodes}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="saved-confirm"
                checked={savedConfirmed}
                onChange={(e) => setSavedConfirmed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="saved-confirm" className="text-sm cursor-pointer">
                I have saved my backup codes in a secure location
              </label>
            </div>

            <Button
              onClick={handleComplete}
              disabled={!savedConfirmed}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
