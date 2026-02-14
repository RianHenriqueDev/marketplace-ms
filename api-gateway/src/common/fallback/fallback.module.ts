import { Module } from '@nestjs/common';
import { CacheFallbackService } from './cache.fallback';
import { DefaultFallbackService } from './default.fallback';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [CacheFallbackService, DefaultFallbackService],
  exports: [CacheFallbackService, DefaultFallbackService],
  imports: [HttpModule],
})
export class FallbackModule {}
