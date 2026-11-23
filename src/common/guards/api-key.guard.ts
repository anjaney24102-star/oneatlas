import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/** Protects write endpoints with an `x-api-key` header. If ADMIN_API_KEY is unset, writes are disabled. */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_KEY');
    const provided = ctx.switchToHttp().getRequest().headers['x-api-key'];
    if (!expected || typeof provided !== 'string') throw new UnauthorizedException('Invalid or missing API key');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Invalid or missing API key');
    return true;
  }
}
