import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';

import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { UserEntity } from '@forreal/infrastructure-typeorm/entities/UserEntity';
import { RoleEntity } from '@forreal/infrastructure-typeorm/entities/RoleEntity';
import { UserRepository } from '@forreal/infrastructure-typeorm/repositories/UserRepository';

import { RolesGuard } from '../auth/roles.guard';
import { UpdateUserProfileUseCase } from '@forreal/application/user/usecases/UpdateUserProfileUseCase';
import { DeleteOwnAccountUseCase } from '@forreal/application/user/usecases/DeleteOwnAccountUseCase';
import { ListUsersUseCase } from '@forreal/application/user/usecases/ListUsersUseCase';
import { UpdateUserRolesUseCase } from '@forreal/application/user/usecases/UpdateUserRolesUseCase';
import { DeleteUserByAdminUseCase } from '@forreal/application/user/usecases/DeleteUserByAdminUseCase';
import { BanUserUseCase } from '@forreal/application/user/usecases/BanUserUseCase';
import { UnbanUserUseCase } from '@forreal/application/user/usecases/UnbanUserUseCase';

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
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
  ],
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
