/**
 * Simple logger utility for the TP Opportunity Finder
 *
 * In development: logs to console
 * In production: only logs errors and warnings (can be extended to external service)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === 'development';

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      if (isDevelopment) {
        errorContext.stack = error.stack;
      }
    } else if (error) {
      errorContext.error = error;
    }

    console.error(formatMessage('error', message, errorContext));
  },
};

export default logger;
