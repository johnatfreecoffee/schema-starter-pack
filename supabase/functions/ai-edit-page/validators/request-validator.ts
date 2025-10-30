// ============================================================================
// Request Validation
// ============================================================================

import { RequestPayload } from '../types.ts';

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export function validateRequest(body: unknown): RequestPayload {
  if (!body || typeof body !== 'object') {
    throw new RequestValidationError('Request body must be an object');
  }

  const requestBody = body as Record<string, unknown>;

  // Validate command
  const commandObj = requestBody.command;
  if (!commandObj) {
    throw new RequestValidationError('Missing required field: command');
  }

  let command: string;
  if (typeof commandObj === 'string') {
    command = commandObj;
  } else if (typeof commandObj === 'object' && commandObj !== null) {
    const cmdObj = commandObj as Record<string, unknown>;
    command = (cmdObj.text as string) || '';
  } else {
    throw new RequestValidationError('Invalid command format');
  }

  if (!command || command.trim().length === 0) {
    throw new RequestValidationError('Command cannot be empty');
  }

  // Validate context
  const context = requestBody.context;
  if (!context || typeof context !== 'object') {
    throw new RequestValidationError('Missing or invalid context object');
  }

  const contextObj = context as Record<string, unknown>;

  // Validate companyInfo
  const companyInfo = contextObj.companyInfo;
  if (!companyInfo || typeof companyInfo !== 'object') {
    throw new RequestValidationError('Missing or invalid companyInfo in context');
  }

  const companyInfoObj = companyInfo as Record<string, unknown>;
  if (!companyInfoObj.business_name || typeof companyInfoObj.business_name !== 'string') {
    throw new RequestValidationError('Missing required field: context.companyInfo.business_name');
  }

  // Validate mode if present
  const mode = requestBody.mode || (commandObj as Record<string, unknown>)?.mode || 'build';
  if (typeof mode !== 'string' || !['build', 'edit'].includes(mode)) {
    throw new RequestValidationError('Invalid mode: must be "build" or "edit"');
  }

  // Return validated payload - build it explicitly for type safety
  return {
    command: commandObj,
    mode: mode as string,
    model: requestBody.model as string | undefined,
    conversationHistory: requestBody.conversationHistory as any[] | undefined,
    context: contextObj as any,
    userId: requestBody.userId as string | undefined,
    pipeline: requestBody.pipeline as any
  } as RequestPayload;
}

export function validateEnvironment() {
  const required = [
    'GOOGLE_GEMINI_AI_STUDIO',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = required.filter(key => !Deno.env.get(key));

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
