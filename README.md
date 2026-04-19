# 📰 Tin Tức Mới - Trình Tổng Hợp Tin Tức AI Thông Minh

![Banner](https://images.unsplash.com/photo-1504711432869-efd597cdd042?q=80&w=1200&auto=format&fit=crop)

**Tin Tức Mới** là một ứng dụng web hiện đại, giúp bạn cập nhật tin tức từ các nguồn uy tín nhất (VNExpress, Tuổi Trẻ, TechCrunch...) và tối ưu hóa việc đọc tin thông qua sức mạnh của Trí tuệ nhân tạo (AI). Ứng dụng không chỉ tập hợp tin tức mà còn tóm tắt nội dung chính và chuyển đổi thành bản tin âm thanh, giúp bạn nắm bắt thế giới nhanh hơn bao giờ hết.

🚀 **Trải nghiệm ngay tại:** [tin-tuc-moi.vercel.app](https://tin-tuc-moi.vercel.app)

---

## ✨ Tính năng nổi bật

### 🧠 Trí Tuệ Nhân Tạo (AI) Đỉnh Cao
- **Tóm tắt thông minh**: Sử dụng các mô hình AI tiên tiến (OpenAI, Gemini, Claude) để chắt lọc nội dung cốt lõi của bài báo chỉ trong vài giây.
- **Xử lý hàng loạt (Batch Processing)**: Chọn nhiều bài báo cùng lúc và để AI tóm tắt toàn bộ chỉ với 1 cú click.
- **Xoay tua API (Key Rotation)**: Hỗ trợ thêm nhiều API Key và Model để tự động xoay tua, tránh giới hạn tốc độ (Rate Limit).

### 📖 Trải Nghiệm Đọc Độc Đáo
- **AI Magazine Mode**: Chế độ "Tạp chí AI" trình bày tất cả các bản tóm tắt đã chọn trong một giao diện sang trọng, tối giản, tập trung hoàn toàn vào nội dung.
- **Hệ thống Cache vĩnh viễn**: Tự động lưu trữ các bản tóm tắt vào bộ nhớ máy khách (LocalStorage), giúp bạn xem lại tức thì mà không tốn thêm chi phí API.
- **AI Ready Indicator**: Biểu tượng lấp lánh báo hiệu bài báo đã có sẵn bản tóm tắt trong bộ nhớ.

### 🎧 Bản Tin Âm Thanh (TTS)
- **Nghe bản tin tóm tắt**: Chuyển đổi văn bản tóm tắt thành giọng nói tự nhiên, chất lượng cao.
- **Bản tin tổng hợp**: Tự động nối ghép các tin tức đã chọn thành một bản tin radio duy nhất để nghe khi đang làm việc hoặc lái xe.

### 📱 Thiết Kế Hiện Đại & Mobile First
- **Giao diện Glassmorphism**: Thiết kế kính mờ sang trọng với các hiệu ứng chuyển động mượt mà bằng Framer Motion.
- **Tối ưu di động**: Trải nghiệm đọc tràn viền, thumb-friendly trên các thiết bị cảm ứng.

---

## 🛠️ Công nghệ sử dụng

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **API Handling**: Axios
- **AI Integration**: OpenAI SDK / Custom API Proxies
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Hướng dẫn cài đặt

### 1. Clone repository
```bash
git clone https://github.com/theitm/hot-news-daily-app-ai.git
cd hot-news-daily-app-ai
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Chạy ứng dụng locally
```bash
npm run dev
```
Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt của bạn.

---

## ⚙️ Cấu hình API

Bạn có thể cấu hình AI ngay trong ứng dụng thông qua biểu tượng **Settings (Răng cưa)**:
1. Nhập danh sách API Key (mỗi key một dòng).
2. Chọn/Nhập các Model muốn sử dụng (ví dụ: `gpt-4o-mini`, `gemini-1.5-flash`).
3. Ứng dụng sẽ tự động xoay tua giữa các Key và Model này để tối ưu hiệu suất.

---

## 🤝 Đóng góp

Mọi đóng góp nhằm cải thiện ứng dụng đều được trân trọng. Vui lòng tạo **Issue** hoặc gửi **Pull Request**.

---

## 📄 Giấy phép

Dự án này được phát hành dưới giấy phép MIT.

---

*Phát triển với ❤️ bởi [theitms](https://github.com/theitm)*
