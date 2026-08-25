import { api } from './api.service';

export interface AiCreditPackage {
  packageId: number;
  code: string;
  name: string;
  creditAmount: number;
  price: number;
  currency: string;
  isPurchasable: boolean;
  isActive: boolean;
  sortOrder: number;
  description?: string | null;
  iconUrl?: string | null;
  /** Số tháng credit hết hạn kể từ ngày mua. */
  expiryMonths?: number;
}

export interface AiCreditBalance {
  balance: number;
  nextExpiryAt?: string | null;
  expiringAmount?: number;
}

export interface AiCreditPurchase {
  orderCode: number;
  checkoutUrl: string;
  qrCode?: string | null;
  paymentLinkId?: string | null;
  amount: number;
  packageId: number;
  expiresAt?: string | null;
}

/** Trạng thái đơn */
export interface AiCreditPurchaseStatus {
  status: string;
  isPaid: boolean;
  isExpired: boolean;
  balance?: number | null;
}

/** Số dư credit của tài khoản đang đăng nhập. */
export const getBalance = () => api.get<AiCreditBalance>('/ai-credit/balance');

/** Danh sách gói đang mở bán. */
export const getPackages = () => api.get<AiCreditPackage[]>('/ai-credit/packages');

export const purchasePackage = (packageId: number) =>
  api.post<AiCreditPurchase>('/ai-credit/purchase', { body: { packageId } });

export const getPurchaseStatus = (orderCode: number) =>
  api.get<AiCreditPurchaseStatus>(`/ai-credit/purchase/status/${orderCode}`);
