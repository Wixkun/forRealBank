import { ListConversationsByUserUseCase } from '@forreal/application';
import { ConversationType } from '@forreal/domain';
import type {
  IConversationParticipantRepository,
  IConversationRepository,
  IUserRepository,
  IMessageRepository,
  IConversationNotificationSettingsRepository,
} from '@forreal/domain';
import { Conversation, ConversationParticipant } from '@forreal/domain';

const ME = 'me';
const OTHER = 'other';

function participantRepo(
  byUser: Record<string, string[]>,
  byConversation: Record<string, string[]>,
): IConversationParticipantRepository {
  return {
    listByUser: jest.fn(async (userId: string) =>
      (byUser[userId] ?? []).map(
        (cid, i) => new ConversationParticipant(`${cid}:${userId}:${i}`, cid, userId, new Date()),
      ),
    ),
    listByConversation: jest.fn(async (cid: string) =>
      (byConversation[cid] ?? []).map(
        (uid, i) => new ConversationParticipant(`${cid}:${uid}:${i}`, cid, uid, new Date()),
      ),
    ),
  } as unknown as IConversationParticipantRepository;
}

function conversationRepo(convs: Record<string, ConversationType>): IConversationRepository {
  return {
    findById: jest.fn(async (id: string) =>
      convs[id] ? new Conversation(id, convs[id], new Date()) : null,
    ),
  } as unknown as IConversationRepository;
}

function userRepo(): IUserRepository {
  return {
    findByIds: jest.fn(async (ids: string[]) =>
      ids.map((id) => ({ id, firstName: id, lastName: 'X', roles: new Set() })),
    ),
  } as unknown as IUserRepository;
}

function messageRepo(
  summaries: Record<string, { unreadCount: number; lastMessageContent: string | null }>,
): IMessageRepository {
  return {
    summarizeForUser: jest.fn(async (_userId: string, ids: string[]) => {
      const out: Record<string, unknown> = {};
      for (const id of ids)
        out[id] = {
          unreadCount: summaries[id]?.unreadCount ?? 0,
          lastMessageContent: summaries[id]?.lastMessageContent ?? null,
          lastMessageAt: null,
        };
      return out;
    }),
  } as unknown as IMessageRepository;
}

function settingsRepo(muted: string[]): IConversationNotificationSettingsRepository {
  return {
    listMutedConversationIds: jest.fn(async () => muted),
  } as unknown as IConversationNotificationSettingsRepository;
}

describe('ListConversationsByUserUseCase (enriched)', () => {
  it('exposes unreadCount / hasUnread / isMuted per conversation', async () => {
    const uc = new ListConversationsByUserUseCase(
      participantRepo({ [ME]: ['c1', 'c2'] }, { c1: [ME, OTHER], c2: [ME, OTHER] }),
      conversationRepo({ c1: ConversationType.PRIVATE, c2: ConversationType.GROUP }),
      userRepo(),
      messageRepo({
        c1: { unreadCount: 3, lastMessageContent: 'hello' },
        c2: { unreadCount: 0, lastMessageContent: null },
      }),
      settingsRepo(['c2']),
    );

    const result = (await uc.execute({ userId: ME })) as Array<{
      id: string;
      unreadCount: number;
      hasUnread: boolean;
      isMuted: boolean;
      lastMessage: string | null;
    }>;

    const c1 = result.find((c) => c.id === 'c1')!;
    const c2 = result.find((c) => c.id === 'c2')!;

    expect(c1.unreadCount).toBe(3);
    expect(c1.hasUnread).toBe(true);
    expect(c1.isMuted).toBe(false);
    expect(c1.lastMessage).toBe('hello');

    // Muté mais toujours marqué non-lu : le badge New reste indépendant du mute.
    expect(c2.unreadCount).toBe(0);
    expect(c2.hasUnread).toBe(false);
    expect(c2.isMuted).toBe(true);
  });

  it('filters by conversation type when requested', async () => {
    const uc = new ListConversationsByUserUseCase(
      participantRepo({ [ME]: ['c1', 'c2'] }, { c1: [ME], c2: [ME] }),
      conversationRepo({ c1: ConversationType.PRIVATE, c2: ConversationType.GROUP }),
      userRepo(),
      messageRepo({}),
      settingsRepo([]),
    );
    const result = (await uc.execute({ userId: ME, type: 'GROUP' })) as Array<{ id: string }>;
    expect(result.map((c) => c.id)).toEqual(['c2']);
  });
});
