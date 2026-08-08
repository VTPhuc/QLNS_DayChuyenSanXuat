import React, { useState, useEffect, useCallback } from "react";
import api from "../../api.js";

export default function LichSuVaThongKeEmbedded({ loaiDoiTuong = "ALL", tieuDe = "Lịch sử thao tác", moTa = "Nhật ký lưu vết thay đổi" }) {
    const [lichSu, setLichSu] = useState([]);
    const [dangTai, setDangTai] = useState(false);
    const [tuKhoa, setTuKhoa] = useState("");

    // Date/Month/Year filters
    const [cheDoLoc, setCheDoLoc] = useState("TODAY"); // "TODAY" | "NGAY" | "THANG" | "NAM" | "TU_DEN" | "ALL"
    const todayStr = new Date().toISOString().split("T")[0];
    const [ngayLoc, setNgayLoc] = useState(todayStr);
    const [thangLoc, setThangLoc] = useState(new Date().getMonth() + 1);
    const [namLoc, setNamLoc] = useState(new Date().getFullYear());
    const [tuNgay, setTuNgay] = useState(todayStr);
    const [denNgay, setDenNgay] = useState(todayStr);

    const taiLichSu = useCallback(async () => {
        setDangTai(true);
        try {
            let url = `/admin/lich-su?`;
            if (loaiDoiTuong && loaiDoiTuong !== "ALL") {
                url += `&loai_doi_tuong=${loaiDoiTuong}`;
            }

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

            if (tuKhoa.trim()) {
                url += `&q=${encodeURIComponent(tuKhoa.trim())}`;
            }

            const res = await api(url);
            if (res.success) {
                setLichSu(res.data || []);
            }
        } catch (err) {
            console.error("Lỗi khi tải lịch sử nhúng:", err);
        } finally {
            setDangTai(false);
        }
    }, [loaiDoiTuong, cheDoLoc, ngayLoc, thangLoc, namLoc, tuNgay, denNgay, tuKhoa, todayStr]);

    useEffect(() => {
        taiLichSu();
    }, [taiLichSu]);

    function formatNgay(chuoiNgay) {
        if (!chuoiNgay) return "-";
        const d = new Date(chuoiNgay);
        if (isNaN(d.getTime())) return chuoiNgay;
        return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div className="the-thong-tin" style={{ marginTop: "24px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "var(--charcoal)", fontWeight: "bold" }}>
                        📜 {tieuDe}
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                        {moTa}
                    </p>
                </div>

                {/* Toolbar lọc Ngày/Tháng/Năm */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <select
                        value={cheDoLoc}
                        onChange={(e) => setCheDoLoc(e.target.value)}
                        style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff", fontWeight: "600" }}
                    >
                        <option value="TODAY">Hôm nay ({new Date().toLocaleDateString("vi-VN")})</option>
                        <option value="NGAY">Theo Ngày cụ thể</option>
                        <option value="THANG">Theo Tháng & Năm</option>
                        <option value="NAM">Theo Năm</option>
                        <option value="TU_DEN">Khoảng ngày...</option>
                        <option value="ALL">Tất cả lịch sử</option>
                    </select>

                    {cheDoLoc === "NGAY" && (
                        <input
                            type="date"
                            value={ngayLoc}
                            onChange={(e) => setNgayLoc(e.target.value)}
                            style={{ padding: "5px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                        />
                    )}

                    {cheDoLoc === "THANG" && (
                        <div style={{ display: "flex", gap: "4px" }}>
                            <select
                                value={thangLoc}
                                onChange={(e) => setThangLoc(e.target.value)}
                                style={{ padding: "5px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                ))}
                            </select>
                            <select
                                value={namLoc}
                                onChange={(e) => setNamLoc(e.target.value)}
                                style={{ padding: "5px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
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
                            style={{ padding: "5px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                    )}

                    {cheDoLoc === "TU_DEN" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                                type="date"
                                value={tuNgay}
                                onChange={(e) => setTuNgay(e.target.value)}
                                style={{ padding: "5px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                            <span style={{ fontSize: "12px" }}>-</span>
                            <input
                                type="date"
                                value={denNgay}
                                onChange={(e) => setDenNgay(e.target.value)}
                                style={{ padding: "5px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="🔍 Tìm trong nhật ký..."
                        value={tuKhoa}
                        onChange={(e) => setTuKhoa(e.target.value)}
                        style={{ padding: "5px 8px", fontSize: "12px", width: "150px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                    />

                    <button
                        onClick={taiLichSu}
                        style={{ padding: "5px 10px", fontSize: "12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", cursor: "pointer" }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Bảng dữ liệu Nhật ký nhúng */}
            {dangTai ? (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    Đang tải nhật ký thao tác...
                </div>
            ) : lichSu.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    Chưa có lịch sử ghi nhận cho khoảng thời gian này.
                </div>
            ) : (
                <div className="bang-du-lieu-wrapper" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    <table className="bang-du-lieu" style={{ fontSize: "13px" }}>
                        <thead>
                            <tr>
                                <th style={{ width: "150px" }}>Thời gian</th>
                                <th style={{ width: "110px", textAlign: "center" }}>Hành động</th>
                                <th style={{ width: "160px" }}>Tên đối tượng</th>
                                <th>Chi tiết thao tác / Lý do</th>
                                <th style={{ width: "150px" }}>Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lichSu.map((item, idx) => (
                                <tr key={idx}>
                                    <td><strong>{formatNgay(item.thoi_gian)}</strong></td>
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
                                    <td><strong>{item.ten_doi_tuong || item.ten_day_chuyen || "-"}</strong></td>
                                    <td>{item.ly_do || item.chi_tiet || "-"}</td>
                                    <td>
                                        <strong>{item.ho_ten || "Hệ thống"}</strong>
                                        {item.role_nguoi_thuc_hien && (
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.role_nguoi_thuc_hien}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
