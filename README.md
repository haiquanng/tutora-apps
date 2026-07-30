# Tutora Homework — AI Homework Helper

FE giải bài tập từng bước (Phase 1: môn Toán). Vite + React 19 + Tailwind v4.

## Chạy

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:5180
```

Cần `tutora-ai` chạy ở `http://localhost:8000` (endpoint `POST /api/v1/solve`).
Dev sẽ đi qua proxy Vite không vướng CORS khi stream SSE.

## Scripts

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + build production |
| `npm run lint` | oxlint |
| `npm run format` | Prettier |

Husky + lint-staged chạy `oxlint --fix` + `prettier` khi commit.

## Quy ước code

- **Chỉ dùng Tailwind utility.** Không tạo file `.css` theo trang/component — đây chính
  là thứ làm `Tutora-FE` và `tutora-cms` phình ra khó sửa. Token thương hiệu khai báo
  một lần ở `@theme` trong `src/index.css`.
- **Không dùng antd.** Component tự viết, icon dùng `lucide-react`.
- Tiếng Việt cho text hiển thị và comment giải thích "tại sao".

## Kiến trúc

```
src/
  components/homework/   Composer, StepCard, CameraCapture, Markdown
  components/layout/     Sidebar, UsagePanel
  pages/                 Homework, History, Resources, App
  hooks/useSolveSession  Điều phối 1 phiên giải bài
  services/              solve (SSE), stepParser, quota, history, auth
  data/subjects.ts       Danh mục môn/chương
```

### Luồng giải bài

1. Nộp đề: gõ chữ / tải ảnh / chụp camera (`ProblemComposer`).
2. `streamSolve()` POST `/api/v1/solve` với `response_format: "steps"`, đọc SSE bằng
   `fetch` + ReadableStream (không dùng `EventSource` vì endpoint là POST).
3. Backend tách bước sẵn (`app/services/step_segmenter.py` bên `tutora-ai`) và gửi kèm
   trong SSE — FE không parse markdown nữa.
4. Bấm "Giải thích kỹ hơn" ở 1 bước -> gọi lại `/solve` kèm `history` (AI stateless),
   câu trả lời nối thành bước mới ở cuối canvas.

### Hợp đồng `/solve` (quan trọng)

`response_format` **mặc định là `"markdown"`** và phải giữ nguyên như vậy: Zalo bot,
mobile và `AiChatService.cs` (Tutora-Backend) đang gom `delta` để lưu `ChatHistory` —
nếu đổi mặc định sang JSON thì lịch sử chat của họ sẽ hiện JSON thô cho người dùng.

Web gửi `response_format: "steps"` để nhận thêm:

| Field | Ở event | Ý nghĩa |
| --- | --- | --- |
| `steps` | các event giữa chừng | Bước vừa viết XONG -> nối vào canvas |
| `steps_final` | event `done` | Danh sách đầy đủ -> thay thế toàn bộ |

`delta` (markdown) vẫn stream y hệt chế độ cũ ở cả hai chế độ. Backend chỉ gửi bước khi
nó đã hoàn tất (có bước sau nó) nên tiêu đề không nhấp nháy từng ký tự; bước đang viết dở
hiển thị bằng thẻ "Đang viết bước N…". Test: `tutora-ai/tests/test_step_segmenter.py`.

## Còn phải làm

- **Quota đang là MOCK** (`services/quota.service.ts`, localStorage). Luật: 10 câu/tuần
  khi không có lớp; mỗi lớp active +200 câu/tháng, cộng dồn. Cần BE `GET /api/me/ai-quota`.
- **Lịch sử** lưu localStorage, chưa đồng bộ server.
- **SSO chưa xong — cần Tutora-Backend làm 3 việc** (xem `services/auth.service.ts`):
  1. Set access/refresh token vào **cookie HttpOnly, `Domain=.tutora.vn`, `SameSite=Lax`**
  2. Thêm `GET /api/auth/me` trả user hiện tại từ cookie (và `POST /api/auth/logout`)
  3. CORS: `AllowCredentials` + origin `apps.tutora.vn`

  Lý do: `apps.tutora.vn` **khác origin** với web chính nên **localStorage KHÔNG dùng
  chung được** — không thể đọc ké token của Tutora-FE như bản đầu. Trong lúc chờ, dev
  local (cùng origin) vẫn chạy nhờ fallback đọc `TUTORA_user_data`.

  App này **không có trang login riêng**: bấm Đăng nhập là chuyển sang `VITE_WEB_URL/login?returnUrl=…`.
- Bước hiện có title/explanation/formulas; **illustration chưa có** — cần backend sinh
  hình minh hoạ (SVG/đồ thị) rồi thêm field vào `SolutionStep`.
