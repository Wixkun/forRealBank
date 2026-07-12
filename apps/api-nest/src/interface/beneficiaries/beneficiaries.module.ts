import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiaryEntity, NotificationEntity, UserEntity } from '@forreal/infrastructure-typeorm';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { BeneficiariesSchemaBootstrapService } from './beneficiaries-schema-bootstrap.service';
import { NotBannedGuard } from '../auth/not-banned.guard';
import { NewsModule } from '../feed/news.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BeneficiaryEntity, NotificationEntity, UserEntity]),
    // NewsModule exporte NewsService : news privée + signal SSE à l'ajout.
    NewsModule,
  ],
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService, BeneficiariesSchemaBootstrapService, NotBannedGuard],
})
export class BeneficiariesModule {}
