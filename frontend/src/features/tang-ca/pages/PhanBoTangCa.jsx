import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../api.js";

export default function PhanBoTangCa() {
    const { nguoiDung } = useAuth();
    const laAdmin = nguoiDung && nguoiDung.role === "ADMIN";
    const laLeader = nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role);
    const userCaLamId = nguoiDung?.ca_lam_id ? String(nguoiDung.ca_lam_id) : "";

    const todayStr = new Date().toISOString().split("T")[0];

    // Bộ lọc chính
    const [ngay, setNgay] = useState(todayStr);
    const [caLamId, setCaLamId] = useState(!laAdmin && userCaLamId ? userCaLamId : "");
    const [dayChuyenId, setDayChuyenId] = useState("");
    const [tuKhoaNv, setTuKhoaNv] = useState("");
    const [tabFilterNv, setTabFilterNv] = useState("TAT_CA"); // "TAT_CA" | "CHUA_GAN" | "GAN_LINE_NAY" | "GAN_LINE_KHAC"

    // Danh sách dữ liệu
    const [danhSachDayChuyen, setDanhSachDayChuyen] = useState([]);
    const [danhSachCaLam, setDanhSachCaLam] = useState([]);
    const [danhSachNhanSuTangCa, setDanhSachNhanSuTangCa] = useState([]);
    const [chiTietDayChuyen, setChiTietDayChuyen] = useState(null);

    // Trạng thái xử lý
    const [dangTai, setDangTai] = useState(false);
    const [dangXuLyAuto, setDangXuLyAuto] = useState(false);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // Load danh mục lookup (Dây chuyền, Ca làm)
    const taiLookups = useCallback(async () => {
        try {
            const [resDc, resCa] = await Promise.all([
                api("/day-chuyen"),
                api("/ca-lam")
            ]);
            if (resDc.success && resDc.data && resDc.data.length > 0) {
                setDanhSachDayChuyen(resDc.data);
                setDayChuyenId((prev) => prev || String(resDc.data[0].id));
            }
            if (resCa.success && resCa.data && resCa.data.length > 0) {
                setDanhSachCaLam(resCa.data);
                if (!laAdmin && userCaLamId) {
                    setCaLamId(userCaLamId);
                } else {
                    const caTangCa = resCa.data.find(c => c.loai_ca === "TANG_CA");
                    setCaLamId((prev) => prev || String(caTangCa ? caTangCa.id : resCa.data[0].id));
                }
            }
        } catch (err) {
            console.error("Lỗi khi tải lookup:", err);
        }
    }, []);

    // Load chi tiết Dây chuyền (các công đoạn sản xuất và định biên nhu cầu)
    const taiChiTietDayChuyen = useCallback(async () => {
        if (!dayChuyenId) return;
        try {
            const res = await api(`/day-chuyen/${dayChuyenId}/chi-tiet`);
            if (res.success) {
                setChiTietDayChuyen(res.data);
            }
        } catch (err) {
            console.error("Lỗi khi tải chi tiết dây chuyền:", err);
        }
    }, [dayChuyenId]);

    // Load danh sách nhân sự đã được ĐÃ DUYỆT TĂNG CA vào ca & ngày được chọn
    const taiDanhSachNhanSuTangCa = useCallback(async () => {
        if (!ngay || !caLamId) return;
        setDangTai(true);
        setLoi("");
        try {
            const url = `/tang-ca/nhan-su-cho-phan-bo?ngay=${ngay}&ca_lam_id=${caLamId}${dayChuyenId ? `&day_chuyen_id=${dayChuyenId}` : ""}`;
            const res = await api(url);
            if (res.success) {
                setDanhSachNhanSuTangCa(res.data || []);
            }
        } catch (err) {
            setLoi(err.message || "Lỗi khi tải danh sách nhân sự tăng ca");
        } finally {
            setDangTai(false);
        }
    }, [ngay, caLamId, dayChuyenId]);

    useEffect(() => {
        taiLookups();
    }, [taiLookups]);

    useEffect(() => {
        taiChiTietDayChuyen();
    }, [taiChiTietDayChuyen]);

    useEffect(() => {
        taiDanhSachNhanSuTangCa();
    }, [taiDanhSachNhanSuTangCa]);

    useEffect(() => {
        if (!laAdmin && userCaLamId) {
            setCaLamId(userCaLamId);
        }
    }, [laAdmin, userCaLamId]);

    useEffect(() => {
        if (thongBao) {
            const timer = setTimeout(() => setThongBao(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [thongBao]);

    // Phân bổ thủ công 1 nhân sự vào công đoạn của dây chuyền
    const xuLyPhanBo = async (nhanVienId, congDoanId) => {
        if (!congDoanId) {
            await xuLyGoPhanBo(nhanVienId);
            return;
        }
        setLoi("");
        try {
            const res = await api("/tang-ca/phan-bo", {
                method: "POST",
                body: JSON.stringify({
                    nhan_vien_id: nhanVienId,
                    day_chuyen_id: dayChuyenId,
                    cong_doan_id: congDoanId,
                    ca_lam_id: caLamId,
                    ngay: ngay
                })
            });
            setThongBao(res.message || "Phân bổ nhân sự tăng ca thành công");
            taiDanhSachNhanSuTangCa();
            taiChiTietDayChuyen();
        } catch (err) {
            setLoi(err.message || "Lỗi khi phân bổ nhân sự");
        }
    };

    // Gỡ phân bổ nhân sự tăng ca
    const xuLyGoPhanBo = async (nhanVienId) => {
        setLoi("");
        try {
            const res = await api("/tang-ca/go-phan-bo", {
                method: "POST",
                body: JSON.stringify({
                    nhan_vien_id: nhanVienId,
                    ca_lam_id: caLamId,
                    ngay: ngay
                })
            });
            setThongBao(res.message || "Đã gỡ phân bổ nhân sự tăng ca");
            taiDanhSachNhanSuTangCa();
            taiChiTietDayChuyen();
        } catch (err) {
            setLoi(err.message || "Lỗi khi gỡ phân bổ");
        }
    };

    // Tự động phân bổ nhân sự tăng ca theo chứng chỉ / tay nghề
    const xuLyTuDongPhanBo = async () => {
        if (!dayChuyenId || !caLamId || !ngay) return;
        setDangXuLyAuto(true);
        setLoi("");
        try {
            const res = await api("/tang-ca/auto-allocate", {
                method: "POST",
                body: JSON.stringify({
                    day_chuyen_id: dayChuyenId,
                    ca_lam_id: caLamId,
                    ngay: ngay
                })
            });
            setThongBao(res.message || "Tự động phân bổ tăng ca thành công!");
            taiDanhSachNhanSuTangCa();
            taiChiTietDayChuyen();
        } catch (err) {
            setLoi(err.message || "Lỗi khi tự động phân bổ");
        } finally {
            setDangXuLyAuto(false);
        }
    };

    // Tính toán số liệu thống kê
    const totalApproved = danhSachNhanSuTangCa.length;
    const assignedCurrentLine = danhSachNhanSuTangCa.filter(
        (x) => x.phan_cong_id && String(x.phan_cong_day_chuyen_id) === String(dayChuyenId)
    );
    const assignedOtherLine = danhSachNhanSuTangCa.filter(
        (x) => x.phan_cong_id && String(x.phan_cong_day_chuyen_id) !== String(dayChuyenId)
    );
    const unassignedStaff = danhSachNhanSuTangCa.filter((x) => !x.phan_cong_id);

    // Lọc danh sách nhân sự cột trái theo từ khóa, ca làm và tab
    const filteredNhanSuList = danhSachNhanSuTangCa.filter((nv) => {
        const matchesKw = !tuKhoaNv.trim() ||
            nv.ho_ten?.toLowerCase().includes(tuKhoaNv.toLowerCase()) ||
            nv.ma_nhan_vien?.toLowerCase().includes(tuKhoaNv.toLowerCase());

        if (!matchesKw) return false;

        if (caLamId && String(nv.nv_ca_lam_id || nv.ca_lam_id) !== String(caLamId)) {
            return false;
        }

        const isCurrentLine = nv.phan_cong_id && String(nv.phan_cong_day_chuyen_id) === String(dayChuyenId);
        const isOtherLine = nv.phan_cong_id && String(nv.phan_cong_day_chuyen_id) !== String(dayChuyenId);

        if (tabFilterNv === "CHUA_GAN") return !nv.phan_cong_id;
        if (tabFilterNv === "GAN_LINE_NAY") return isCurrentLine;
        if (tabFilterNv === "GAN_LINE_KHAC") return isOtherLine;
        return true;
    });

    return (
        <div className="noi-dung-admin">
            {/* Thanh Tiêu đề */}
            <div className="admin-header-bar">
                <div className="tieu-de-khoi">
                    <h2>⚡ Phân bổ Nhân sự khi Tăng ca (OT Allocation)</h2>
                    <p>Đối chiếu tay nghề nhân sự đã được duyệt tăng ca và xếp vào từng công đoạn sản xuất trên dây chuyền</p>
                </div>
                {laLeader && (
                    <div className="nhom-nut-admin">
                        <button
                            className="nut-chinh nut-them-moi"
                            style={{ background: "var(--amber-dark)", color: "#1c2128" }}
                            disabled={dangXuLyAuto || unassignedStaff.length === 0}
                            onClick={xuLyTuDongPhanBo}
                        >
                            {dangXuLyAuto ? "⏳ Đang tính toán..." : "🤖 Tự động phân bổ theo tay nghề"}
                        </button>
                    </div>
                )}
            </div>

            {/* Thống kê chỉ số nhanh */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "14px 18px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>TỔNG ĐÃ DUYỆT OT</span>
                    <h3 style={{ fontSize: "24px", margin: "4px 0 0", color: "var(--charcoal)" }}>{totalApproved}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "14px 18px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>ĐÃ GÁN LINE NÀY</span>
                    <h3 style={{ fontSize: "24px", margin: "4px 0 0", color: "#15803d" }}>{assignedCurrentLine.length}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "14px 18px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>ĐÃ GÁN LINE KHÁC</span>
                    <h3 style={{ fontSize: "24px", margin: "4px 0 0", color: "#b45309" }}>{assignedOtherLine.length}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "14px 18px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>CHƯA PHÂN BỔ</span>
                    <h3 style={{ fontSize: "24px", margin: "4px 0 0", color: "#64748b" }}>{unassignedStaff.length}</h3>
                </div>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">✅ {thongBao}</div>}
            {loi && <div className="thong-bao-loi">⚠️ {loi}</div>}

            {/* Thanh bộ lọc Ngày, Ca tăng ca, Dây chuyền */}
            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    background: "#fff",
                    padding: "16px 20px",
                    borderRadius: "var(--radius)",
                    border: "1px solid #e2e5ea",
                    alignItems: "center"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>📅 Ngày tăng ca:</label>
                    <input
                        type="date"
                        value={ngay}
                        onChange={(e) => setNgay(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>⏰ Ca tăng ca:</label>
                    <select
                        value={caLamId}
                        onChange={(e) => setCaLamId(e.target.value)}
                        disabled={!laAdmin && Boolean(userCaLamId)}
                        style={{
                            padding: "8px 12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "var(--radius)",
                            background: (!laAdmin && userCaLamId) ? "#f1f5f9" : "#fff",
                            cursor: (!laAdmin && userCaLamId) ? "not-allowed" : "pointer"
                        }}
                        title={!laAdmin && userCaLamId ? "Ca làm việc cố định của bạn (Không thể đổi)" : "Chọn ca tăng ca"}
                    >
                        {danhSachCaLam.map((cl) => (
                            <option key={cl.id} value={cl.id}>
                                {cl.ten_ca} ({cl.gio_bat_dau ? cl.gio_bat_dau.substring(0, 5) : ""} - {cl.gio_ket_thuc ? cl.gio_ket_thuc.substring(0, 5) : ""}) {cl.loai_ca === "TANG_CA" ? "⚡[OT]" : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>⛓️ Dây chuyền mục tiêu:</label>
                    <select
                        value={dayChuyenId}
                        onChange={(e) => setDayChuyenId(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                    >
                        {danhSachDayChuyen.map((dc) => (
                            <option key={dc.id} value={dc.id}>
                                {dc.ten_day_chuyen}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bố cục 2 Cột: Bên trái Danh sách nhân sự tăng ca, Bên phải Sơ đồ công đoạn */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>

                {/* CỘT TRÁI: NHÂN SỰ ĐÃ DUYỆT TĂNG CA */}
                <div className="the-thong-tin" style={{ margin: 0, padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", color: "var(--charcoal)" }}>
                            👥 Nhân sự Đã duyệt Tăng ca ({danhSachNhanSuTangCa.length})
                        </h3>
                    </div>

                    {/* Ô tìm kiếm & Tabs lọc nhanh */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                        <input
                            type="text"
                            placeholder="🔍 Tìm theo mã NV hoặc họ tên..."
                            value={tuKhoaNv}
                            onChange={(e) => setTuKhoaNv(e.target.value)}
                            style={{ padding: "8px 12px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                        />

                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "12px" }}>
                            <button
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    border: "1px solid #cbd5e1",
                                    background: tabFilterNv === "TAT_CA" ? "var(--charcoal)" : "#fff",
                                    color: tabFilterNv === "TAT_CA" ? "#fff" : "var(--charcoal)",
                                    cursor: "pointer"
                                }}
                                onClick={() => setTabFilterNv("TAT_CA")}
                            >
                                Tất cả ({totalApproved})
                            </button>
                            <button
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    border: "1px solid #cbd5e1",
                                    background: tabFilterNv === "CHUA_GAN" ? "#64748b" : "#fff",
                                    color: tabFilterNv === "CHUA_GAN" ? "#fff" : "#64748b",
                                    cursor: "pointer"
                                }}
                                onClick={() => setTabFilterNv("CHUA_GAN")}
                            >
                                Chưa gán ({unassignedStaff.length})
                            </button>
                            <button
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    border: "1px solid #86efac",
                                    background: tabFilterNv === "GAN_LINE_NAY" ? "#15803d" : "#fff",
                                    color: tabFilterNv === "GAN_LINE_NAY" ? "#fff" : "#15803d",
                                    cursor: "pointer"
                                }}
                                onClick={() => setTabFilterNv("GAN_LINE_NAY")}
                            >
                                Line này ({assignedCurrentLine.length})
                            </button>
                            <button
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    border: "1px solid #fde68a",
                                    background: tabFilterNv === "GAN_LINE_KHAC" ? "#b45309" : "#fff",
                                    color: tabFilterNv === "GAN_LINE_KHAC" ? "#fff" : "#b45309",
                                    cursor: "pointer"
                                }}
                                onClick={() => setTabFilterNv("GAN_LINE_KHAC")}
                            >
                                Line khác ({assignedOtherLine.length})
                            </button>
                        </div>
                    </div>

                    {dangTai ? (
                        <div className="man-hinh-dang-tai">Đang tải danh sách nhân sự tăng ca...</div>
                    ) : filteredNhanSuList.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)", fontSize: "14px" }}>
                            {danhSachNhanSuTangCa.length === 0
                                ? `Chưa có nhân sự nào được Duyệt tăng ca vào ca này ngày ${ngay}.`
                                : "Không tìm thấy nhân sự phù hợp với điều kiện tìm kiếm."}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "600px", overflowY: "auto" }}>
                            {filteredNhanSuList.map((nv) => {
                                const isCurrentLineAssigned = nv.phan_cong_id && String(nv.phan_cong_day_chuyen_id) === String(dayChuyenId);
                                const isOtherLineAssigned = nv.phan_cong_id && String(nv.phan_cong_day_chuyen_id) !== String(dayChuyenId);

                                return (
                                    <div
                                        key={nv.dang_ky_id}
                                        style={{
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "var(--radius)",
                                            padding: "12px 14px",
                                            background: isCurrentLineAssigned ? "#f8fafc" : isOtherLineAssigned ? "#fffbeb" : "#fff",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div>
                                                <strong style={{ fontSize: "14px", color: "var(--charcoal)" }}>{nv.ho_ten}</strong>
                                                <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginLeft: "6px" }}>
                                                    ({nv.ma_nhan_vien || "NV"})
                                                </span>
                                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                    Chuyền gốc: {nv.ten_day_chuyen_goc || "Chưa gán"}
                                                </div>
                                            </div>

                                            {isCurrentLineAssigned ? (
                                                <span style={{ fontSize: "11px", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                                    📌 {nv.ten_cong_doan}
                                                </span>
                                            ) : isOtherLineAssigned ? (
                                                <span style={{ fontSize: "11px", background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                                    📌 {nv.ten_day_chuyen_phan_cong || "Line khác"} - {nv.ten_cong_doan}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                                    ⏳ Chưa phân bổ
                                                </span>
                                            )}
                                        </div>

                                        {/* Hiển thị danh sách kỹ năng / chứng chỉ */}
                                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                            {nv.ky_nang_list && nv.ky_nang_list.length > 0 ? (
                                                nv.ky_nang_list.map((kn, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            fontSize: "11px",
                                                            background: "#e0f2fe",
                                                            color: "#0369a1",
                                                            padding: "2px 6px",
                                                            borderRadius: "4px",
                                                            fontWeight: "600"
                                                        }}
                                                    >
                                                        🎓 {kn.ten_chung_chi} (Cấp {kn.cap_do})
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                                                    Lao động phổ thông
                                                </span>
                                            )}
                                        </div>

                                        {/* Thao tác phân bổ nhanh */}
                                        {laLeader && chiTietDayChuyen && chiTietDayChuyen.cong_doan_list && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0" }}>
                                                <select
                                                    value={isCurrentLineAssigned ? (nv.cong_doan_id || "") : ""}
                                                    onChange={(e) => xuLyPhanBo(nv.nhan_vien_id, e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: "6px 8px",
                                                        fontSize: "12px",
                                                        border: "1px solid #cbd5e1",
                                                        borderRadius: "var(--radius)",
                                                        background: "#fff"
                                                    }}
                                                >
                                                    <option value="">-- Chọn công đoạn để gán --</option>
                                                    {chiTietDayChuyen.cong_doan_list.map((cd) => (
                                                        <option key={cd.id} value={cd.id}>
                                                            {cd.ten_cong_doan} (Định biên: {cd.so_luong_can} người)
                                                        </option>
                                                    ))}
                                                </select>

                                                {nv.phan_cong_id && (
                                                    <button
                                                        className="nut-hanh-dong nut-xoa"
                                                        style={{ padding: "4px 8px", fontSize: "11px" }}
                                                        onClick={() => xuLyGoPhanBo(nv.nhan_vien_id)}
                                                        title="Gỡ khỏi công đoạn"
                                                    >
                                                        Gỡ
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: SƠ ĐỒ ĐỊNH BIÊN CÔNG ĐOẠN DÂY CHUYỀN */}
                <div className="the-thong-tin" style={{ margin: 0, padding: "20px" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", color: "var(--charcoal)" }}>
                        ⚙️ Các Công đoạn Sản xuất trên Chuyền: {chiTietDayChuyen?.ten_day_chuyen || ""}
                    </h3>

                    {!chiTietDayChuyen || !chiTietDayChuyen.cong_doan_list || chiTietDayChuyen.cong_doan_list.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)", fontSize: "14px" }}>
                            Dây chuyền này chưa thiết lập các công đoạn sản xuất.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {chiTietDayChuyen.cong_doan_list.map((cd) => {
                                const reqCertName = cd.ten_cong_doan.replace(/\s+\d+$/, "").trim();
                                const staffInCd = danhSachNhanSuTangCa.filter(
                                    (x) => x.phan_cong_id &&
                                        String(x.cong_doan_id) === String(cd.id) &&
                                        String(x.phan_cong_day_chuyen_id || dayChuyenId) === String(dayChuyenId)
                                );
                                const fillPercentage = Math.min(100, Math.round((staffInCd.length / (cd.so_luong_can || 1)) * 100));

                                return (
                                    <div
                                        key={cd.id}
                                        style={{
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "var(--radius)",
                                            padding: "14px 16px",
                                            background: "#fff",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                            <div>
                                                <strong style={{ fontSize: "15px", color: "var(--charcoal)" }}>
                                                    🔧 {cd.ten_cong_doan}
                                                </strong>
                                                <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", marginLeft: "8px", fontWeight: "600" }}>
                                                    🎓 Y/C: {reqCertName}
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: "bold",
                                                    padding: "3px 10px",
                                                    borderRadius: "12px",
                                                    background: staffInCd.length >= cd.so_luong_can ? "#dcfce7" : "#fef3c7",
                                                    color: staffInCd.length >= cd.so_luong_can ? "#15803d" : "#d97706"
                                                }}
                                            >
                                                Nhu cầu: {staffInCd.length} / {cd.so_luong_can} người
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div style={{ height: "6px", width: "100%", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${fillPercentage}%`,
                                                    background: fillPercentage >= 100 ? "var(--green)" : "var(--amber)",
                                                    transition: "width 0.3s ease"
                                                }}
                                            />
                                        </div>

                                        {/* Danh sách nhân viên đang trực ở công đoạn này */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {staffInCd.length === 0 ? (
                                                <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                                                    Chưa có nhân sự tăng ca ở công đoạn này
                                                </span>
                                            ) : (
                                                staffInCd.map((st) => {
                                                    const matchedSkill = (st.ky_nang_list || []).find(
                                                        kn => kn.ten_chung_chi.toLowerCase() === reqCertName.toLowerCase()
                                                    );

                                                    return (
                                                        <div
                                                            key={st.phan_cong_id}
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                background: "#f8fafc",
                                                                padding: "6px 10px",
                                                                borderRadius: "4px",
                                                                fontSize: "13px"
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                <span>👤 <strong>{st.ho_ten}</strong> ({st.ma_nhan_vien})</span>
                                                                {matchedSkill ? (
                                                                    <span style={{ fontSize: "11px", background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                                                        🎓 Cấp {matchedSkill.cap_do}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: "11px", background: "#fee2e2", color: "#991b1b", padding: "1px 6px", borderRadius: "4px" }}>
                                                                        ⚠️ Chưa cấp cc
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {laLeader && (
                                                                <button
                                                                    style={{
                                                                        background: "none",
                                                                        border: "none",
                                                                        color: "var(--red)",
                                                                        cursor: "pointer",
                                                                        fontSize: "12px"
                                                                    }}
                                                                    onClick={() => xuLyGoPhanBo(st.nhan_vien_id)}
                                                                >
                                                                    Gỡ
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
