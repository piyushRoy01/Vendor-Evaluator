import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[Application Error]:', err);

  // Zod validation error handling
  if (err.name === 'ZodError') {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: err.errors
    });
    return;
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target || 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${Array.isArray(fields) ? fields.join(', ') : fields} already exists.`,
      errorCode: 'DUPLICATE_ENTITY'
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An internal server error occurred.';
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    errorCode
  });
}
