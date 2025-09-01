/**
 * Simple console-based logging system (Edge Runtime compatible)
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  info: (data: any, message?: string) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message || ''}`, data)
    }
  },
  warn: (data: any, message?: string) => {
    console.warn(`[WARN] ${message || ''}`, data)
  },
  error: (data: any, message?: string) => {
    console.error(`[ERROR] ${message || ''}`, data)
  },
  debug: (data: any, message?: string) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message || ''}`, data)
    }
  }
}

/**
 * Log request information for API endpoints
 */
export function logRequest(method: string, url: string, userId?: string, userType?: string) {
  logger.info({
    type: 'request',
    method,
    url,
    userId,
    userType
  }, `${method} ${url}`)
}

/**
 * Log response information for API endpoints
 */
export function logResponse(method: string, url: string, statusCode: number, duration?: number) {
  logger.info({
    type: 'response',
    method,
    url,
    statusCode,
    duration
  }, `${method} ${url} - ${statusCode}`)
}

/**
 * Log database operations
 */
export function logDatabase(operation: string, table: string, recordId?: string, error?: any) {
  if (error) {
    logger.error({
      type: 'database_error',
      operation,
      table,
      recordId,
      error: error.message || error
    }, `Database error: ${operation} on ${table}`)
  } else {
    logger.debug({
      type: 'database',
      operation,
      table,
      recordId
    }, `Database: ${operation} on ${table}`)
  }
}

/**
 * Log security events
 */
export function logSecurity(event: string, details: Record<string, any>) {
  logger.warn({
    type: 'security',
    event,
    ...details
  }, `Security event: ${event}`)
}

/**
 * Log business events (feedback submission, restaurant creation, etc.)
 */
export function logBusiness(event: string, details: Record<string, any>) {
  logger.info({
    type: 'business',
    event,
    ...details
  }, `Business event: ${event}`)
}

export default logger
