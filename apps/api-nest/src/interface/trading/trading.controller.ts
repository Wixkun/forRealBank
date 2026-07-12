import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import {
  InvestmentAccountEntity,
  InvestmentTransactionEntity,
  MarketAssetEntity,
  TradingOrderEntity,
  TradingPositionEntity,
} from '@forreal/infrastructure-typeorm';
import { RoleName } from '@forreal/domain';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotBannedGuard } from '../auth/not-banned.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateTradingOrderDto } from './dto/create-order.dto';
import { UpdateMarketAssetDto } from './dto/update-asset.dto';
import {
  HistoryPeriod,
  isSupportedAssetType,
  MarketDataService,
  roundMoney,
} from './market-quotes';
import { validateMarketExecution } from './trading-order.policy';

@Controller('trading')
@UseGuards(JwtAuthGuard, NotBannedGuard)
export class TradingController {
  constructor(
    @InjectRepository(TradingPositionEntity)
    private readonly positionRepo: Repository<TradingPositionEntity>,
    @InjectRepository(TradingOrderEntity)
    private readonly orderRepo: Repository<TradingOrderEntity>,
    @InjectRepository(InvestmentAccountEntity)
    private readonly investmentRepo: Repository<InvestmentAccountEntity>,
    @InjectRepository(MarketAssetEntity)
    private readonly assetRepo: Repository<MarketAssetEntity>,
    @InjectRepository(InvestmentTransactionEntity)
    private readonly investmentTxnRepo: Repository<InvestmentTransactionEntity>,
    private readonly dataSource: DataSource,
    private readonly marketData: MarketDataService,
  ) {}

  @Get('assets')
  async getAssets(@Query('type') type?: string, @Query('search') search?: string) {
    const normalizedSearch = search?.trim().toLocaleLowerCase() ?? '';
    const assets = await this.assetRepo.find({
      where: { isTradable: true, proposedAt: Not(IsNull()) },
      order: { assetType: 'ASC', symbol: 'ASC' },
    });

    const quotedAssets = await Promise.all(
      assets
        .filter((asset) => isSupportedAssetType(asset.assetType))
        .map(async (asset) => ({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          assetType: asset.assetType,
          isTradable: asset.isTradable,
          ...this.marketData.getDisplayQuote(asset),
        })),
    );

    return quotedAssets
      .filter((asset) => !type || asset.assetType === type)
      .filter(
        (asset) =>
          !normalizedSearch ||
          asset.symbol.toLocaleLowerCase().includes(normalizedSearch) ||
          asset.name.toLocaleLowerCase().includes(normalizedSearch),
      );
  }

  @Get('assets/:symbol/history')
  async getAssetHistory(
    @Param('symbol') symbol: string,
    @Query('period') requestedPeriod?: string,
  ) {
    const period: HistoryPeriod =
      requestedPeriod === '1d' || requestedPeriod === '1y' ? requestedPeriod : '1m';
    const asset = await this.assetRepo.findOne({
      where: {
        symbol: symbol.trim().toUpperCase(),
        isTradable: true,
        proposedAt: Not(IsNull()),
      },
    });
    if (!asset || !isSupportedAssetType(asset.assetType)) {
      throw new NotFoundException('Actif non proposé par le directeur');
    }
    return this.marketData.getHistory(asset, period);
  }

  @Get('management/assets')
  @UseGuards(RolesGuard)
  @Roles(RoleName.DIRECTOR)
  async getManagedAssets() {
    const assets = await this.assetRepo.find({ order: { assetType: 'ASC', symbol: 'ASC' } });
    return Promise.all(
      assets
        .filter((asset) => isSupportedAssetType(asset.assetType))
        .map(async (asset) => ({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          assetType: asset.assetType,
          isTradable: asset.isTradable,
          ...this.marketData.getDisplayQuote(asset),
        })),
    );
  }

  @Patch('management/assets/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.DIRECTOR)
  async updateManagedAsset(
    @Param('id') id: string,
    @Body() body: UpdateMarketAssetDto,
    @Req() req: Request,
  ) {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset || !isSupportedAssetType(asset.assetType)) {
      throw new NotFoundException('Actif introuvable');
    }
    asset.isTradable = body.isTradable;
    asset.proposedByDirectorId = body.isTradable ? (req.user as { id: string }).id : null;
    asset.proposedAt = body.isTradable ? new Date() : null;
    await this.assetRepo.save(asset);
    return { id: asset.id, isTradable: asset.isTradable, proposedAt: asset.proposedAt };
  }

  @Get('positions/:accountId')
  async getPositions(@Param('accountId') accountId: string, @Req() req: Request) {
    await this.findOwnedAccount(accountId, (req.user as { id: string }).id);
    const positions = await this.positionRepo.find({
      where: { investmentAccountId: accountId },
      relations: ['asset'],
      order: { quantity: 'DESC' },
    });

    return Promise.all(
      positions.map(async (position) => {
        const quantity = Number(position.quantity);
        const avgPurchasePrice = Number(position.avgPurchasePrice);
        const quote = isSupportedAssetType(position.asset.assetType)
          ? this.marketData.getDisplayQuote(position.asset)
          : {
              price: avgPurchasePrice,
              source: 'simulated' as const,
              asOf: new Date().toISOString(),
            };
        const marketPrice = quote.price;
        const marketValue = quantity * marketPrice;
        const gainLoss = marketValue - quantity * avgPurchasePrice;

        return {
          id: position.id,
          symbol: position.asset.symbol,
          name: position.asset.name,
          assetType: position.asset.assetType,
          quantity,
          avgPurchasePrice,
          marketPrice,
          marketValue: roundMoney(marketValue),
          gainLoss: roundMoney(gainLoss),
          gainLossPercent:
            avgPurchasePrice > 0
              ? roundPercent(((marketPrice - avgPurchasePrice) / avgPurchasePrice) * 100)
              : 0,
          quoteSource: quote.source,
          quoteAsOf: quote.asOf,
        };
      }),
    );
  }

  @Get('activities/:accountId')
  async getActivities(@Param('accountId') accountId: string, @Req() req: Request) {
    await this.findOwnedAccount(accountId, (req.user as { id: string }).id);
    const [orders, cashMovements] = await Promise.all([
      this.orderRepo.find({
        where: { investmentAccountId: accountId },
        relations: ['asset'],
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.investmentTxnRepo.find({
        where: { investmentAccountId: accountId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
    ]);

    const orderItems = orders.map((order) => ({
      id: order.id,
      activityType: 'order' as const,
      date: order.createdAt.toISOString(),
      description: `${order.side === 'buy' ? 'Achat' : 'Vente'} ${order.asset.symbol} × ${Number(order.quantity)}`,
      amount: order.executedPrice
        ? roundMoney(Number(order.quantity) * Number(order.executedPrice))
        : null,
      type: order.side === 'buy' ? ('debit' as const) : ('credit' as const),
      status: order.status,
      symbol: order.asset.symbol,
    }));

    const cashItems = cashMovements.map((movement) => ({
      id: movement.id,
      activityType: 'cash' as const,
      date: movement.createdAt.toISOString(),
      description: movement.description,
      amount: Number(movement.amount),
      type: movement.type === 'deposit' ? ('credit' as const) : ('debit' as const),
      status: 'executed' as const,
      symbol: null,
    }));

    return [...orderItems, ...cashItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  @Get('orders/:accountId')
  async getOrders(@Param('accountId') accountId: string, @Req() req: Request) {
    await this.findOwnedAccount(accountId, (req.user as { id: string }).id);
    const orders = await this.orderRepo.find({
      where: { investmentAccountId: accountId },
      relations: ['asset'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return orders.map((order) => ({
      id: order.id,
      symbol: order.asset.symbol,
      name: order.asset.name,
      orderType: order.orderType,
      side: order.side,
      quantity: Number(order.quantity),
      price: order.price ? Number(order.price) : null,
      status: order.status,
      executedPrice: order.executedPrice ? Number(order.executedPrice) : null,
      executedAt: order.executedAt,
      createdAt: order.createdAt,
    }));
  }

  @Post('orders')
  async createOrder(@Body() body: CreateTradingOrderDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    const symbol = body.symbol.trim().toUpperCase();
    const asset = await this.assetRepo.findOne({
      where: { symbol, isTradable: true, proposedAt: Not(IsNull()) },
    });

    if (!asset || !isSupportedAssetType(asset.assetType)) {
      throw new NotFoundException('Actif non proposé par le directeur');
    }
    if (!asset.isTradable) throw new BadRequestException("Cet actif n'est pas négociable");
    if (body.orderType !== 'market' && !body.price) {
      throw new BadRequestException('Un prix est requis pour un ordre limite ou stop');
    }

    const quote = await this.marketData.getQuote(asset);

    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(InvestmentAccountEntity, {
        where: { id: body.accountId, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!account) throw new NotFoundException("Compte d'investissement introuvable");
      if (account.status !== 'active') throw new BadRequestException("Ce compte n'est pas actif");

      const order = manager.create(TradingOrderEntity, {
        investmentAccountId: account.id,
        assetId: asset.id,
        orderType: body.orderType,
        side: body.side,
        quantity: body.quantity,
        price: body.price,
        status: 'pending',
      });

      if (body.orderType !== 'market') {
        await manager.save(order);
        return { id: order.id, status: order.status, message: 'Ordre enregistré' };
      }

      const executionPrice = quote.price;
      let position = await manager.findOne(TradingPositionEntity, {
        where: { investmentAccountId: account.id, assetId: asset.id },
        lock: { mode: 'pessimistic_write' },
      });
      const executionAmount = validateMarketExecution({
        side: body.side,
        quantity: body.quantity,
        executionPrice,
        cashBalance: Number(account.cashBalance),
        heldQuantity: position ? Number(position.quantity) : 0,
      });

      if (body.side === 'buy') {
        account.cashBalance = roundMoney(Number(account.cashBalance) - executionAmount);
        position = await this.buy(
          manager,
          position,
          account.id,
          asset.id,
          body.quantity,
          executionPrice,
        );
      } else {
        // La policy garantit qu'une position suffisante existe pour une vente.
        if (!position) throw new BadRequestException('Quantité disponible insuffisante');
        account.cashBalance = roundMoney(Number(account.cashBalance) + executionAmount);
        await this.sell(manager, position, body.quantity);
      }

      order.status = 'executed';
      order.executedPrice = executionPrice;
      order.executedAt = new Date();
      await manager.save(order);
      await this.refreshAccountValuation(manager, account);

      return {
        id: order.id,
        status: order.status,
        executedPrice: executionPrice,
        executedAmount: executionAmount,
        cashBalance: Number(account.cashBalance),
        message: 'Ordre exécuté',
      };
    });
  }

  private async findOwnedAccount(accountId: string, userId: string) {
    const account = await this.investmentRepo.findOne({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundException("Compte d'investissement introuvable");
    return account;
  }

  private async buy(
    manager: EntityManager,
    position: TradingPositionEntity | null,
    accountId: string,
    assetId: string,
    quantity: number,
    price: number,
  ) {
    if (!position) {
      position = manager.create(TradingPositionEntity, {
        investmentAccountId: accountId,
        assetId,
        quantity,
        avgPurchasePrice: price,
      });
    } else {
      const oldQuantity = Number(position.quantity);
      const newQuantity = oldQuantity + quantity;
      position.avgPurchasePrice = roundMoney(
        (Number(position.avgPurchasePrice) * oldQuantity + price * quantity) / newQuantity,
      );
      position.quantity = newQuantity;
    }
    return manager.save(position);
  }

  private async sell(manager: EntityManager, position: TradingPositionEntity, quantity: number) {
    const remaining = Number(position.quantity) - quantity;
    if (remaining <= 0.000000001) await manager.remove(position);
    else {
      position.quantity = remaining;
      await manager.save(position);
    }
  }

  private async refreshAccountValuation(manager: EntityManager, account: InvestmentAccountEntity) {
    const positions = await manager.find(TradingPositionEntity, {
      where: { investmentAccountId: account.id },
      relations: ['asset'],
    });
    let holdingsValue = 0;
    let costBasis = 0;
    for (const position of positions) {
      const quantity = Number(position.quantity);
      const marketPrice = isSupportedAssetType(position.asset.assetType)
        ? this.marketData.getDisplayQuote(position.asset).price
        : Number(position.avgPurchasePrice);
      holdingsValue += quantity * marketPrice;
      costBasis += quantity * Number(position.avgPurchasePrice);
    }
    account.totalValue = roundMoney(Number(account.cashBalance) + holdingsValue);
    account.totalGainLoss = roundMoney(holdingsValue - costBasis);
    await manager.save(account);
  }
}

function roundPercent(value: number) {
  return Math.round((value + 1e-9) * 100) / 100;
}
