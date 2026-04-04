export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

class Logger {
  private isProduction = process.env.NODE_ENV === "production";

  private formatMessage(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    if (this.isProduction) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        data: this.sanitizeData(data),
      });
    }
    return `[${timestamp}] ${level}: ${message} ${data ? JSON.stringify(data, null, 2) : ""}`;
  }

  private sanitizeData(data: any) {
    if (!data) return data;
    const sensitiveKeys = ["password", "token", "creditCard", "secret", "key"];
    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = "[REDACTED]";
      }
    }
    return sanitized;
  }

  debug(message: string, data?: any) {
    if (!this.isProduction) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  info(message: string, data?: any) {
    console.info(this.formatMessage(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
  }

  error(message: string, data?: any) {
    console.error(this.formatMessage(LogLevel.ERROR, message, data));
  }
}

export const logger = new Logger();
