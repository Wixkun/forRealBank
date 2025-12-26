import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TradingPositionEntity } from '@forreal/infrastructure-typeorm/entities/TradingPositionEntity';
import { TradingOrderEntity } from '@forreal/infrastructure-typeorm/entities/TradingOrderEntity';
import { BrokerageAccountEntity } from '@forreal/infrastructure-typeorm/entities/BrokerageAccountEntity';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm/entities/MarketAssetEntity';

@Controller('trading')
@UseGuards(JwtAuthGuard)
export class TradingController {
  constructor(
    @InjectRepository(TradingPositionEntity)
    private readonly positionRepo: Repository<TradingPositionEntity>,
    @InjectRepository(TradingOrderEntity)
    private readonly orderRepo: Repository<TradingOrderEntity>,
    @InjectRepository(BrokerageAccountEntity)
    private readonly brokerageRepo: Repository<BrokerageAccountEntity>,
    @InjectRepository(MarketAssetEntity)
    private readonly assetRepo: Repository<MarketAssetEntity>,
  ) {}

  @Get('positions/:accountId')
  async getPositions(@Param('accountId') accountId: string, @Req() req: Request) {
    const userId = (req.user as any).id;

    const account = await this.brokerageRepo.findOne({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    const positions = await this.positionRepo.find({
      where: { brokerageAccountId: accountId },
      relations: ['asset'],
      order: { quantity: 'DESC' },
    });

    return positions.map(pos => ({
      id: pos.id,
      symbol: pos.asset.symbol,
      name: pos.asset.name,
      assetType: pos.asset.assetType,
      quantity: parseFloat(pos.quantity.toString()),
      avgPurchasePrice: parseFloat(pos.avgPurchasePrice.toString()),
    }));
  }

  @Get('orders/:accountId')
  async getOrders(@Param('accountId') accountId: string, @Req() req: Request) {
    const userId = (req.user as any).id;

    const account = await this.brokerageRepo.findOne({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    const orders = await this.orderRepo.find({
      where: { brokerageAccountId: accountId },
      relations: ['asset'],
      order: { createdAt: 'DESC' },
    });

    return orders.map(order => ({
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
  async createOrder(@Body() body: {
    accountId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
  }, @Req() req: Request) {
    const userId = (req.user as any).id;

    const account = await this.brokerageRepo.findOne({
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
      brokerageAccountId: body.accountId,
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
      order.executedPrice = body.price || 0; // Price should come from frontend or external API
      order.executedAt = new Date();
      await this.orderRepo.save(order);

      await this.updatePosition(body.accountId, asset.id, body.side, body.quantity, order.executedPrice);
    }

    return {
      id: order.id,
      status: order.status,
      message: order.status === 'executed' ? 'Order executed successfully' : 'Order placed successfully',
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
      where: { brokerageAccountId: accountId, assetId },
      relations: ['asset'],
    });

    if (side === 'buy') {
      if (position) {
        const totalCost = parseFloat(position.avgPurchasePrice.toString()) * parseFloat(position.quantity.toString()) + price * quantity;
        const newQuantity = parseFloat(position.quantity.toString()) + quantity;
        position.quantity = newQuantity;
        position.avgPurchasePrice = totalCost / newQuantity;
      } else {
        position = this.positionRepo.create({
          brokerageAccountId: accountId,
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
