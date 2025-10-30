import { supabase } from "@/integrations/supabase/client";

export class EdgeFunctionError extends Error {
  status?: number;
  details?: any;
  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = "EdgeFunctionError";
    this.status = status;
    this.details = details;
  }
}

export async function callEdgeFunction<T = any>({
  name,
  body,
  timeoutMs = 180000,
}: {
  name: string;
  body?: any;
  timeoutMs?: number;
}): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tkrcdxkdfjeupbdlbcfz.supabase.co';
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmNkeGtkZmpldXBiZGxiY2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDkyNTIsImV4cCI6MjA3NTMyNTI1Mn0.PVrTzBkP1sDtxgfWyYNboJTLsJFg-qT5tfCQNZS8sO8';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(supabasePublishableKey ? { apikey: supabasePublishableKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await resp.text();
    const contentType = resp.headers.get("content-type") || "";
    const asJson = contentType.includes("application/json");
    const parsed = asJson ? (text ? JSON.parse(text) : null) : text;

    if (!resp.ok) {
      throw new EdgeFunctionError(
        `Function ${name} failed: ${resp.status}`,
        resp.status,
        parsed
      );
    }

    return parsed as T;
  } catch (e: any) {
    if (e.name === "AbortError") {
      throw new EdgeFunctionError(`Function ${name} timed out after ${timeoutMs}ms`);
    }
    throw e;
  }
}
