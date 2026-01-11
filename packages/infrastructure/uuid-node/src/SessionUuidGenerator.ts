import { randomUUID } from 'crypto';
import { ISessionIdGenerator } from '@forreal/domain';

export class SessionUuidGenerator implements ISessionIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
