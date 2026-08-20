import { useState } from 'react';
import { Camera, ListOrdered, MessagesSquare } from 'lucide-react';
import { Iphone } from '../components/ui/Iphone';
import { BorderBeam } from '../components/ui/BorderBeam';
import { BlurFade } from '../components/ui/BlurFade';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { DotPattern } from '../components/ui/DotPattern';
import { WEB_URL } from '../services/api.service';

// TODO: đổi sang link store/APK thật khi có. Tạm trỏ về web chính.
const APK_URL = WEB_URL;

const SCREENSHOT = '/images/sample.jpg';
const FEATURES = [
  {
    icon: Camera,
    title: 'Chụp đề là giải',
    desc: 'Chụp ảnh bài tập hoặc gõ đề, Tutora đọc và giải ngay.',
  },
  {
    icon: ListOrdered,
    title: 'Lời giải từng bước',
    desc: 'Trình bày theo bước để hiểu cách làm, không chỉ đưa đáp án.',
  },
  {
    icon: MessagesSquare,
    title: 'Hỏi lại chỗ chưa hiểu',
    desc: 'Chưa rõ bước nào cứ hỏi tiếp — Tutora giải thích lại kỹ hơn.',
  },
];

/**
 * Badge tải app. Ảnh badge đã có sẵn khung + chữ ("GET IT ON Google Play",
 * "Download on the App Store") nên KHÔNG bọc thêm viền/nhãn — chỉ hiện ảnh.
 */
const StoreBadge = ({
  href,
  icon,
  alt,
  note,
  disabled,
}: {
  href?: string;
  icon: string;
  alt: string;
  note: string;
  disabled?: boolean;
}) => {
  // 2 badge SVG cùng tỉ lệ (~3.4:1) -> chỉ cần cùng chiều cao là bằng nhau.
  const content = (
    <>
      <img src={icon} alt={alt} className="h-14 w-auto shrink-0" />
      <span className={`text-xs ${disabled ? 'text-navy/40' : 'text-navy/50'}`}>{note}</span>
    </>
  );

  return disabled ? (
    <span aria-disabled title={note} className="flex cursor-not-allowed items-center gap-3 opacity-45 grayscale">
      {content}
    </span>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 transition hover:-translate-y-0.5 hover:brightness-110"
    >
      {content}
    </a>
  );
};

export const AppPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-2xl) px-4 py-8">
      {/* Banner tải app */}
      <BlurFade>
        <section className="relative grid items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-cream-light to-cream-light/30 p-8 lg:grid-cols-[1.2fr_1fr]">
          <DotPattern className="text-navy/[0.07] [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-navy/70">
              Ứng dụng Mobile Tutora
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-navy sm:text-4xl">
              Hỏi bài mọi lúc, đơn giản
            </h1>
            <p className="mt-3 text-xl text-navy">Chụp bài toán, nhận lời giải từng bước và hỏi lại chỗ chưa hiểu.</p>
            <p className="mt-2 max-w-lg text-md text-navy">
              Hiện Tutora tập trung vào môn Toán (lớp 9–12). Các môn khác đang được chuẩn bị.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-soft">
            <BorderBeam size={70} duration={9} />
            <h2 className="font-serif text-xl text-left font-bold text-navy">Tải ứng dụng</h2>
            <p className="mt-1 max-w-xs text-left text-md text-navy">Bản Android dùng thử. Bản iOS chưa có.</p>

            {/* 2 dòng: mỗi badge một hàng, chiếm hết bề ngang panel. */}
            <div className="mt-5 flex flex-col gap-3">
              <StoreBadge href={APK_URL} icon="/icons/apps/google-play.svg" alt="Tải trên Google Play" note="Bản APK" />
              <StoreBadge icon="/icons/apps/apple-store.svg" alt="Tải trên App Store" note="Chưa phát hành" disabled />
            </div>
          </div>
        </section>
      </BlurFade>

      {/* Tính năng */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <BlurFade delay={0.1}>
          <SpotlightCard className="h-full rounded-3xl border border-navy/5 bg-white p-7">
            <img src="/icons/math.png" alt="" className="size-10" />
            <h2 className="mt-4 font-serif text-xl font-bold text-navy">Chuyên sâu môn Toán</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy/60">
              Ngân hàng câu hỏi theo chương trình lớp 9 đến lớp 12: đại số, hình học, giải tích, xác suất – thống kê.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'].map((s) => (
                <span key={s} className="rounded-full bg-cream-light px-3 py-1.5 text-xs font-medium text-navy/70">
                  {s}
                </span>
              ))}
            </div>
          </SpotlightCard>
        </BlurFade>

        <div className="space-y-4">
          <BlurFade delay={0.15}>
            <SpotlightCard className="rounded-3xl border border-navy/5 bg-white p-7">
              <h2 className="font-serif text-xl font-bold text-navy">Học cách làm, không chép đáp án</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy/60">
                Mỗi lời giải trình bày theo bước kèm lý do, để lần sau gặp dạng tương tự bạn tự làm được.
              </p>
            </SpotlightCard>
          </BlurFade>
          <BlurFade delay={0.2}>
            <SpotlightCard className="rounded-3xl border border-navy/5 bg-white p-7">
              <h2 className="font-serif text-xl font-bold text-navy">Cần học kỹ hơn?</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy/60">
                Tutora còn có gia sư kèm trực tiếp — đăng ký lớp trên trang chủ khi bạn muốn học bài bản.
              </p>
            </SpotlightCard>
          </BlurFade>
        </div>
      </section>

      {/* Demo màn hình */}
      <section className="mt-16">
        <BlurFade>
          <h2 className="text-center font-serif text-2xl font-bold text-navy sm:text-3xl">Dùng thế nào?</h2>
        </BlurFade>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
          <BlurFade delay={0.1}>
            <div className="mx-auto w-full max-w-[260px] animate-float">
              <Iphone src={SCREENSHOT} alt="Màn hình ứng dụng Tutora" />
            </div>
          </BlurFade>

          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => {
              const isActive = i === activeIndex;
              return (
                <li key={title}>
                  <BlurFade delay={0.15 + i * 0.08}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onFocus={() => setActiveIndex(i)}
                      className={`relative flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-2xl p-4 text-left transition ${
                        isActive ? 'bg-navy text-cream' : 'bg-cream-light/70 text-navy hover:bg-cream-light'
                      }`}
                    >
                      {isActive && <BorderBeam size={50} duration={6} colorFrom="#d4b483" colorTo="#faf9f6" />}
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          isActive ? 'bg-gold text-navy' : 'bg-navy/10 text-navy/60'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <Icon className={`mt-0.5 size-5 shrink-0 ${isActive ? 'text-gold' : 'text-navy/50'}`} />
                      <span>
                        <span className="block font-semibold">{title}</span>
                        <span className={`mt-0.5 block text-sm ${isActive ? 'text-cream/75' : 'text-navy/60'}`}>
                          {desc}
                        </span>
                      </span>
                    </button>
                  </BlurFade>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <p className="mt-6 text-center text-xs text-navy/40">Ảnh màn hình mang tính minh hoạ.</p>
    </div>
  );
};
