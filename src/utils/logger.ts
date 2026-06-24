const isDevelopment = process.env.NODE_ENV === 'development';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  stack?: string;
}

const formatLog = (entry: LogEntry): string => {
  const { timestamp, level, message, data, stack } = entry;
  
  let logString = `[${timestamp}] [${level}] ${message}`;
  
  if (data && Object.keys(data).length > 0) {
    logString += '\n' + JSON.stringify(data, null, 2);
  }
  
  if (stack && isDevelopment) {
    logString += '\n' + stack;
  }
  
  return logString;
};

const getLogFunction = (level: LogLevel) => {
  switch (level) {
    case LogLevel.DEBUG:
      return isDevelopment ? console.debug : () => {};
    case LogLevel.INFO:
      return console.log;
    case LogLevel.WARN:
      return console.warn;
    case LogLevel.ERROR:
      return console.error;
  }
};

export const logger = {
  debug: (message: string, data?: Record<string, any>) => {
    if (!isDevelopment) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      data
    };
    
    getLogFunction(LogLevel.DEBUG)(formatLog(entry));
  },

  info: (message: string, data?: Record<string, any>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data
    };
    
    getLogFunction(LogLevel.INFO)(formatLog(entry));
  },

  warn: (message: string, data?: Record<string, any>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data
    };
    
    getLogFunction(LogLevel.WARN)(formatLog(entry));
  },

  error: (message: string, error?: Error | any, data?: Record<string, any>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      data: {
        ...data,
        errorMessage: error?.message,
        errorCode: error?.code
      },
      stack: error?.stack
    };
    
    getLogFunction(LogLevel.ERROR)(formatLog(entry));
  },

  request: (method: string, path: string, statusCode: number, duration: number) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `${method} ${path}`,
      data: {
        statusCode,
        durationMs: duration
      }
    };
    
    getLogFunction(LogLevel.INFO)(formatLog(entry));
  }
};
