import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ModelsModule } from './models/models.module';
import { LabsModule } from './labs/labs.module';
import { ProvidersModule } from './providers/providers.module';
import { RankingsModule } from './rankings/rankings.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        ttl: Number(cfg.get('CACHE_TTL_SECONDS') ?? 60) * 1000, // cache-manager v5: milliseconds
        max: 500,
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [{ ttl: 60_000, limit: Number(cfg.get('THROTTLE_LIMIT') ?? 120) }],
    }),
    PrismaModule,
    ModelsModule,
    LabsModule,
    ProvidersModule,
    RankingsModule,
    SearchModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
