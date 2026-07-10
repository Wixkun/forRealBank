import { EnsureConversationMemberUseCase } from '@forreal/application';
import { ConversationParticipant } from '@forreal/domain';
import type { IConversationParticipantRepository } from '@forreal/domain';

function participant(userId: string, conversationId: string): ConversationParticipant {
  return new ConversationParticipant(
    `${conversationId}:${userId}`,
    conversationId,
    userId,
    new Date(),
  );
}

function repoWith(members: ConversationParticipant[]): IConversationParticipantRepository {
  return {
    listByConversation: jest.fn(async (conversationId: string) =>
      members.filter((m) => m.conversationId === conversationId),
    ),
  } as unknown as IConversationParticipantRepository;
}

describe('EnsureConversationMemberUseCase', () => {
  it('returns true for a participant of the conversation', async () => {
    const uc = new EnsureConversationMemberUseCase(repoWith([participant('user-1', 'conv-1')]));
    await expect(uc.isMember({ conversationId: 'conv-1', userId: 'user-1' })).resolves.toBe(true);
  });

  it('returns false for an outsider (foreign conversation)', async () => {
    const uc = new EnsureConversationMemberUseCase(repoWith([participant('user-1', 'conv-1')]));
    await expect(uc.isMember({ conversationId: 'conv-1', userId: 'intruder' })).resolves.toBe(
      false,
    );
  });

  it('returns false when ids are missing', async () => {
    const uc = new EnsureConversationMemberUseCase(repoWith([]));
    await expect(uc.isMember({ conversationId: '', userId: 'user-1' })).resolves.toBe(false);
  });
});
