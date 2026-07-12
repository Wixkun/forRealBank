import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { AccountEntity, CardEntity } from '@forreal/infrastructure-typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotBannedGuard } from '../auth/not-banned.guard';
import { UpdateCardSettingsDto } from './dto/update-card-settings.dto';
import { UpdateCardStatusDto } from './dto/update-card-status.dto';

@Controller('cards')
@UseGuards(JwtAuthGuard, NotBannedGuard)
export class CardsController {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardRepo: Repository<CardEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
  ) {}

  @Get('me')
  async getMyCards(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    const accounts = await this.accountRepo.find({
      where: { userId },
      select: ['id', 'name', 'iban'],
    });
    if (accounts.length === 0) return [];

    const accountById = new Map(accounts.map((account) => [account.id, account]));
    const cards = await this.cardRepo
      .createQueryBuilder('card')
      .where('card.account_id IN (:...accountIds)', {
        accountIds: accounts.map((account) => account.id),
      })
      .orderBy('card.created_at', 'ASC')
      .getMany();

    return cards.map((card) => this.toResponse(card, accountById.get(card.accountId)!));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCardStatusDto,
    @Req() req: Request,
  ) {
    const { card, account } = await this.findOwnedCard(id, (req.user as { id: string }).id);
    if (card.status === 'cancelled') {
      throw new BadRequestException('A cancelled card cannot be reactivated');
    }

    card.status = dto.status;
    const saved = await this.cardRepo.save(card);
    return this.toResponse(saved, account);
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateCardSettingsDto,
    @Req() req: Request,
  ) {
    const { card, account } = await this.findOwnedCard(id, (req.user as { id: string }).id);
    if (card.status === 'cancelled') {
      throw new BadRequestException('A cancelled card cannot be modified');
    }

    Object.assign(card, dto);
    const saved = await this.cardRepo.save(card);
    return this.toResponse(saved, account);
  }

  private async findOwnedCard(id: string, userId: string) {
    const card = await this.cardRepo.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Card not found');
    const account = await this.accountRepo.findOne({ where: { id: card.accountId, userId } });
    if (!account) throw new NotFoundException('Card not found');
    return { card, account };
  }

  private toResponse(card: CardEntity, account: AccountEntity) {
    return {
      id: card.id,
      accountId: card.accountId,
      accountName: account.name,
      accountIban: account.iban,
      type: card.type,
      lastFour: card.lastFour,
      expiryDate: card.expiryDate,
      status: card.status,
      onlinePaymentsEnabled: card.onlinePaymentsEnabled,
      contactlessEnabled: card.contactlessEnabled,
      internationalPaymentsEnabled: card.internationalPaymentsEnabled,
      spendingLimit: Number(card.spendingLimit),
      withdrawalLimit: Number(card.withdrawalLimit),
    };
  }
}
