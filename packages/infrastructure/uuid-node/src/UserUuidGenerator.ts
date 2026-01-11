import { randomUUID } from 'crypto';
import { IUserIdGenerator } from '@forreal/domain';

export class UserUuidGenerator implements IUserIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
