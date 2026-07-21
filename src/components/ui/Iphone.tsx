interface Props {
  /** Ảnh màn hình hiển thị bên trong khung. */
  src?: string;
  alt?: string;
  className?: string;
}

export const Iphone = ({ src, alt = '', className = '' }: Props) => (
  <div
    className={`relative aspect-[9/19.5] w-full rounded-[2.5rem] border-[6px] border-navy bg-navy shadow-[0_30px_60px_-15px_rgb(26_34_56/0.35)] ${className}`}
  >
    {/* Notch */}
    <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-navy" />

    {/* Nút cạnh máy */}
    <span className="absolute -left-[9px] top-24 h-12 w-[3px] rounded-l bg-navy/70" />
    <span className="absolute -left-[9px] top-40 h-16 w-[3px] rounded-l bg-navy/70" />
    <span className="absolute -right-[9px] top-32 h-20 w-[3px] rounded-r bg-navy/70" />

    <div className="size-full overflow-hidden rounded-[2rem] bg-white">
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover object-top" />
      ) : (
        <div className="size-full bg-cream-light" />
      )}
    </div>
  </div>
);
