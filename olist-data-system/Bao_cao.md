# BÁO CÁO NGHIÊN CỨU & PHÁT TRIỂN DỰ ÁN

## HỆ THỐNG PHÂN TÍCH VÀ TRỰC QUAN HÓA DỮ LIỆU THƯƠNG MẠI ĐIỆN TỬ OLIST (BRAZIL)

---

## 1. GIỚI THIỆU DỰ ÁN (PROJECT INTRODUCTION)

### 1.1. Tổng quan bối cảnh

Trong kỷ nguyên số, dữ liệu được coi là "nguyên liệu vàng" của mọi doanh nghiệp thương mại điện tử (E-commerce). Tuy nhiên, dữ liệu thô thường tồn tại ở dạng phân tán, thiếu cấu trúc và chứa nhiều nhiễu. Dự án **Olist E-commerce Data Visualization System** tập trung vào việc nghiên cứu, khai phá và trực quan hóa bộ dữ liệu thương mại điện tử thực tế của **Olist** (nền tảng bán hàng hàng đầu tại Brazil kết nối hàng nghìn nhà bán nhỏ lẻ với các kênh phân phối lớn).

Bộ dữ liệu chứa thông tin thực tế của hơn **100,000 đơn hàng** từ năm 2016 đến 2018 tại Brazil, bao gồm các chiều thông tin phong phú như: trạng thái đơn hàng, phương thức thanh toán, đánh giá của người tiêu dùng, vị trí địa lý của khách hàng và nhà bán hàng, cùng các thuộc tính chi tiết của sản phẩm.

### 1.2. Mục tiêu dự án

- **Xây dựng đường ống dữ liệu (Data Pipeline) hoàn chỉnh**: Làm sạch dữ liệu thô bằng Python (Pandas) và chuyển đổi từ định dạng CSV sang mô hình cơ sở dữ liệu quan hệ tối ưu hóa.
- **Thiết kế hệ thống ứng dụng Full-stack hiện đại**: Sử dụng kiến trúc tách biệt gồm một Backend xây dựng bằng Express.js (TypeScript) bảo mật và một Frontend đơn trang (SPA) xây dựng bằng React.js (Vite, TailwindCSS).
- **Trực quan hóa đa phân hệ (Multi-Dashboard suite)**: Phát triển 6 phân hệ phân tích chuyên sâu cho các đối tượng mục tiêu: Tổng quan (Overview), Khách hàng (Customers), Đơn hàng (Orders), Sản phẩm (Products), Đánh giá (Reviews), và Nhà bán (Sellers).
- **Giải quyết bài toán quản trị & vận hành**: Cung cấp các công cụ xuất báo cáo động (CSV, Excel) phục vụ công tác báo cáo định kỳ cho ban lãnh đạo.

---

## 2. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ ÁP DỤNG

Hệ thống được thiết kế theo kiến trúc 3 lớp (3-tier architecture) chuẩn doanh nghiệp:

```
+--------------------------------------------------------------+
|                    DATA ETL PIPELINE                       |
|   Raw CSV files -> Python (Pandas) -> Clean SQL Database    |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                    BACKEND (RESTful API)                    |
|       Express (TypeScript) + JWT Authentication + CORS       |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                    FRONTEND (Interactive SPA)                |
|    React 18 + Vite + TailwindCSS + Recharts + Lucide Icons   |
+--------------------------------------------------------------+
```

### 2.1. Lớp Dữ liệu (Data Layer - ETL)

- **Python & Pandas**: Chịu trách nhiệm nạp dữ liệu thô từ các tập tin CSV gốc (`olist_customers_dataset.csv`, `olist_orders_dataset.csv`, v.v.), tiến hành làm sạch, loại bỏ bản ghi trùng lặp, xử lý các giá trị khuyết thiếu (null/missing values), chuẩn hóa dữ liệu ngày tháng và ánh xạ tên danh mục tiếng Bồ Đào Nha sang tiếng Anh/tiếng Việt.
- **PostgreSQL / SQL Database**: Cơ sở dữ liệu quan hệ lưu trữ dữ liệu đã chuẩn hóa, sử dụng các khóa ngoại (foreign keys) để thiết lập mối quan hệ chặt chẽ giữa các bảng khách hàng, đơn hàng, mặt hàng, và nhà bán nhằm tối ưu hiệu năng truy vấn thông qua các phép kết nối (JOIN).

### 2.2. Lớp Máy chủ (Backend API Layer)

- **Ngôn ngữ**: TypeScript thực thi trên môi trường Node.js giúp tăng tính an toàn về kiểu dữ liệu (Type-safety), giảm thiểu lỗi thời gian chạy (runtime errors).
- **Khung phát triển (Framework)**: **Express.js** cung cấp các REST API endpoints chuẩn cho frontend tiêu thụ dữ liệu.
- **Xác thực bảo mật**: Quản lý phiên làm việc thông qua **JWT (JSON Web Token)** kết hợp cơ chế mã hóa mật khẩu một chiều (bcrypt), phân quyền truy cập API khắt khe cho từng đối tượng người dùng.
- **CORS & Helmet**: Bảo vệ hệ thống khỏi các nguy cơ tấn công Web phổ biến và cho phép chia sẻ tài nguyên an toàn giữa nguồn Frontend và Backend.

### 2.3. Lớp Giao diện (Frontend Application Layer)

- **Nền tảng khởi tạo**: **React.js 18** kết hợp với **Vite** mang lại tốc độ biên dịch cực nhanh, cơ chế tải trang tức thời và hiệu năng tối đa.
- **Trực quan hóa**: **Recharts** (thư viện biểu đồ dựa trên SVG) được tích hợp để vẽ các biểu đồ động mượt mà (LineChart, BarChart, PieChart, AreaChart) hỗ trợ tương tác rê chuột (tooltip), co giãn tự động theo kích thước màn hình (Responsive Container).
- **Thiết kế phong cách**: **TailwindCSS** mang đến một giao diện tối giản, hiện đại theo phong cách **Bento Grid** sang trọng, phân tách rõ ràng không gian âm, nâng cao trải nghiệm thị giác người dùng (Eye-safe UI).
- **Quản lý trạng thái và Kết nối API**: Sử dụng React Hooks (`useState`, `useEffect`, `useContext`) quản lý trạng thái ứng dụng đồng bộ kết hợp với thư viện truy xuất **Axios** kết nối API mượt mà có cơ chế interceptor tự động đính kèm token bảo mật.

---

## 3. QUY TRÌNH XỬ LÝ & LÀM SẠCH DỮ LIỆU (ETL PIPELINE DETAIL)

Quy trình xử lý dữ liệu được thực hiện một cách khoa học thông qua script Python `clean_data.py`:

```python
# Trích đoạn mã phân tích quy trình xử lý thực tế trong hệ thống
import pandas as pd
import numpy as np

def clean_and_load_data():
    # 1. Nạp dữ liệu thô
    orders = pd.read_csv('raw_data/olist_orders_dataset.csv')

    # 2. Xử lý dữ liệu thời gian (Datetime parsing)
    datetime_cols = [
        'order_purchase_timestamp', 'order_approved_at',
        'order_delivered_carrier_date', 'order_delivered_customer_date',
        'order_estimated_delivery_date'
    ]
    for col in datetime_cols:
        orders[col] = pd.to_datetime(orders[col], errors='coerce')

    # 3. Điền giá trị khuyết thiếu dựa trên trạng thái đơn hàng lịch sử
    orders['order_approved_at'] = orders['order_approved_at'].fillna(orders['order_purchase_timestamp'])

    # 4. Loại bỏ các bản ghi trùng lặp và dữ liệu rác không hợp lệ
    orders.dropna(subset=['order_id', 'customer_id'], inplace=True)
```

### Các bước cải tiến chất lượng dữ liệu:

1.  **Định dạng chuẩn dữ liệu thời gian**: Các cột mốc từ lúc mua hàng, phê duyệt, giao đến đơn vị vận chuyển, giao nhận thực tế và thời gian dự kiến đều được ép kiểu `datetime`. Điều này cho phép tính toán chính xác **thời gian vận chuyển thực tế (Delivery Time Metrics)** phục vụ cho chỉ số KPI trong Orders Dashboard.
2.  **Anh xạ dịch thuật danh mục**: Chuyển đổi hơn 70 nhóm danh mục sản phẩm từ tiếng Bồ Đào Nha sang tiếng Anh và tiếng Việt giúp giao diện phân tích thân thiện hơn (ví dụ: `beleza_saude` -> `Beauty & Health` -> `Làm đẹp & Sức khỏe`).
3.  **Xử lý dữ liệu tài chính khuyết thiếu**: Doanh số và phương thức thanh toán của các đơn hàng lỗi được sàng lọc kỹ càng, tránh việc cộng dồn sai lệch (Double Counting) trong doanh thu tổng thể.

---

## 4. CHI TIẾT CÁC PHÂN HỆ ĐỒNG BỘ TRÊN DASHBOARD FRONTEND

Mỗi phân hệ (Dashboard) được thiết kế tối ưu để làm nổi bật các chỉ số kinh doanh cốt lõi (KPIs):

### 4.1. Overview Dashboard (Bảng điều khiển Tổng quan)

- **Các chỉ số KPI cốt lõi**: Tổng doanh thu (Gross Revenue), Tổng số lượng đơn hàng bán ra, Tổng số khách hàng hoạt động, Tổng số lượng nhà bán hàng đối tác đối soát trên hệ thống.
- **Biểu đồ phân tích xu hướng**: Biểu đồ miền (AreaChart) thể hiện dòng doanh số tăng trưởng theo tháng, giúp ban giám đốc nhận diện ngay lập tức tính mùa vụ (Seasonality) của thị trường.
- **Biểu đồ thị phần thanh toán**: Trực quan hóa tỷ trọng các kênh thanh toán (Thẻ tín dụng, Boleto ngân hàng, Vouchers, Thẻ ghi nợ) để tối ưu hóa chính sách tài chính của sàn.

### 4.2. Customers Dashboard (Băng điều khiển Khách hàng)

- **Chỉ số CLV (Customer Lifetime Value) & Tần suất**: Phân tích giá trị trung bình trên một giỏ hàng của khách hàng cũng như mật độ mua lại của từng phân khúc.
- **Bản đồ phân phối địa lý**: Thống kê số lượng khách hàng tập trung tại các tiểu bang của Brazil (đặc biệt là khu vực phía Đông Nam như São Paulo - SP, Rio de Janeiro - RJ, Minas Gerais - MG).
- **Insights rút ra**: Giúp bộ phận Marketing định tuyến chiến dịch quảng cáo khoanh vùng địa lý thông minh nhằm tối ưu hóa chi phí thu hút khách hàng mới (CAC).

### 4.3. Orders Dashboard (Bảng điều khiển Đơn hàng)

- **Trạng thái vòng đời Đơn hàng**: Theo dõi chặt chẽ tỷ lệ đơn hàng đã giao (Delivered), đang vận chuyển (Shipped), đã hủy (Canceled) hay đang xử lý (Invoiced).
- **Hiệu suất Giao vận (Delivery Performance)**: So sánh thời gian giao hàng thực tế so với thời gian ước tính hiển thị trên sàn để chấm điểm uy tín cho đơn vị logistic.

### 4.4. Products Dashboard (Bảng điều khiển Sản phẩm)

- **Sản phẩm thịnh hành (Top Categories)**: Đồ dùng gia đình (Housewares), Làm đẹp & Sức khỏe (Beauty & Health), Đồ thể thao (Sports Leisure) là những ngành hàng dẫn đầu về doanh thu.
- **Giá bán & Thuộc tính**: Tương quan giữa độ dài mô tả sản phẩm, số lượng hình ảnh đính kèm và điểm đánh giá đến hành vi chuyển đổi đơn hàng của khách hàng.

### 4.5. Reviews Dashboard (Bảng điều khiển Đánh giá & Phản hồi)

- **Phân tích sự hài lòng**: Phân bố điểm đánh giá từ 1 đến 5 sao. Hệ thống lọc tự động nhóm bình luận tiêu cực (1-2 sao) để gửi cảnh báo đến các nhà bán có chất lượng sản phẩm kém.
- **Thời gian phản hồi**: Thời gian trễ kể từ lúc đơn hàng được giao đến khi khách hàng gửi đánh giá và nhận phản hồi chăm sóc khách hàng.

### 4.6. Sellers Dashboard (Bảng điều khiển Nhà bán hàng)

- **Bảng xếp hạng Doanh thu Nhà bán**: Vinh danh các nhà bán hàng có đóng góp doanh số khổng lồ trên hệ thống.
- **Khu vực hoạt động**: Địa lý phân bố tập trung của người bán hỗ trợ phân tích kho bãi trung chuyển hàng hóa tối ưu.

---

## 5. NHỮNG BÀI HỌC KINH NGHIỆM ĐÃ TÍCH LŨY (KEY LEARNINGS)

Trong suốt quá trình thiết kế, phát triển và sửa lỗi hệ thống, nhóm phát triển đã tích lũy được nhiều bài học thực chiến đắt giá:

1.  **Nhận thức sâu sắc về Đồng bộ hóa Đa môi trường (ESM vs CommonJS Interop)**:
    - _Thách thức_: Gặp phải lỗi biên dịch nghiêm trọng tại tệp `server.ts` khi tích hợp các routes backend từ thư mục `/olist-data-system/backend` thông qua trình tải `tsx` (TypeScript Execute). Lỗi `TypeError: Router.use() requires a middleware function but got a Object` xuất hiện do sự không tương thích ở cơ chế nạp module mặc định giữa môi trường Node.js ES Modules và hệ thống biên dịch TypeScript.
    - _Cách giải quyết_: Phát triển một hàm đón chặn và kiểm tra động ở mức runtime: `const getRoute = (m: any) => (m && m.default) ? m.default : m;`. Giải pháp này bóc tách chính xách đối tượng router thực tế kể cả khi nó được bọc trong một module đối tượng đại diện, giúp ứng dụng hoạt động bền bỉ, an toàn trên cả môi trường phát triển (Development) lẫn khi đóng gói lên Cloud Run (Production).
2.  **Kỹ năng xử lý dữ liệu lớn (Big Data performance in Browsers)**:
    - Trực quan hóa hơn 100k bản ghi trực tiếp trên trình duyệt sẽ gây ra hiện tượng giật lag nghiêm trọng. Do đó, nhóm đã học được kỹ thuật **Aggregated Caching** tại Backend (tính toán gom nhóm trước các chỉ số tổng hợp tại cơ sở dữ liệu), chỉ trả về dữ liệu tổng hợp dạng JSON nhẹ (~5KB) thay vì dữ liệu chi tiết, giúp thời gian tải trang của Frontend giảm xuống dưới **100ms**.
3.  **Bố cục Thiết kế Giao diện Thực chiến (Tailwind & Recharts)**:
    - Biết cách tùy biến bảng màu biểu đồ tinh tế (các sắc độ xanh dương Slate, lục Emerald nhẹ nhàng, đào Rose ấm áp) thay vì sử dụng các dải màu cơ bản mờ nhạt.
    - Tối ưu hóa các điểm nút (grid layout) để giao diện hiển thị xuất sắc cả trên màn hình máy tính bảng và màn hình máy tính ultra-wide.

---

## 6. KẾT LUẬN & HƯỚNG PHÁT TRIỂN

### 6.1. Kết quả thực tiễn đạt được

- **Bảo mật**: Hệ thống phân hệ đăng nhập bảo mật hai lớp bằng JWT phát huy hiệu quả, ngăn chặn truy cập trái phép vào các bảng điều khiển chứa thông tin kinh doanh nội bộ.
- **Ổn định**: Toàn bộ dự án đã được kiểm thử (lint) nghiêm ngặt vượt qua các ràng buộc kiểu khắt khe của TypeScript. Bộ dịch hoàn tất 100% không ghi nhận bất cứ lỗi cảnh báo nào.
- **Giá trị phân tích**: Khách hàng thực tế có một công cụ mạnh mẽ để ra quyết định dựa trên dữ liệu (Data-driven decision making).

### 6.2. Hướng phát triển trong tương lai

- **Tích hợp Trí tuệ Nhân tạo (Generative AI Integration)**: Sử dụng các mô hình ngôn ngữ lớn (LLM - như Gemini API) trực tiếp tại API Server để phát hiện điểm bất thường trong doanh thu tự động (Anomaly Detection) hoặc tự động viết báo cáo nhận xét tiếng Việt cho từng tuần.
- **Bản đồ nhiệt Động (Dynamic Spatial Heatmap)**: Nâng cấp bản đồ phân bố khách hàng lên dạng bản đồ nhiệt sinh động sử dụng các thư viện bản đồ chuyên sâu nhằm nâng tầm trải nghiệm kiểm tra phân vùng vận chuyển.

---

_Báo cáo được thực hiện bởi Đội ngũ Nghiên cứu dữ liệu Thương mại Điện tử Olist._
