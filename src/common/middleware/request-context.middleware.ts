import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/** Assigns a request id and logs method, url, status and latency for every request. */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const id = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = id;
    res.setHeader('x-request-id', id);
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms [${id}]`);
    });
    next();
  }
}
