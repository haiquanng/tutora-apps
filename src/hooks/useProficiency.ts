import { useEffect, useState } from 'react';
import { fetchProficiency, type ProficiencyProfile } from '../services/assessment.service';
import { useAuth } from './useAuth';

/**
 * Hồ sơ trình độ đang được dùng để cá nhân hoá lời giải.
 *
 * BE tự bơm hồ sơ vào /solve (client không gửi, cũng không giả mạo được). FE gọi lại
 * endpoint này CHỈ để hiển thị — cho học sinh biết mình đang được dạy theo mức nào.
 */
export const useProficiency = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProficiencyProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    fetchProficiency()
      .then((list) => {
        if (cancelled) return;
        // BE chọn hồ sơ cập nhật gần nhất khi giải bài -> hiển thị đúng cái đó.
        const latest = [...list].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0];
        setProfile(latest ?? null);
      })
      .catch(() => {
        /* chưa làm bài đánh giá -> không có gì để hiện, không phải lỗi */
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return profile;
};
