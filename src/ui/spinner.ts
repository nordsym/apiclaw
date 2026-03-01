/**
 * APIClaw MCP Auto-Setup - Spinner Utilities
 * 
 * Ora-based spinner wrapper with consistent styling and state management.
 * Provides a fluent API for progress indication during CLI operations.
 */

import ora, { Ora, Options as OraOptions } from 'ora';
import { colors, icons } from './colors.js';

export interface SpinnerOptions {
  /** Spinner text */
  text?: string;
  /** Prefix text before spinner */
  prefix?: string;
  /** Suffix text after spinner */
  suffix?: string;
  /** Whether to show spinner in CI environments */
  showInCI?: boolean;
  /** Custom spinner frames */
  spinner?: OraOptions['spinner'];
}

export interface TaskSpinner {
  /** Start the spinner with optional text */
  start(text?: string): TaskSpinner;
  /** Update spinner text */
  text(text: string): TaskSpinner;
  /** Mark as successful with optional message */
  succeed(text?: string): TaskSpinner;
  /** Mark as failed with optional message */
  fail(text?: string): TaskSpinner;
  /** Mark as warning with optional message */
  warn(text?: string): TaskSpinner;
  /** Show info message without stopping */
  info(text?: string): TaskSpinner;
  /** Stop spinner without status */
  stop(): TaskSpinner;
  /** Stop and clear spinner */
  clear(): TaskSpinner;
  /** Check if spinner is currently spinning */
  isSpinning(): boolean;
  /** Access underlying ora instance */
  readonly ora: Ora;
}

/**
 * Create a task spinner with APIClaw styling
 */
export function createSpinner(options: SpinnerOptions = {}): TaskSpinner {
  const {
    text = '',
    prefix = '',
    suffix = '',
    showInCI = false,
    spinner = 'dots',
  } = options;

  const oraInstance = ora({
    text,
    prefixText: prefix,
    suffixText: suffix,
    spinner,
    // Disable spinner in CI by default for cleaner logs
    isEnabled: showInCI || !process.env.CI,
  });

  const wrapper: TaskSpinner = {
    start(newText?: string) {
      if (newText) oraInstance.text = newText;
      oraInstance.start();
      return wrapper;
    },

    text(newText: string) {
      oraInstance.text = newText;
      return wrapper;
    },

    succeed(newText?: string) {
      oraInstance.succeed(newText);
      return wrapper;
    },

    fail(newText?: string) {
      oraInstance.fail(newText);
      return wrapper;
    },

    warn(newText?: string) {
      oraInstance.warn(newText);
      return wrapper;
    },

    info(newText?: string) {
      oraInstance.info(newText);
      return wrapper;
    },

    stop() {
      oraInstance.stop();
      return wrapper;
    },

    clear() {
      oraInstance.stopAndPersist({ symbol: '' });
      return wrapper;
    },

    isSpinning() {
      return oraInstance.isSpinning;
    },

    get ora() {
      return oraInstance;
    },
  };

  return wrapper;
}

/**
 * Convenience function for common spinner patterns
 */
export const spinner = {
  /**
   * Create and start a spinner in one call
   */
  start(text: string): TaskSpinner {
    return createSpinner({ text }).start();
  },

  /**
   * Run an async task with spinner, auto-succeed/fail
   */
  async task<T>(
    text: string,
    fn: (spinner: TaskSpinner) => Promise<T>,
    options: {
      successText?: string | ((result: T) => string);
      failText?: string | ((error: Error) => string);
    } = {}
  ): Promise<T> {
    const s = createSpinner({ text }).start();
    
    try {
      const result = await fn(s);
      const successMsg = typeof options.successText === 'function'
        ? options.successText(result)
        : options.successText || text;
      s.succeed(successMsg);
      return result;
    } catch (error) {
      const failMsg = typeof options.failText === 'function'
        ? options.failText(error as Error)
        : options.failText || `${text} - Failed`;
      s.fail(failMsg);
      throw error;
    }
  },

  /**
   * Run multiple tasks in sequence with spinners
   */
  async sequence<T>(
    tasks: Array<{
      text: string;
      task: () => Promise<T>;
      successText?: string;
      failText?: string;
    }>
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (const { text, task, successText, failText } of tasks) {
      const result = await this.task(text, task, { successText, failText });
      results.push(result);
    }
    
    return results;
  },
};

/**
 * Progress tracker for multi-step operations
 */
export class ProgressTracker {
  private current = 0;
  private readonly total: number;
  private readonly items: string[];
  private readonly taskSpinner: TaskSpinner;

  constructor(items: string[]) {
    this.items = items;
    this.total = items.length;
    this.taskSpinner = createSpinner();
  }

  /**
   * Start tracking progress
   */
  start(): void {
    this.current = 0;
    this.updateText();
    this.taskSpinner.start();
  }

  /**
   * Move to next item
   */
  next(): void {
    this.current++;
    this.updateText();
  }

  /**
   * Mark current item as done and move to next
   */
  done(message?: string): void {
    this.taskSpinner.succeed(message || this.items[this.current - 1]);
    if (this.current < this.total) {
      this.taskSpinner.start(this.formatProgress());
    }
  }

  /**
   * Mark as complete
   */
  complete(message: string): void {
    this.taskSpinner.succeed(message);
  }

  /**
   * Mark as failed
   */
  fail(message: string): void {
    this.taskSpinner.fail(message);
  }

  private updateText(): void {
    this.taskSpinner.text(this.formatProgress());
  }

  private formatProgress(): string {
    const item = this.items[this.current] || 'Processing...';
    return `[${this.current + 1}/${this.total}] ${item}`;
  }
}

/**
 * Silent spinner for non-interactive/CI environments
 * Logs plain text instead of animated spinners
 */
export function createSilentSpinner(options: SpinnerOptions = {}): TaskSpinner {
  const log = (symbol: string, text?: string) => {
    if (text) {
      console.log(`${symbol} ${text}`);
    }
  };

  let currentText = options.text || '';

  const wrapper: TaskSpinner = {
    start(text?: string) {
      currentText = text || currentText;
      log(colors.muted('○'), currentText);
      return wrapper;
    },

    text(text: string) {
      currentText = text;
      return wrapper;
    },

    succeed(text?: string) {
      log(icons.success, text || currentText);
      return wrapper;
    },

    fail(text?: string) {
      log(icons.error, text || currentText);
      return wrapper;
    },

    warn(text?: string) {
      log(icons.warning, text || currentText);
      return wrapper;
    },

    info(text?: string) {
      log(icons.info, text || currentText);
      return wrapper;
    },

    stop() {
      return wrapper;
    },

    clear() {
      return wrapper;
    },

    isSpinning() {
      return false;
    },

    get ora(): Ora {
      // Return a mock for compatibility
      return {} as Ora;
    },
  };

  return wrapper;
}

/**
 * Get appropriate spinner based on environment
 */
export function getSpinner(options: SpinnerOptions = {}): TaskSpinner {
  // Use silent spinner in CI or when stdout is not a TTY
  if (process.env.CI || !process.stdout.isTTY) {
    return createSilentSpinner(options);
  }
  return createSpinner(options);
}
