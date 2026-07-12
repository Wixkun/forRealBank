import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@forreal/domain';
import { UsersManagementService, ManagementActor } from './users-management.service';
import { AdvisorReassignmentService } from './advisor-reassignment.service';
import { BanRequestsService } from './ban-requests.service';
import {
  CreateBanRequestDto,
  DirectoryQueryDto,
  ReassignAdvisorDto,
  RejectBanRequestDto,
  TransactionsRangeQueryDto,
} from './dto/users-management.dto';

function actorOf(req: Request): ManagementActor {
  const auth = (req as any).auth as { userId: string; roles: RoleName[] };
  return { userId: auth.userId, roles: auth.roles ?? [] };
}

/**
 * Page de gestion des utilisateurs (fusion Users + Admin). Toutes les règles
 * de périmètre sont appliquées côté serveur (RolesGuard + services) : le
 * frontend n'est jamais une barrière de sécurité.
 */
@Controller('management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADVISOR, RoleName.DIRECTOR, RoleName.ADMIN)
export class UsersManagementController {
  constructor(
    @Inject(UsersManagementService) private readonly management: UsersManagementService,
    @Inject(AdvisorReassignmentService)
    private readonly reassignment: AdvisorReassignmentService,
    @Inject(BanRequestsService) private readonly banRequestsService: BanRequestsService,
  ) {}

  // Annuaire par rôle : advisor → uniquement SES clients ; director/admin →
  // tous les advisors et tous les clients. Recherche SQL (prénom, nom, nom
  // complet, email — insensible à la casse, espaces tolérés).
  @Get('directory')
  async directory(@Query() query: DirectoryQueryDto, @Req() req: Request) {
    return this.management.listDirectory(actorOf(req), query.role, query.search);
  }

  @Get('users/:id')
  async userDetails(@Param('id') id: string, @Req() req: Request) {
    return this.management.getUserDetails(actorOf(req), id);
  }

  // Les trois comptes du client (lecture seule — aucune opération d'écriture
  // n'existe dans ce module).
  @Get('users/:id/accounts')
  async clientAccounts(@Param('id') id: string, @Req() req: Request) {
    return this.management.listClientAccounts(actorOf(req), id);
  }

  @Get('accounts/bank/:accountId/transactions')
  async bankTransactions(
    @Param('accountId') accountId: string,
    @Query() query: TransactionsRangeQueryDto,
    @Req() req: Request,
  ) {
    return this.management.listBankTransactions(actorOf(req), accountId, query);
  }

  // Compte Investment : uniquement les mouvements monétaires (jamais les
  // ordres ni la valorisation) — même périmètre que le relevé PDF.
  @Get('accounts/investment/:accountId/transactions')
  async investmentTransactions(
    @Param('accountId') accountId: string,
    @Query() query: TransactionsRangeQueryDto,
    @Req() req: Request,
  ) {
    return this.management.listInvestmentCashMovements(actorOf(req), accountId, query);
  }

  // ─── Réattribution (DIRECTOR / ADMIN) ─────────────────────────────────────

  @HttpCode(200)
  @Post('clients/:id/reassign')
  @Roles(RoleName.DIRECTOR, RoleName.ADMIN)
  async reassign(
    @Param('id') clientId: string,
    @Body() body: ReassignAdvisorDto,
    @Req() req: Request,
  ) {
    return this.reassignment.reassign({
      actorId: actorOf(req).userId,
      clientId,
      newAdvisorId: body.advisorId,
    });
  }

  // ─── Demandes de bannissement ─────────────────────────────────────────────

  @HttpCode(201)
  @Post('ban-requests')
  @Roles(RoleName.ADVISOR)
  async createBanRequest(@Body() body: CreateBanRequestDto, @Req() req: Request) {
    return this.banRequestsService.create({
      advisorId: actorOf(req).userId,
      clientId: body.clientId,
      reason: body.reason,
      attachments: body.attachments ?? [],
    });
  }

  // Cartes de demande dans une conversation (membres uniquement — le service
  // vérifie l'appartenance ; canDecide n'est vrai que pour le director assigné).
  @Get('ban-requests/by-conversation/:conversationId')
  async banRequestsByConversation(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
  ) {
    return this.banRequestsService.listByConversation(conversationId, actorOf(req).userId);
  }

  @HttpCode(200)
  @Post('ban-requests/:id/accept')
  @Roles(RoleName.DIRECTOR)
  async acceptBanRequest(@Param('id') id: string, @Req() req: Request) {
    return this.banRequestsService.decide({
      requestId: id,
      actorId: actorOf(req).userId,
      accept: true,
    });
  }

  @HttpCode(200)
  @Post('ban-requests/:id/reject')
  @Roles(RoleName.DIRECTOR)
  async rejectBanRequest(
    @Param('id') id: string,
    @Body() body: RejectBanRequestDto,
    @Req() req: Request,
  ) {
    return this.banRequestsService.decide({
      requestId: id,
      actorId: actorOf(req).userId,
      accept: false,
      comment: body.comment,
    });
  }
}
