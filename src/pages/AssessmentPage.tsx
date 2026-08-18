import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SurveyFlow, type SurveyAnswers } from '../components/assessment/SurveyFlow';
import { ExamRunner, type SubmitAnswer } from '../components/assessment/ExamRunner';
import { useGradeLevels } from '../hooks/useGradeLevels';
import { startRandomAttempt, submitAttempt, type AttemptInProgress } from '../services/assessment.service';

/**
 * Trang Bài đánh giá — LAYOUT RIÊNG, không sidebar/header chung: vào là tập trung làm bài.
 * 2 pha: khảo sát -> làm bài. Nộp xong điều hướng sang route kết quả riêng
 * (/assessment/:attemptId/result) để reload không quay về pha khảo sát.
 */
export const AssessmentPage = () => {
  const navigate = useNavigate();
  const { toGradeLevelId } = useGradeLevels();

  const [attempt, setAttempt] = useState<AttemptInProgress | null>(null);
  const [isStarting, setStarting] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Đang làm bài mà đóng tab -> nhắc, tránh mất bài do bấm nhầm.
  useEffect(() => {
    if (!attempt) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [attempt]);

  const onSurveyDone = useCallback(
    async (answers: SurveyAnswers) => {
      setStarting(true);
      setStartError(null);
      try {
        // grade là SỐ LỚP (9..12), BE cần gradeLevelId (khoá nội bộ 57..60).
        const data = await startRandomAttempt(answers.subjectId, toGradeLevelId(answers.grade));
        setAttempt(data);
      } catch (e) {
        setStartError(e instanceof Error ? e.message : 'Không bắt đầu được bài đánh giá. Bạn thử lại nhé.');
      } finally {
        setStarting(false);
      }
    },
    [toGradeLevelId],
  );

  const onSubmit = useCallback(
    async (answers: SubmitAnswer[]) => {
      if (!attempt) return;
      setSubmitting(true);
      try {
        await submitAttempt(attempt.attemptId, answers);
        // replace: bấm Back không quay lại phòng thi của bài đã nộp.
        navigate(`/assessment/${attempt.attemptId}/result`, { replace: true });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Nộp bài thất bại. Bạn thử lại nhé.');
      } finally {
        setSubmitting(false);
      }
    },
    [attempt, navigate],
  );

  if (!attempt) {
    return (
      <div className="min-h-screen bg-cream">
        <SurveyFlow onDone={onSurveyDone} onCancel={() => navigate('/')} isStarting={isStarting} error={startError} />
      </div>
    );
  }

  return <ExamRunner attempt={attempt} onSubmit={onSubmit} isSubmitting={isSubmitting} />;
};
