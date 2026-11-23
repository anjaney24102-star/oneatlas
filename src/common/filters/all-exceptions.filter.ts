import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * One consistent error envelope for every failure:
 * { statusCode, error, message, details?, path, timestamp, requestId }
 * Also maps Prisma errors to proper HTTP codes (P2002 -> 409, P2025 -> 404, ...).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') message = body;
      else {
        const b = body as Record<string, any>;
        if (Array.isArray(b.message)) {
          message = 'Validation failed';
          details = b.message;
        } else message = b.message ?? exception.message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Unique constraint violated on: ${(exception.meta?.target as string[] | string) ?? 'unknown field'}`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Requested record not found';
          break;
        case 'P2003':
          status = HttpStatus.CONFLICT;
          message = 'Operation violates a relation constraint (record is referenced elsewhere or reference is missing)';
          break;
        default:
          this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid query parameters';
    } else {
      this.logger.error((exception as Error)?.stack ?? String(exception));
    }

    res.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      ...(details ? { details } : {}),
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }
}
