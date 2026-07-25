import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { QrPaymentModal } from '../components/upgrade/QrPaymentModal';
import {
  getPackages,
  purchasePackage,
  type AiCreditPackage,
  type AiCreditPurchase,
} from '../services/aiCredit.service';

const formatVnd = (n: number) => (n === 0 ? 'Miễn phí' : n.toLocaleString('vi-VN') + '₫');

const perksOf = (pkg: AiCreditPackage): string[] =>
  (pkg.description ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

export const UpgradePage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [packages, setPackages] = useState<AiCreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const [modalPkg, setModalPkg] = useState<AiCreditPackage | null>(null);
  const [purchase, setPurchase] = useState<AiCreditPurchase | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pkgs = await getPackages();
      setPackages(pkgs.filter((p) => p.isPurchasable));
    } catch {
      toast.error('Không tải được danh sách gói. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleBuy = async (pkg: AiCreditPackage) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục thanh toán.');
      login();
      return;
    }
    setBuyingId(pkg.packageId);
    try {
      const p = await purchasePackage(pkg.packageId);
      setModalPkg(pkg);
      setPurchase(p);
    } catch {
      toast.error('Không tạo được đơn thanh toán. Vui lòng thử lại.');
    } finally {
      setBuyingId(null);
    }
  };

  const handlePaid = () => {
    const credited = modalPkg?.creditAmount;
    setModalPkg(null);
    setPurchase(null);
    toast.success(`Thanh toán thành công! Đã cộng ${credited?.toLocaleString('vi-VN')} lượt vào tài khoản.`);
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-navy/60 transition hover:bg-cream-light hover:text-navy"
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </button>

        <div className="mt-6 text-center">
          <h1 className="font-serif text-4xl font-semibold text-navy">Nâng cấp hạn mức</h1>
          <p className="mt-3 text-navy/50">Mua một lần, số lượt hỏi cộng vào tài khoản.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-6 animate-spin text-navy/40" />
          </div>
        ) : (
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {packages.map((pkg) => {
              const highlight = pkg.code === 'pro';
              const perks = perksOf(pkg);
              return (
                <div
                  key={pkg.packageId}
                  className={`flex flex-col overflow-hidden rounded-xl border bg-white ${
                    highlight ? 'border-gold' : 'border-navy/10'
                  }`}
                >
                  {/* Phần trên: icon + tên + giá + nút */}
                  <div className="flex flex-col p-7">
                    <div className="grid size-20 place-items-center">
                      {pkg.iconUrl ? (
                        <img src={pkg.iconUrl} alt="" className="size-16 object-contain" />
                      ) : (
                        <Sparkles className="size-5" />
                      )}
                    </div>

                    <h2 className="mt-4 font-serif text-2xl font-semibold text-navy">{pkg.name}</h2>

                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-4xl font-semibold text-navy">{formatVnd(pkg.price)}</span>
                      <span className="text-sm text-navy/40">/ một lần</span>
                    </div>
                    <p className="mt-1 text-sm text-navy/50">{pkg.creditAmount.toLocaleString('vi-VN')} lượt hỏi AI</p>

                    <button
                      type="button"
                      disabled={buyingId !== null}
                      onClick={() => handleBuy(pkg)}
                      className={`mt-6 flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        highlight ? 'bg-gold text-navy hover:brightness-105' : 'bg-navy text-cream hover:brightness-110'
                      }`}
                    >
                      {buyingId === pkg.packageId && <Loader2 className="size-4 animate-spin" />}
                      Mua {pkg.name}
                    </button>
                  </div>

                  {/* Đường kẻ + list lợi ích (từ description) */}
                  {perks.length > 0 && (
                    <div className="border-t border-navy/10 p-7">
                      <p className="mb-3.5 text-[15px] font-semibold text-navy">Gói {pkg.name} gồm:</p>
                      <ul className="flex flex-col gap-3">
                        {perks.map((perk) => (
                          <li key={perk} className="flex items-start gap-2.5 text-[15px] text-navy/70">
                            <Check className="mt-0.5 size-4 shrink-0 text-forest" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QrPaymentModal
        open={!!purchase}
        pkg={modalPkg}
        purchase={purchase}
        onClose={() => {
          setPurchase(null);
          setModalPkg(null);
        }}
        onPaid={handlePaid}
      />
    </div>
  );
};
