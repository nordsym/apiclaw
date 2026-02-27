/**
 * APIClaw Confirmation System
 * For actions that cost money or have side effects
 * 
 * Flow:
 * 1. Agent calls action → gets preview + token
 * 2. Agent shows preview to user
 * 3. User confirms → agent calls confirm with token
 * 4. APIClaw executes the actual action
 */

import { randomBytes } from 'crypto';

export interface PendingAction {
  token: string;
  provider: string;
  action: string;
  params: Record<string, any>;
  preview: Record<string, any>;
  createdAt: number;
  expiresAt: number;
  userId?: string;
}

// In-memory store for pending confirmations (in production, use Redis)
const pendingActions = new Map<string, PendingAction>();

// Actions that require confirmation before execution
export const CONFIRMATION_REQUIRED: Record<string, string[]> = {
  // Invoicing - costs money per send
  coaccept: ['send_invoice', 'send_reminder'],
  
  // SMS - costs money per message
  '46elks': ['send_sms'],
  twilio: ['send_sms'],
  
  // Email sends (less critical but still good to confirm)
  resend: ['send_email'],
};

// Token expiry time (5 minutes)
const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Check if an action requires confirmation (hardcoded list only)
 * For dynamic providers, use requiresConfirmationAsync
 */
export function requiresConfirmation(provider: string, action: string): boolean {
  const actions = CONFIRMATION_REQUIRED[provider];
  return actions?.includes(action) ?? false;
}

/**
 * Check if a dynamic provider action requires confirmation
 * This is imported dynamically to avoid circular deps
 */
export async function requiresConfirmationAsync(
  provider: string, 
  action: string
): Promise<{ required: boolean; estimatedCost?: string; isDynamic?: boolean }> {
  // First check hardcoded list
  if (requiresConfirmation(provider, action)) {
    return { required: true, isDynamic: false };
  }
  
  // Then check dynamic provider config
  try {
    const { getDynamicConfirmationConfig } = await import('./execute-dynamic.js');
    const config = await getDynamicConfirmationConfig(provider, action);
    if (config.required) {
      return { 
        required: true, 
        estimatedCost: config.estimatedCost,
        isDynamic: true 
      };
    }
  } catch (e) {
    // Dynamic config not available, that's ok
  }
  
  return { required: false };
}

/**
 * Generate a confirmation token and store the pending action
 */
export function createPendingAction(
  provider: string,
  action: string,
  params: Record<string, any>,
  preview: Record<string, any>,
  userId?: string
): PendingAction {
  // Clean up expired tokens
  cleanupExpired();

  const token = randomBytes(16).toString('hex');
  const now = Date.now();

  const pending: PendingAction = {
    token,
    provider,
    action,
    params,
    preview,
    createdAt: now,
    expiresAt: now + TOKEN_EXPIRY_MS,
    userId,
  };

  pendingActions.set(token, pending);
  return pending;
}

/**
 * Get a pending action by token (and validate it)
 */
export function getPendingAction(token: string): PendingAction | null {
  const pending = pendingActions.get(token);
  
  if (!pending) {
    return null;
  }

  if (Date.now() > pending.expiresAt) {
    pendingActions.delete(token);
    return null;
  }

  return pending;
}

/**
 * Consume a pending action (use it and remove from store)
 */
export function consumePendingAction(token: string): PendingAction | null {
  const pending = getPendingAction(token);
  
  if (pending) {
    pendingActions.delete(token);
  }

  return pending;
}

/**
 * Clean up expired tokens
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [token, pending] of pendingActions.entries()) {
    if (now > pending.expiresAt) {
      pendingActions.delete(token);
    }
  }
}

/**
 * Generate a human-readable preview for an action
 */
export function generatePreview(
  provider: string,
  action: string,
  params: Record<string, any>
): Record<string, any> {
  // Provider-specific preview generators
  switch (provider) {
    case 'coaccept':
      return generateCoAcceptPreview(action, params);
    case '46elks':
    case 'twilio':
      return generateSMSPreview(params);
    case 'resend':
      return generateEmailPreview(params);
    default:
      return { action, params };
  }
}

function generateCoAcceptPreview(action: string, params: Record<string, any>): Record<string, any> {
  if (action === 'send_invoice') {
    const items = params.items || [];
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    
    return {
      type: 'invoice',
      recipient: {
        name: params.recipient_name,
        email: params.recipient_email,
        org_number: params.recipient_org_nr,
      },
      amount: {
        subtotal: totalAmount,
        vat_rate: params.vat_rate || 25,
        vat_amount: totalAmount * ((params.vat_rate || 25) / 100),
        total: totalAmount * (1 + (params.vat_rate || 25) / 100),
        currency: params.currency || 'SEK',
      },
      due_date: params.due_date,
      items: items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.amount,
        amount: item.amount,
      })),
      payment_method: 'SMS + Swish/Card (CoAccept)',
      estimated_cost: '~2-5 SEK per invoice',
    };
  }
  
  return { action, params };
}

function generateSMSPreview(params: Record<string, any>): Record<string, any> {
  const messageLength = (params.message || '').length;
  const segments = Math.ceil(messageLength / 160);
  
  return {
    type: 'sms',
    to: params.to,
    from: params.from || 'NordSym',
    message: params.message,
    message_length: messageLength,
    segments,
    estimated_cost: `~${(segments * 0.35).toFixed(2)} SEK`,
  };
}

function generateEmailPreview(params: Record<string, any>): Record<string, any> {
  return {
    type: 'email',
    to: params.to,
    from: params.from || 'noreply@nordsym.com',
    subject: params.subject,
    preview: (params.message || params.html || '').substring(0, 200) + '...',
  };
}

/**
 * Validate params before creating preview
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
export function validateParams(
  provider: string,
  action: string,
  params: Record<string, any>
): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  switch (provider) {
    case 'coaccept':
      if (action === 'send_invoice') {
        if (!params.recipient_name) errors.push('Missing: recipient_name');
        if (!params.recipient_email) errors.push('Missing: recipient_email');
        if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
          errors.push('Missing: items (at least one invoice item required)');
        }
        if (!params.due_date) errors.push('Missing: due_date (YYYY-MM-DD)');
        
        // Validate email format
        if (params.recipient_email && !params.recipient_email.includes('@')) {
          errors.push('Invalid: recipient_email format');
        }
        
        // Validate due date is not in past
        if (params.due_date) {
          const dueDate = new Date(params.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            errors.push('Invalid: due_date cannot be in the past');
          }
        }
      }
      break;

    case '46elks':
    case 'twilio':
      if (!params.to) errors.push('Missing: to (phone number)');
      if (!params.message) errors.push('Missing: message');
      
      // Validate phone format (basic check)
      if (params.to && !params.to.startsWith('+')) {
        errors.push('Invalid: phone number must start with + (e.g., +46701234567)');
      }
      break;

    case 'resend':
      if (!params.to) errors.push('Missing: to (email address)');
      if (!params.subject) errors.push('Missing: subject');
      if (!params.message && !params.html) errors.push('Missing: message or html content');
      break;
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}
