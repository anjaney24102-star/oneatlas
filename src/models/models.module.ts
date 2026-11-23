import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { ModelsAdminService } from './models-admin.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
  controllers: [ModelsController],
  providers: [ModelsService, ModelsAdminService, ApiKeyGuard],
  exports: [ModelsService],
})
export class ModelsModule {}
