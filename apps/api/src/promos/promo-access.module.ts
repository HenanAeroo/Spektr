import { Global, Module } from '@nestjs/common';
import { PromoAccessService } from './promo-access.service';

/**
 * Global so PromoAccessService can be injected into any feature service
 * (documents, objectives, users, applications, promos) without per-module wiring.
 * Depends only on the already-global PrismaService.
 */
@Global()
@Module({
  providers: [PromoAccessService],
  exports: [PromoAccessService],
})
export class PromoAccessModule {}
