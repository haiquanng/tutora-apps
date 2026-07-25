import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ExternalLink, Loader2, TriangleAlert } from 'lucide-react';
import type { AiCreditPackage, AiCreditPurchase } from '../../services/aiCredit.service';
import { getPurchaseStatus } from '../../services/aiCredit.service';

interface Props {
  open: boolean;
  pkg: AiCreditPackage | null;
  purchase: AiCreditPurchase | null;
  onClose: () => void;
  onPaid: (newBalance: number | null) => void;
}

const POLL_INTERVAL_MS = 4000;
const formatVnd = (n: number) => n.toLocaleString('vi-VN') + '₫';

export const QrPaymentModal = ({ open, pkg, purchase, onClose, onPaid }: Props) => {
  const [expired, setExpired] = useState(false);
  const doneRef = useRef(false);

  // Poll trạng thái đơn.
  useEffect(() => {
    if (!open || !purchase) return;
    doneRef.current = false;
    setExpired(false);

    let active = true;
    const interval = window.setInterval(async () => {
      if (!active || doneRef.current) return;
      try {
        const st = await getPurchaseStatus(purchase.orderCode);
        if (!active || doneRef.current) return;
        if (st.isPaid) {
          doneRef.current = true;
          onPaid(st.balance ?? null);
        } else if (st.isExpired) {
          doneRef.current = true;
          setExpired(true);
        }
      } catch {
        /* im lặng — thử lại lần poll sau */
      }
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [open, purchase, onPaid]);

  // Đếm ngược tới hết hạn (dừng poll + hiện UI hết hạn).
  useEffect(() => {
    if (!open || !purchase?.expiresAt) return;
    const expiresAt = new Date(purchase.expiresAt).getTime();
    const check = () => {
      if (Date.now() >= expiresAt && !doneRef.current) {
        doneRef.current = true;
        setExpired(true);
      }
    };
    check();
    const timer = window.setInterval(check, 1000);
    return () => window.clearInterval(timer);
  }, [open, purchase]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <h2 className="font-serif text-lg font-semibold text-navy">Thanh toán gói {pkg?.name}</h2>

        {expired ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-cream-light p-5 text-center">
            <TriangleAlert className="size-8 text-burgundy" />
            <p className="text-sm font-medium text-navy">Đơn thanh toán đã hết hạn.</p>
            <p className="text-xs text-navy/50">Vui lòng đóng và tạo lại đơn mới để thanh toán.</p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-navy/60">
              Quét mã QR bằng app ngân hàng để thanh toán {pkg && formatVnd(pkg.price)}.
            </p>

            {purchase?.checkoutUrl ? (
              <div className="mt-4 flex flex-col items-center gap-3">
                {purchase.qrCode && (
                  <div className="rounded-xl border border-navy/10 bg-white p-3">
                    <QRCodeSVG value={purchase.qrCode} size={188} level="M" />
                  </div>
                )}
                <a
                  href={purchase.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-navy transition hover:brightness-105"
                >
                  <ExternalLink className="size-4" />
                  Mở trang thanh toán PayOS
                </a>
                <p className="text-center text-xs text-navy/40">Mã đơn: {purchase.orderCode}</p>
              </div>
            ) : (
              <div className="mt-4 flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-navy/40" />
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-cream-light p-3 text-sm text-navy/60">
              <Loader2 className="size-4 animate-spin text-navy/40" />
              <span>Đang chờ xác nhận thanh toán…</span>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full cursor-pointer rounded-xl border border-navy/10 px-4 py-2 text-sm font-medium text-navy/60 transition hover:bg-cream-light"
        >
          Đóng
        </button>
      </DialogContent>
    </Dialog>
  );
};
