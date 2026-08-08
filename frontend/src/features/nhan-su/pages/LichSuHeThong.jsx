import { useState, useEffect, useCallback } from "react";
import api from "../../../api.js";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function LichSuHeThong() {
    const { nguoiDung } = useAuth();
    const [lichSu, setLichSu] = useState([]);
    const [dangTai, setDangTai] = useState(true);
    const [tuKhoa, setTuKhoa] = useState("");

    // Bộ lọc Ngày / Tháng / Năm
    const [cheDoLoc, setCheDoLoc] = useState("TODAY"); // "TODAY" | "NGAY" | "THANG" | "NAM" | "TU_DEN"
    const todayStr = new Date().toISOString().split("T")[0];
    const [ngayLoc, setNgayLoc] = useState(todayStr);
    const [thangLoc, setThangLoc] = useState(new Date().getMonth() + 1);
    const [namLoc, setNamLoc] = useState(new Date().getFullYear());
    const [tuNgay, setTuNgay] = useState(todayStr);
    const [denNgay, setDenNgay] = useState(todayStr);

    // Filter theo đối tượng
    const [loaiDoiTuongLoc, setLoaiDoiTuongLoc] = useState("ALL");

    const taiLichSu = useCallback(async () => {
        setDangTai(true);
        try {
            let url = `/admin/lich-su?`;
            if (loaiDoiTuongLoc !== "ALL") url += `&loai_doi_tuong=${loaiDoiTuongLoc}`;
            
            if (cheDoLoc === "TODAY") {
                url += `&ngay=${todayStr}`;
            } else if (cheDoLoc === "NGAY" && ngayLoc) {
                url += `&ngay=${ngayLoc}`;
            } else if (cheDoLoc === "THANG" && thangLoc && namLoc) {
                url += `&thang=${thangLoc}&nam=${namLoc}`;
            } else if (cheDoLoc === "NAM" && namLoc) {
                url += `&nam=${namLoc}`;
            } else if (cheDoLoc === "TU_DEN") {
                if (tuNgay) url += `&tu_ngay=${tuNgay}`;
                if (denNgay) url += `&den_ngay=${denNgay}`;
            }

            if (tuKhoa) {
                url += `&q=${encodeURIComponent(tuKhoa)}`;
            }

            const res = await api(url);
            if (res.success) {
                setLichSu(res.data || []);
            }
        } catch (err) {
            console.error("Lỗi khi tải nhật ký hệ thống:", err);
        } finally {
            setDangTai(false);
        }
    }, [loaiDoiTuongLoc, cheDoLoc, ngayLoc, thangLoc, namLoc, tuNgay, denNgay, tuKhoa, todayStr]);

    useEffect(() => {
        taiLichSu();
    }, [taiLichSu]);

    function formatNgay(chuoiNgay) {
        if (!chuoiNgay) return "-";
        const d = new Date(chuoiNgay);
        if (isNaN(d.getTime())) return chuoiNgay;
        return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    }

    const categories = [
        { key: "ALL", label: "📋 Tất cả nhật ký" },
        { key: "KHU_VUC", label: "🏢 Khu vực" },
        { key: "DAY_CHUYEN", label: "⛓️ Dây chuyền" },
        { key: "CONG_DOAN", label: "🔧 Công đoạn & Nhân sự" },
        { key: "CA_LAM", label: "⏰ Lịch làm & Ca làm" },
        { key: "CHUNG_CHI", label: "🎓 Chứng chỉ" },
        { key: "TANG_CA", label: "📝 Quản lý Tăng ca" },
        { key: "PHAN_BO_TANG_CA", label: "⚡ Phân bổ Tăng ca" },
        { key: "NHAN_VIEN", label: "👥 Nhân sự & Tài khoản" }
    ];

    const getLoaiBadgeStyle = (loai) => {
        switch (loai) {
            case "KHU_VUC":
                return { bg: "#eff6ff", color: "#1d4ed8", label: "🏢 KHU VỰC" };
            case "DAY_CHUYEN":
                return { bg: "#f0fdf4", color: "#15803d", label: "⛓️ DÂY CHUYỀN" };
            case "CONG_DOAN":
                return { bg: "#fef3c7", color: "#b45309", label: "🔧 CÔNG ĐOẠN" };
            case "CA_LAM":
                return { bg: "#e0e7ff", color: "#4338ca", label: "⏰ CA LÀM" };
            case "CHUNG_CHI":
                return { bg: "#fae8ff", color: "#86198f", label: "🎓 CHỨNG CHỈ" };
            case "TANG_CA":
                return { bg: "#fff7ed", color: "#c2410c", label: "📝 TĂNG CA" };
            case "PHAN_BO_TANG_CA":
                return { bg: "#ecfdf5", color: "#047857", label: "⚡ PHÂN BỔ OT" };
            default:
                return { bg: "#f1f5f9", color: "#475569", label: "📜 NHẬT KÝ" };
        }
    };

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar" style={{ marginBottom: "20px" }}>
                <div className="tieu-de-khoi">
                    <h2>📜 Nhật ký & Lịch sử thao tác Hệ thống</h2>
                    <p>Theo dõi thời điểm thêm/sửa/xóa khu vực, dây chuyền, công đoạn, chứng chỉ, ca làm và tăng ca (Thống kê Ngày/Tháng/Năm)</p>
                </div>
            </div>

            {/* Thanh bộ lọc Thống kê ngày/tháng/năm */}
            <div className="the-thong-tin" style={{ marginBottom: "20px", padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>📅 Lọc theo:</label>
                        <select
                            value={cheDoLoc}
                            onChange={(e) => setCheDoLoc(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff", fontWeight: "bold" }}
                        >
                            <option value="TODAY">Hôm nay ({new Date().toLocaleDateString("vi-VN")})</option>
                            <option value="NGAY">Theo Ngày cụ thể</option>
                            <option value="THANG">Theo Tháng & Năm</option>
                            <option value="NAM">Theo Năm</option>
                            <option value="TU_DEN">Từ ngày ... đến ngày ...</option>
                        </select>
                    </div>

                    {cheDoLoc === "NGAY" && (
                        <input
                            type="date"
                            value={ngayLoc}
                            onChange={(e) => setNgayLoc(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                        />
                    )}

                    {cheDoLoc === "THANG" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                            <select
                                value={thangLoc}
                                onChange={(e) => setThangLoc(e.target.value)}
                                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                ))}
                            </select>
                            <select
                                value={namLoc}
                                onChange={(e) => setNamLoc(e.target.value)}
                                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            >
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y}>Năm {y}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {cheDoLoc === "NAM" && (
                        <select
                            value={namLoc}
                            onChange={(e) => setNamLoc(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                    )}

                    {cheDoLoc === "TU_DEN" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="date"
                                value={tuNgay}
                                onChange={(e) => setTuNgay(e.target.value)}
                                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                            <span>➔</span>
                            <input
                                type="date"
                                value={denNgay}
                                onChange={(e) => setDenNgay(e.target.value)}
                                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm trong nhật ký..."
                        value={tuKhoa}
                        onChange={(e) => setTuKhoa(e.target.value)}
                        style={{ flex: "1 1 200px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                    />

                    <button
                        onClick={taiLichSu}
                        className="nut-hanh-dong"
                        style={{ padding: "8px 14px", backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }}
                    >
                        🔄 Tải lại
                    </button>
                </div>

                {/* Categories Tabs */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setLoaiDoiTuongLoc(cat.key)}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "16px",
                                border: "1px solid",
                                borderColor: loaiDoiTuongLoc === cat.key ? "#2563eb" : "#e2e8f0",
                                backgroundColor: loaiDoiTuongLoc === cat.key ? "#eff6ff" : "#fff",
                                color: loaiDoiTuongLoc === cat.key ? "#1d4ed8" : "#475569",
                                fontWeight: loaiDoiTuongLoc === cat.key ? "bold" : "normal",
                                cursor: "pointer",
                                fontSize: "12px"
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bảng dữ liệu nhật ký */}
            <div className="the-thong-tin" style={{ padding: 0 }}>
                {dangTai ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Đang tải danh sách nhật ký...
                    </div>
                ) : lichSu.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Không có dữ liệu nhật ký thao tác nào trong khoảng thời gian đã chọn.
                    </div>
                ) : (
                    <div className="bang-du-lieu-wrapper">
                        <table className="bang-du-lieu">
                            <thead>
                                <tr>
                                    <th style={{ width: "170px" }}>Thời gian</th>
                                    <th style={{ width: "140px", textAlign: "center" }}>Phân loại</th>
                                    <th style={{ width: "110px", textAlign: "center" }}>Hành động</th>
                                    <th style={{ width: "180px" }}>Đối tượng / Tên</th>
                                    <th>Nội dung / Chi tiết thao tác</th>
                                    <th style={{ width: "160px" }}>Người thực hiện</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lichSu.map((item, idx) => {
                                    const badgeInfo = getLoaiBadgeStyle(item.loai_doi_tuong);

                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <strong style={{ fontSize: "13px" }}>{formatNgay(item.thoi_gian)}</strong>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <span style={{
                                                    backgroundColor: badgeInfo.bg,
                                                    color: badgeInfo.color,
                                                    padding: "3px 8px",
                                                    borderRadius: "4px",
                                                    fontSize: "11px",
                                                    fontWeight: "bold",
                                                    display: "inline-block"
                                                }}>
                                                    {badgeInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <span style={{
                                                    fontSize: "11px",
                                                    fontWeight: "bold",
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    background: item.hanh_dong === "XOA" || item.hanh_dong === "NGHI_PHEP" ? "#fee2e2" : item.hanh_dong === "THEM" || item.hanh_dong === "DUYET" ? "#dcfce7" : "#f1f5f9",
                                                    color: item.hanh_dong === "XOA" || item.hanh_dong === "NGHI_PHEP" ? "#991b1b" : item.hanh_dong === "THEM" || item.hanh_dong === "DUYET" ? "#15803d" : "#334155"
                                                }}>
                                                    {item.hanh_dong || "THAO_TAC"}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{item.ten_doi_tuong || item.ten_day_chuyen || "-"}</strong>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: "13px", color: "var(--charcoal)", lineHeight: "1.5" }}>
                                                    {item.ly_do || item.chi_tiet || "Ghi nhận thao tác hệ thống"}
                                                </div>
                                            </td>
                                            <td>
                                                <strong>{item.ho_ten || "Hệ thống"}</strong>
                                                {item.role_nguoi_thuc_hien && (
                                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                                        Role: {item.role_nguoi_thuc_hien}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
