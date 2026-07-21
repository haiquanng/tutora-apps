import { Apple, Play, Smartphone } from 'lucide-react';

export const AppPage = () => (
  <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-8">
    <h1 className="font-serif text-2xl font-bold">Ứng dụng Tutora</h1>
    <p className="mt-1 text-navy/60">Chụp đề và hỏi bài mọi lúc, ngay trên điện thoại.</p>

    <div className="mt-8 rounded-3xl bg-navy p-8 text-cream">
      <Smartphone className="size-10 text-gold" />
      <h2 className="mt-4 font-serif text-xl font-semibold">Sắp ra mắt</h2>
      <p className="mt-2 max-w-md text-cream/70">
        Ứng dụng di động đang được hoàn thiện. Trong lúc chờ, bạn có thể dùng bản web này trên điện thoại — camera chụp
        đề vẫn hoạt động đầy đủ.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { icon: Apple, label: 'App Store' },
          { icon: Play, label: 'Google Play' },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-cream/20 px-4 py-2.5 text-sm text-cream/50"
          >
            <Icon className="size-4" />
            {label}
          </span>
        ))}
      </div>
    </div>
  </div>
);
