import {
  SetConversationHiddenUseCase,
  ListConversationsByUserUseCase,
  SendMessageUseCase,
} from '@forreal/application';
import { ConversationParticipant, Message } from '@forreal/domain';
import type {
  IConversationNotificationSettingsRepository,
  IConversationParticipantRepository,
  IConversationUserStateRepository,
  IMessageRepository,
  INotificationRepository,
} from '@forreal/domain';

const USER = 'user-1';

function stateRepo(hiddenIds: string[] = []) {
  const setHidden = jest.fn(async () => undefined);
  const clearHiddenForConversation = jest.fn(async () => undefined);
  const repo = {
    setHidden,
    clearHiddenForConversation,
    listHiddenConversationIds: jest.fn(async () => hiddenIds),
  } as unknown as IConversationUserStateRepository;
  return { repo, setHidden, clearHiddenForConversation };
}

describe('SetConversationHiddenUseCase', () => {
  it('hides a conversation for one user only (own visibility)', async () => {
    const state = stateRepo();
    const uc = new SetConversationHiddenUseCase(state.repo);

    const res = await uc.execute({ userId: USER, conversationId: 'conv-1', hidden: true });

    expect(res).toEqual({ success: true, hidden: true });
    expect(state.setHidden).toHaveBeenCalledWith(USER, 'conv-1', true);
  });

  it('unhides a conversation (reopening keeps the history intact)', async () => {
    const state = stateRepo();
    const uc = new SetConversationHiddenUseCase(state.repo);

    await uc.execute({ userId: USER, conversationId: 'conv-1', hidden: false });

    expect(state.setHidden).toHaveBeenCalledWith(USER, 'conv-1', false);
  });
});

describe('ListConversationsByUserUseCase — hidden filtering', () => {
  function participantRepo(conversationIds: string[]): IConversationParticipantRepository {
    return {
      listByUser: jest.fn(async () =>
        conversationIds.map(
          (cid, i) => new ConversationParticipant(`p${i}`, cid, USER, new Date()),
        ),
      ),
    } as unknown as IConversationParticipantRepository;
  }

  it('excludes conversations hidden by the user from their list', async () => {
    const uc = new ListConversationsByUserUseCase(
      participantRepo(['conv-a', 'conv-b', 'conv-c']),
      undefined,
      undefined,
      undefined,
      undefined,
      stateRepo(['conv-b']).repo,
    );

    const res = await uc.execute({ userId: USER });

    expect(res).toEqual([{ id: 'conv-a' }, { id: 'conv-c' }]);
  });

  it('keeps every conversation when nothing is hidden', async () => {
    const uc = new ListConversationsByUserUseCase(
      participantRepo(['conv-a', 'conv-b']),
      undefined,
      undefined,
      undefined,
      undefined,
      stateRepo([]).repo,
    );

    const res = await uc.execute({ userId: USER });

    expect(res).toEqual([{ id: 'conv-a' }, { id: 'conv-b' }]);
  });
});

describe('SendMessageUseCase — hidden conversations reappear', () => {
  it('clears the hidden flag for every participant when a message is sent', async () => {
    const state = stateRepo();
    const messageRepo = {
      create: jest.fn(
        async (conversationId: string, senderId: string, content: string) =>
          new Message('msg-1', conversationId, senderId, content, new Date(), null),
      ),
    } as unknown as IMessageRepository;
    const participantRepo = {
      listByConversation: jest.fn(async () => []),
    } as unknown as IConversationParticipantRepository;

    const uc = new SendMessageUseCase(
      messageRepo,
      participantRepo,
      {} as unknown as INotificationRepository,
      {} as unknown as IConversationNotificationSettingsRepository,
      state.repo,
    );

    await uc.execute({ conversationId: 'conv-1', senderId: USER, content: 'hello' });

    expect(state.clearHiddenForConversation).toHaveBeenCalledWith('conv-1');
  });
});
