import { api } from './api.service';
import type { SolutionStep } from '../types/solve';

/** Note do học sinh lưu từ canvas (question_notes ở BE). Khác history (lịch sử chat). */
export interface QuestionNote {
  noteId: string;
  sourceSessionId?: string | null;
  title: string;
  problemText?: string | null;
  problemImageUrl?: string | null;
  solutionSteps?: SolutionStep[] | null;
  answerSummary?: string | null;
  personalNote?: string | null;
  stepNotes?: Record<string, string> | null;
  subject?: string | null;
  gradeLevel?: number | null;
  chapter?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title: string;
  sourceSessionId?: string;
  problemText?: string;
  problemImageUrl?: string;
  solutionSteps?: SolutionStep[];
  answerSummary?: string;
  personalNote?: string;
  subject?: string;
  gradeLevel?: number;
  chapter?: string;
}

export const getNotes = (): Promise<QuestionNote[]> => api.get<QuestionNote[]>('/question-notes').then((r) => r ?? []);

export const getNote = (noteId: string): Promise<QuestionNote> =>
  api.get<QuestionNote>(`/question-notes/${encodeURIComponent(noteId)}`);

export const createNote = (payload: CreateNotePayload): Promise<QuestionNote> =>
  api.post<QuestionNote>('/question-notes', { body: payload });

export interface UpdateNotePayload {
  title?: string;
  personalNote?: string;
  stepNotes?: Record<string, string>;
  subject?: string;
  gradeLevel?: number;
  chapter?: string;
}

export const updateNote = (noteId: string, patch: UpdateNotePayload): Promise<QuestionNote> =>
  api.put<QuestionNote>(`/question-notes/${encodeURIComponent(noteId)}`, { body: patch });

export const deleteNote = (noteId: string): Promise<void> =>
  api.delete<void>(`/question-notes/${encodeURIComponent(noteId)}`);
