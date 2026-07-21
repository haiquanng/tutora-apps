import { api } from './api.service';
import type { ChatTurn, HistoryItem, SolutionStep } from '../types/solve';

const HOMEWORK = 'homework';

interface SessionDto {
  sessionId: string;
  sessionType: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MessageDto {
  messageId: string;
  sessionId: string;
  role: string;
  content: string;
  imageUrl: string | null;
  metadata: { steps?: SolutionStep[] } | null;
  createdAt: string;
}

type MessagePayload = MessageDto[] | { items?: MessageDto[] };

const toMessages = (payload: MessagePayload | null): MessageDto[] =>
  Array.isArray(payload) ? payload : (payload?.items ?? []);

const toTurns = (messages: MessageDto[]): ChatTurn[] => {
  const turns: ChatTurn[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      turns.push({
        id: m.messageId,
        question: m.content,
        image: m.imageUrl ?? undefined,
        answer: '',
        steps: [],
      });
      continue;
    }
    if (m.role !== 'assistant') continue;
    const last = turns[turns.length - 1];
    if (last && !last.answer) {
      last.answer = m.content;
      last.steps = m.metadata?.steps ?? [];
    }
  }
  return turns;
};

export const createSession = (title?: string): Promise<SessionDto> =>
  api.post<SessionDto>('/ai-chat/sessions', { body: { sessionType: HOMEWORK, title } });

export const getHistory = async (): Promise<HistoryItem[]> => {
  const sessions = await api.get<SessionDto[]>('/ai-chat/sessions', { query: { chatType: HOMEWORK } });
  return (Array.isArray(sessions) ? sessions : []).map((s) => ({
    id: s.sessionId,
    sessionId: s.sessionId,
    question: s.title ?? '(chưa có tiêu đề)',
    mode: 'text',
    turns: [],
    createdAt: new Date(s.createdAt).getTime(),
  }));
};

export const getHistoryItem = async (id: string): Promise<HistoryItem | undefined> => {
  const payload = await api.get<MessagePayload>(`/ai-chat/sessions/${encodeURIComponent(id)}/messages`, {
    query: { page: 1, pageSize: 100 },
  });
  const messages = toMessages(payload);
  if (!messages.length) return undefined;

  const turns = toTurns(messages);
  return {
    id,
    sessionId: id,
    question: turns[0]?.question ?? '',
    thumbnail: turns[0]?.image,
    mode: turns[0]?.image ? 'image' : 'text',
    turns,
    createdAt: new Date(messages[0].createdAt).getTime(),
  };
};

export const removeHistoryItem = (id: string): Promise<void> =>
  api.delete<void>(`/ai-chat/sessions/${encodeURIComponent(id)}`);

export const clearHistory = (): Promise<void> =>
  api.delete<void>('/ai-chat/sessions', { query: { chatType: HOMEWORK } });
