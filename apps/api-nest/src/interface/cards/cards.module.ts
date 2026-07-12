import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity, CardEntity } from '@forreal/infrastructure-typeorm';
import { CardsController } from './cards.controller';
import { CardSchemaBootstrapService } from './card-schema-bootstrap.service';

@Module({
  imports: [TypeOrmModule.forFeature([CardEntity, AccountEntity])],
  controllers: [CardsController],
  providers: [CardSchemaBootstrapService],
})
export class CardsModule {}
