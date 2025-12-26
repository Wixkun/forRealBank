import { AdvisorClient } from '@forreal/domain/chat/AdvisorClient';
import { AdvisorClientEntity } from '../entities/AdvisorClientEntity';

export class AdvisorClientMapper {
  static toPersistence(advisorClient: AdvisorClient): AdvisorClientEntity {
    const entity = new AdvisorClientEntity();
    entity.id = advisorClient.id;
    return entity;
  }

  static toDomain(entity: AdvisorClientEntity): AdvisorClient {
    return new AdvisorClient(
      entity.id,
      entity.advisor.id,
      entity.client.id,
      entity.createdAt,
    );
  }
}
