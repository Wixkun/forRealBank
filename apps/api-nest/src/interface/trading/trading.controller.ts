import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TradingPositionEntity } from '@forreal/infrastructure-typeorm';
import { TradingOrderEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentAccountEntity } from '@forreal/infrastructure-typeorm';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentTransactionEntity } from '@forreal/infrastructure-typeorm';

@Controller('trading')
@UseGuards(JwtAuthGuard)
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
  ) {}

  @Get('positions/:accountId')
  async getPositions(@Param('accountId') accountId: string, @Req() req: Request) {
    const userId = (req.user as any).id;

    const account = await this.investmentRepo.findOne({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    const positions = await this.positionRepo.find({
      where: { investmentAccountId: accountId },
      relations: ['asset'],
      order: { quantity: 'DESC' },
    });

    return positions.map((pos) => ({
      id: pos.id,
      symbol: pos.asset.symbol,
      name: pos.asset.name,
      assetType: pos.asset.assetType,
      quantity: parseFloat(pos.quantity.toString()),
      avgPurchasePrice: parseFloat(pos.avgPurchasePrice.toString()),
    }));
  }

  @Get('activities/:accountId')
  async getActivities(@Param('accountId') accountId: string, @Req() req: Request) {
    const userId = (req.user as any).id;

    const account = await this.investmentRepo.findOne({ where: { id: accountId, userId } });
    if (!account) throw new Error('Account not found');

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

    const orderItems = orders.map((o) => ({
      id: o.id,
      activityType: 'order' as const,
      date: o.createdAt.toISOString(),
      description: `${o.side === 'buy' ? 'Achat' : 'Vente'} ${o.asset.symbol} × ${parseFloat(o.quantity.toString())}`,
      amount: o.executedPrice
        ? parseFloat(o.quantity.toString()) * parseFloat(o.executedPrice.toString())
        : null,
      type: o.side === 'buy' ? ('debit' as const) : ('credit' as const),
      status: o.status,
      symbol: o.asset.symbol,
    }));

    const cashItems = cashMovements.map((c) => ({
      id: c.id,
      activityType: 'cash' as const,
      date: c.createdAt.toISOString(),
      description: c.description,
      amount: parseFloat(c.amount.toString()),
      type: c.type === 'deposit' ? ('credit' as const) : ('debit' as const),
      status: 'executed' as const,
      symbol: null,
    }));

    return [...orderItems, ...cashItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  @Get('orders/:accountId')
  async getOrders(@Param('accountId') accountId: string, @Req() req: Request) {
    const userId = (req.user as any).id;

    const account = await this.investmentRepo.findOne({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    const orders = await this.orderRepo.find({
      where: { investmentAccountId: accountId },
      relations: ['asset'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => ({
      id: order.id,
      symbol: order.asset.symbol,
      name: order.asset.name,
      orderType: order.orderType,
      side: order.side,
      quantity: parseFloat(order.quantity.toString()),
      price: order.price ? parseFloat(order.price.toString()) : null,
      status: order.status,
      executedPrice: order.executedPrice ? parseFloat(order.executedPrice.toString()) : null,
      executedAt: order.executedAt,
      createdAt: order.createdAt,
    }));
  }

  @Post('orders')
  async createOrder(
    @Body()
    body: {
      accountId: string;
      symbol: string;
      side: 'buy' | 'sell';
      quantity: number;
      orderType: 'market' | 'limit' | 'stop';
      price?: number;
    },
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;

    const account = await this.investmentRepo.findOne({
      where: { id: body.accountId, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    const asset = await this.assetRepo.findOne({
      where: { symbol: body.symbol.toUpperCase() },
    });
    if (!asset) {
      throw new Error('Asset not found');
    }

    const order = this.orderRepo.create({
      investmentAccountId: body.accountId,
      assetId: asset.id,
      orderType: body.orderType,
      side: body.side,
      quantity: body.quantity,
      price: body.price,
      status: 'pending',
    });

    await this.orderRepo.save(order);

    if (body.orderType === 'market') {
      order.status = 'executed';
      order.executedPrice = body.price || 0;
      order.executedAt = new Date();
      await this.orderRepo.save(order);

      await this.updatePosition(
        body.accountId,
        asset.id,
        body.side,
        body.quantity,
        order.executedPrice,
      );
    }

    return {
      id: order.id,
      status: order.status,
      message:
        order.status === 'executed' ? 'Order executed successfully' : 'Order placed successfully',
    };
  }

  private async updatePosition(
    accountId: string,
    assetId: string,
    side: 'buy' | 'sell',
    quantity: number,
    price: number,
  ) {
    let position = await this.positionRepo.findOne({
      where: { investmentAccountId: accountId, assetId },
      relations: ['asset'],
    });

    if (side === 'buy') {
      if (position) {
        const totalCost =
          parseFloat(position.avgPurchasePrice.toString()) *
            parseFloat(position.quantity.toString()) +
          price * quantity;
        const newQuantity = parseFloat(position.quantity.toString()) + quantity;
        position.quantity = newQuantity;
        position.avgPurchasePrice = totalCost / newQuantity;
      } else {
        position = this.positionRepo.create({
          investmentAccountId: accountId,
          assetId,
          quantity,
          avgPurchasePrice: price,
        });
      }
      await this.positionRepo.save(position);
    } else if (side === 'sell' && position) {
      const newQuantity = parseFloat(position.quantity.toString()) - quantity;
      if (newQuantity <= 0) {
        await this.positionRepo.remove(position);
      } else {
        position.quantity = newQuantity;
        await this.positionRepo.save(position);
      }
    }
  }
}
