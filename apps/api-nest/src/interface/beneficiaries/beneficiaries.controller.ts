import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotBannedGuard } from '../auth/not-banned.guard';
import { BeneficiariesService } from './beneficiaries.service';
import { CreateBeneficiaryDto, UpdateBeneficiaryDto } from './dto/beneficiary.dto';

function extractUserId(req: Request): string {
  return (req.user as { id: string }).id;
}

// NotBannedGuard : les bénéficiaires font partie des opérations bancaires,
// bloquées pour un compte banni même si son JWT n'a pas encore expiré.
// Uniquement SES bénéficiaires : le userId vient du JWT, jamais de l'URL.
@Controller('beneficiaries')
@UseGuards(JwtAuthGuard, NotBannedGuard)
export class BeneficiariesController {
  constructor(@Inject(BeneficiariesService) private readonly beneficiaries: BeneficiariesService) {}

  @Get()
  async list(@Req() req: Request) {
    return this.beneficiaries.listByUser(extractUserId(req));
  }

  @HttpCode(201)
  @Post()
  async create(@Body() dto: CreateBeneficiaryDto, @Req() req: Request) {
    return this.beneficiaries.create(extractUserId(req), dto.label, dto.iban);
  }

  // Modification du libellé uniquement (l'IBAN est immuable).
  @HttpCode(200)
  @Patch(':id')
  async updateLabel(
    @Param('id') id: string,
    @Body() dto: UpdateBeneficiaryDto,
    @Req() req: Request,
  ) {
    return this.beneficiaries.updateLabel(extractUserId(req), id, dto.label);
  }

  @HttpCode(204)
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    await this.beneficiaries.delete(extractUserId(req), id);
  }
}
