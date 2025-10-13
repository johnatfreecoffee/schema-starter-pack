import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

/**
 * Generate a random TOTP secret
 */
export const generateTOTPSecret = (): string => {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
};

/**
 * Generate a TOTP URI for QR code
 */
export const generateTOTPUri = (
  secret: string,
  email: string,
  issuer: string = "Your Company"
): string => {
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  
  return totp.toString();
};

/**
 * Generate QR code data URL from TOTP URI
 */
export const generateQRCode = async (uri: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(uri, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

/**
 * Verify a TOTP code against a secret
 */
export const verifyTOTPCode = (secret: string, code: string): boolean => {
  try {
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // Verify with a window of ±1 period (90 seconds total) to account for clock drift
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  } catch (error) {
    console.error("Error verifying TOTP code:", error);
    return false;
  }
};

/**
 * Generate backup codes (10 codes, 8 characters each)
 */
export const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous characters
  
  for (let i = 0; i < 10; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
      if (j === 3) code += "-"; // Add hyphen in middle for readability
    }
    codes.push(code);
  }
  
  return codes;
};

/**
 * Hash backup codes for storage
 */
export const hashBackupCodes = async (codes: string[]): Promise<string[]> => {
  const hashed: string[] = [];
  
  for (const code of codes) {
    // Use Web Crypto API for hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    hashed.push(hashHex);
  }
  
  return hashed;
};

/**
 * Verify a backup code against hashed codes
 */
export const verifyBackupCode = async (
  code: string,
  hashedCodes: string[]
): Promise<boolean> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashedCodes.includes(hashHex);
};

/**
 * Format secret for manual entry (groups of 4)
 */
export const formatSecretForDisplay = (secret: string): string => {
  return secret.match(/.{1,4}/g)?.join(" ") || secret;
};

/**
 * Download backup codes as text file
 */
export const downloadBackupCodes = (codes: string[], email: string) => {
  const content = `Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}
Account: ${email}

Keep these codes in a safe place. Each code can only be used once.

${codes.join("\n")}

If you lose access to your authenticator app, you can use one of these codes to sign in.
`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
