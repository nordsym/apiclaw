/**
 * SYMBOT/CLAWDBOT MESSAGE HISTORY SANITIZER
 *
 * Fixar: "unexpected tool_use_id found in tool_result blocks"
 *
 * Problem: tool_result-block refererar till tool_use_id som saknas i föregående meddelande.
 * Lösning: Skanna messages-arrayen och ta bort orphaned tool_results.
 */

interface MessageBlock {
  type: string;
  tool_use_id?: string;
  id?: string;
  [key: string]: any;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageBlock[];
}

/**
 * Extraherar alla tool_use IDs från ett assistant-meddelande
 */
function extractToolUseIds(message: Message): Set<string> {
  const ids = new Set<string>();

  if (typeof message.content === 'string') return ids;

  for (const block of message.content) {
    if (block.type === 'tool_use' && block.id) {
      ids.add(block.id);
    }
  }

  return ids;
}

/**
 * Tar bort tool_result-block som saknar matchande tool_use_id
 */
function sanitizeMessage(message: Message, validToolIds: Set<string>): Message {
  if (typeof message.content === 'string') return message;

  const sanitizedContent = message.content.filter(block => {
    // Behåll allt som INTE är tool_result
    if (block.type !== 'tool_result') return true;

    // Behåll endast tool_result som har en matchande tool_use
    if (block.tool_use_id && validToolIds.has(block.tool_use_id)) {
      return true;
    }

    // Logga borttagna orphaned results
    console.warn(`🧹 Removed orphaned tool_result: ${block.tool_use_id}`);
    return false;
  });

  return {
    ...message,
    content: sanitizedContent
  };
}

/**
 * HUVUDFUNKTION: Sanerar hela message history
 *
 * Körs ALLTID innan anthropic.messages.create()
 */
export function sanitizeHistory(messages: Message[]): Message[] {
  const sanitized: Message[] = [];
  let previousToolIds = new Set<string>();

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (message.role === 'assistant') {
      // Extrahera tool_use IDs från detta assistant-meddelande
      const toolIds = extractToolUseIds(message);
      previousToolIds = toolIds;
      sanitized.push(message);
    }
    else if (message.role === 'user') {
      // Sanera user-meddelande baserat på föregående assistant's tool_use IDs
      const sanitizedMessage = sanitizeMessage(message, previousToolIds);

      // Endast lägg till om meddelandet har content kvar
      if (typeof sanitizedMessage.content === 'string' || sanitizedMessage.content.length > 0) {
        sanitized.push(sanitizedMessage);
      } else {
        console.warn(`🧹 Removed empty user message at index ${i}`);
      }

      // Reset tool IDs efter user-meddelande
      previousToolIds = new Set();
    }
    else {
      // System-meddelanden går igenom oförändrade
      sanitized.push(message);
    }
  }

  return sanitized;
}

/**
 * VALIDERING: Kollar att message history följer korrekt sekvens
 *
 * Korrekt ordning:
 * user -> assistant (tool_use) -> user (tool_result) -> assistant -> ...
 */
export function validateMessageSequence(messages: Message[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let expectingToolResult = false;
  let pendingToolIds = new Set<string>();

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // Skip system messages
    if (message.role === 'system') continue;

    if (message.role === 'assistant') {
      const toolIds = extractToolUseIds(message);

      if (toolIds.size > 0) {
        expectingToolResult = true;
        pendingToolIds = toolIds;
      } else {
        expectingToolResult = false;
        pendingToolIds.clear();
      }
    }

    if (message.role === 'user' && typeof message.content !== 'string') {
      const hasToolResult = message.content.some(block => block.type === 'tool_result');

      if (hasToolResult && !expectingToolResult) {
        errors.push(`Message ${i}: tool_result without preceding tool_use`);
      }

      if (hasToolResult) {
        // Validera att alla tool_result har matchande tool_use
        for (const block of message.content) {
          if (block.type === 'tool_result') {
            if (!block.tool_use_id || !pendingToolIds.has(block.tool_use_id)) {
              errors.push(`Message ${i}: tool_result ${block.tool_use_id} has no matching tool_use`);
            }
          }
        }

        expectingToolResult = false;
        pendingToolIds.clear();
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * HARD RESET: Rensar ALL history för en användare
 *
 * Använd för /start och /stop kommandon
 */
export async function hardResetHistory(userId: string, db: any): Promise<void> {
  try {
    // Convex example
    await db.delete({ userId });
    console.log(`✅ Hard reset: Cleared all history for user ${userId}`);
  } catch (error) {
    console.error(`❌ Hard reset failed for user ${userId}:`, error);
    throw error;
  }
}

/**
 * GRACEFUL ERROR RECOVERY
 *
 * Om Anthropic API kastar error, försök igen med saniterad history
 */
export async function callAnthropicWithRecovery(
  messages: Message[],
  anthropicClient: any,
  maxRetries = 2
): Promise<any> {
  let attempt = 0;
  let currentMessages = messages;

  while (attempt < maxRetries) {
    try {
      // Sanera innan varje försök
      const sanitized = sanitizeHistory(currentMessages);

      // Validera
      const validation = validateMessageSequence(sanitized);
      if (!validation.valid) {
        console.warn('⚠️ Message sequence validation failed:', validation.errors);
      }

      // Kör API-anrop
      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: sanitized
      });

      return response;

    } catch (error: any) {
      attempt++;

      if (error.message?.includes('unexpected tool_use_id')) {
        console.warn(`🔄 Attempt ${attempt}: tool_use_id error, retrying with deeper sanitization...`);

        // Aggressiv sanering: Ta bort alla tool_result block
        currentMessages = messages.map(msg => {
          if (msg.role === 'user' && typeof msg.content !== 'string') {
            return {
              ...msg,
              content: msg.content.filter(block => block.type !== 'tool_result')
            };
          }
          return msg;
        });

        continue;
      }

      // Annat fel - kasta vidare
      throw error;
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts`);
}

/**
 * EXEMPEL PÅ ANVÄNDNING
 */
export function example() {
  const messages: Message[] = [
    { role: 'user', content: 'Hello' },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Let me help' },
        { type: 'tool_use', id: 'toolu_123', name: 'search', input: {} }
      ]
    },
    {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'toolu_123', content: 'Result' },
        // Detta skulle vara orphaned om föregående tool_use saknas:
        // { type: 'tool_result', tool_use_id: 'toolu_999', content: 'Bad' }
      ]
    }
  ];

  const sanitized = sanitizeHistory(messages);
  const validation = validateMessageSequence(sanitized);

  console.log('Sanitized:', sanitized);
  console.log('Valid:', validation);
}
