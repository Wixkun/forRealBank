import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode, Inject,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@forreal/domain/user/RoleName';

import { UpdateUserProfileUseCase } from '@forreal/application/user/usecases/UpdateUserProfileUseCase';
import { DeleteOwnAccountUseCase } from '@forreal/application/user/usecases/DeleteOwnAccountUseCase';
import { ListUsersUseCase } from '@forreal/application/user/usecases/ListUsersUseCase';
import { UpdateUserRolesUseCase } from '@forreal/application/user/usecases/UpdateUserRolesUseCase';
import { DeleteUserByAdminUseCase } from '@forreal/application/user/usecases/DeleteUserByAdminUseCase';
import { BanUserUseCase } from '@forreal/application/user/usecases/BanUserUseCase';
import { UnbanUserUseCase } from '@forreal/application/user/usecases/UnbanUserUseCase';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { ListUsersQueryDto } from './dto/list-users.dto';
import { UpdateRolesDto } from './dto/update-roles.dto';
import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { UserPresenter } from './user.presenter';

@Controller('/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly updateProfile: UpdateUserProfileUseCase,
    private readonly deleteOwn: DeleteOwnAccountUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateRoles: UpdateUserRolesUseCase,
    private readonly deleteByAdmin: DeleteUserByAdminUseCase,
    private readonly banUser: BanUserUseCase,
    private readonly unbanUser: UnbanUserUseCase,
    @Inject(IUserRepository) private readonly users: IUserRepository,
  ) {}

  @HttpCode(200)
    @Get('me')
    async getMe(@Req() req: Request) {
      const auth = (req as any).auth;
      if (!auth?.userId) throw new BadRequestException('Missing auth context');

      const user = await this.users.findById(auth.userId);
      if (!user) throw new NotFoundException('User not found');

      return UserPresenter.toDTO(user);
    }

    @HttpCode(200)
  @Patch('me')
  async updateMe(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    try {
      const auth = (req as any).auth;
      if (!auth?.userId) throw new BadRequestException('Missing auth context');

      if (
        (dto.firstName === undefined || dto.firstName === null) &&
        (dto.lastName === undefined || dto.lastName === null)
      ) {
        throw new BadRequestException('Nothing to update');
      }
      await this.updateProfile.execute({
        userId: auth.userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
      return { success: true, message: 'Profile updated' };
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_FULL_NAME') {
        throw new BadRequestException('First and last name are required');
      }
      throw error;
    }
  }

  @HttpCode(204)
  @Delete('me')
  async deleteMe(@Req() req: Request) {
    const auth = (req as any).auth;
    if (!auth?.userId) throw new BadRequestException('Missing auth context');
    await this.deleteOwn.execute({ userId: auth.userId });
    return;
  }

  @Get()
  @Roles(RoleName.ADMIN)
  async list(@Query() query: ListUsersQueryDto) {
    const res = await this.listUsers.execute(query);
    return {
      success: true,
      total: res.total,
      items: UserPresenter.toListDTO(res.items),
    };
  }

  @Get(':id')
  @Roles(RoleName.ADMIN)
  async getById(@Param('id') id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return {
      success: true,
      user: UserPresenter.toDetailDTO(user),
    };
  }

  @HttpCode(200)
  @Patch(':id/roles')
  @Roles(RoleName.ADMIN)
  async setRoles(@Param('id') id: string, @Body() dto: UpdateRolesDto, @Req() req: Request) {
    const auth = (req as any).auth;
    try {
      await this.updateRoles.execute({
        targetUserId: id,
        roles: dto.roles,
        actingUserId: auth.userId,
      });
      return { success: true, message: 'Roles updated' };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND') throw new NotFoundException('User not found');
        if (error.message === 'FORBIDDEN_OPERATION') throw new BadRequestException('Cannot remove your own ADMIN role');
        if (error.message === 'INVALID_ROLE') throw new BadRequestException('Invalid roles');
      }
      throw error;
    }
  }

  @HttpCode(200)
  @Patch(':id/ban')
  @Roles(RoleName.ADMIN)
  async ban(@Param('id') id: string, @Body() body: { reason?: string }) {
    await this.banUser.execute({ targetUserId: id, reason: body?.reason });
    return { success: true, message: 'User banned' };
  }

  @HttpCode(200)
  @Patch(':id/unban')
  @Roles(RoleName.ADMIN)
  async unban(@Param('id') id: string) {
    await this.unbanUser.execute({ targetUserId: id });
    return { success: true, message: 'User unbanned' };
  }

  @HttpCode(204)
  @Delete(':id')
  @Roles(RoleName.ADMIN)
  async deleteById(@Param('id') id: string, @Req() req: Request) {
    const auth = (req as any).auth;
    await this.deleteByAdmin.execute({ targetUserId: id, actingUserId: auth.userId });
    return;
  }
}
