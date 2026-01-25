import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';

import { IUserRepository } from '@forreal/domain';
import { UserEntity } from '@forreal/infrastructure-typeorm';
import { RoleEntity } from '@forreal/infrastructure-typeorm';
import { UserRepository } from '@forreal/infrastructure-typeorm';

import { RolesGuard } from '../auth/roles.guard';
import { UpdateUserProfileUseCase } from '@forreal/application';
import { DeleteOwnAccountUseCase } from '@forreal/application';
import { ListUsersUseCase } from '@forreal/application';
import { UpdateUserRolesUseCase } from '@forreal/application';
import { DeleteUserByAdminUseCase } from '@forreal/application';
import { BanUserUseCase } from '@forreal/application';
import { UnbanUserUseCase } from '@forreal/application';

const updateProfileProvider: Provider = {
  provide: UpdateUserProfileUseCase,
  useFactory: (users: IUserRepository) => new UpdateUserProfileUseCase(users),
  inject: [IUserRepository],
};

const deleteOwnProvider: Provider = {
  provide: DeleteOwnAccountUseCase,
  useFactory: (users: IUserRepository) => new DeleteOwnAccountUseCase(users),
  inject: [IUserRepository],
};

const listUsersProvider: Provider = {
  provide: ListUsersUseCase,
  useFactory: (users: IUserRepository) => new ListUsersUseCase(users),
  inject: [IUserRepository],
};

const updateRolesProvider: Provider = {
  provide: UpdateUserRolesUseCase,
  useFactory: (users: IUserRepository) => new UpdateUserRolesUseCase(users),
  inject: [IUserRepository],
};

const deleteByAdminProvider: Provider = {
  provide: DeleteUserByAdminUseCase,
  useFactory: (users: IUserRepository) => new DeleteUserByAdminUseCase(users),
  inject: [IUserRepository],
};

const banUserProvider: Provider = {
  provide: BanUserUseCase,
  useFactory: (users: IUserRepository) => new BanUserUseCase(users),
  inject: [IUserRepository],
};

const unbanUserProvider: Provider = {
  provide: UnbanUserUseCase,
  useFactory: (users: IUserRepository) => new UnbanUserUseCase(users),
  inject: [IUserRepository],
};

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([UserEntity, RoleEntity])],
  controllers: [UsersController],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    RolesGuard,
    updateProfileProvider,
    deleteOwnProvider,
    listUsersProvider,
    updateRolesProvider,
    deleteByAdminProvider,
    banUserProvider,
    unbanUserProvider,
  ],
  exports: [{ provide: IUserRepository, useClass: UserRepository }],
})
export class UsersModule {}
