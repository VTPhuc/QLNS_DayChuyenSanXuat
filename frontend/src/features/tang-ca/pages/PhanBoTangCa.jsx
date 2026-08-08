import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../api.js";

export default function PhanBoTangCa() {
    const { nguoiDung } = useAuth();
<<<<<<< HEAD
<<<<<<< HEAD
    const laAdmin = nguoiDung && nguoiDung.role === "ADMIN";
=======
    const laAdmin = nguoiDung && (nguoiDung.role === "ADMIN" || nguoiDung.role === "MANAGER");
=======
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e
    const laLeaderOnly = nguoiDung && (nguoiDung.role === "LEADER_LINE" || nguoiDung.role === "LEADER_KHU_VUC");
>>>>>>> upstream/main
    const laLeader = nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role);
    const userCaLamId = nguoiDung?.ca_lam_id ? String(nguoiDung.ca_lam_id) : "";

    const todayStr = new Date().toISOString().split("T")[0];

    // Main navigation tabs
    const [tabChinh, setTabChinh] = useState("PHAN_BO"); // "PHAN_BO" | "LICH_SU"

    // Bộ lọc chính (Tab Phân bổ)
    const [ngay, setNgay] = useState(todayStr);
    const [caLamId, setCaLamId] = useState(!laAdmin && userCaLamId ? userCaLamId : "");
    const [dayChuyenId, setDayChuyenId] = useState("");
    const [tuKhoaNv, setTuKhoaNv] = useState("");
    const [tabFilterNv, setTabFilterNv] = useState("TAT_CA"); // "TAT_CA" | "CA_NAY" | "CHUA_GAN" | "GAN_LINE_NAY" | "GAN_LINE_KHAC"

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

    // State Thống kê Lịch sử Phân bổ
    const [danhSachLichSu, setDanhSachLichSu] = useState([]);
    const [dangTaiLichSu, setDangTaiLichSu] = useState(false);
    const [loiLichSu, setLoiLichSu] = useState("");
    const [tuNgayLichSu, setTuNgayLichSu] = useState("");
    const [denNgayLichSu, setDenNgayLichSu] = useState("");
    const [thangLichSu, setThangLichSu] = useState("");
    const [namLichSu, setNamLichSu] = useState(new Date().getFullYear().toString());
    const [hanhDongLichSu, setHanhDongLichSu] = useState("ALL");
    const [tuKhoaLichSu, setTuKhoaLichSu] = useState("");

    // Load danh mục lookup (Dây chuyền, Ca làm)
    const taiLookups = useCallback(async () => {
        try {
            const [resDc, resCa] = await Promise.all([
                api("/day-chuyen"),
                api("/ca-lam")
            ]);
            if (resDc.success && resDc.data && resDc.data.length > 0) {
                setDanhSachDayChuyen(resDc.data);
                const defaultDc = laLeaderOnly && nguoiDung?.day_chuyen_id ? String(nguoiDung.day_chuyen_id) : String(resDc.data[0].id);
                setDayChuyenId((prev) => prev || defaultDc);
            }
            if (resCa.success && resCa.data && resCa.data.length > 0) {
                setDanhSachCaLam(resCa.data);
<<<<<<< HEAD
                if (!laAdmin && userCaLamId) {
                    setCaLamId(userCaLamId);
                } else {
                    const caTangCa = resCa.data.find(c => c.loai_ca === "TANG_CA");
                    setCaLamId((prev) => prev || String(caTangCa ? caTangCa.id : resCa.data[0].id));
                }
=======
                const caTangCa = resCa.data.find(c => c.loai_ca === "TANG_CA");
                const defaultCa = laLeaderOnly && nguoiDung?.ca_lam_id ? String(nguoiDung.ca_lam_id) : String(caTangCa ? caTangCa.id : resCa.data[0].id);
                setCaLamId((prev) => prev || defaultCa);
>>>>>>> upstream/main
            }
        } catch (err) {
            console.error("Lỗi khi tải lookup:", err);
        }
    }, [laLeaderOnly, nguoiDung]);

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

    // Load Lịch sử Phân bổ Tăng ca
    const taiLichSuPhanBo = useCallback(async () => {
        setDangTaiLichSu(true);
        setLoiLichSu("");
        try {
            let url = `/tang-ca/lich-su?loai_doi_tuong=PHAN_BO_TANG_CA`;
            if (tuNgayLichSu) url += `&tu_ngay=${tuNgayLichSu}`;
            if (denNgayLichSu) url += `&den_ngay=${denNgayLichSu}`;
            if (thangLichSu) url += `&thang=${thangLichSu}`;
            if (namLichSu) url += `&nam=${namLichSu}`;
            if (hanhDongLichSu && hanhDongLichSu !== "ALL") url += `&hanh_dong=${hanhDongLichSu}`;
            if (tuKhoaLichSu) url += `&q=${encodeURIComponent(tuKhoaLichSu)}`;

            const res = await api(url);
            if (res.success) {
                setDanhSachLichSu(res.data || []);
            }
        } catch (err) {
            setLoiLichSu(err.message || "Lỗi khi tải lịch sử phân bổ");
        } finally {
            setDangTaiLichSu(false);
        }
    }, [tuNgayLichSu, denNgayLichSu, thangLichSu, namLichSu, hanhDongLichSu, tuKhoaLichSu]);

    useEffect(() => {
        taiLookups();
    }, [taiLookups]);

    useEffect(() => {
        if (tabChinh === "PHAN_BO") {
            taiChiTietDayChuyen();
            taiDanhSachNhanSuTangCa();
        } else if (tabChinh === "LICH_SU") {
            taiLichSuPhanBo();
        }
    }, [tabChinh, taiChiTietDayChuyen, taiDanhSachNhanSuTangCa, taiLichSuPhanBo]);

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
        if (laLeaderOnly) {
            const targetCa = nguoiDung?.ca_lam_id || caLamId;
            if (targetCa) {
                const matchCaGoc = String(nv.ca_lam_goc_id) === String(targetCa);
                const matchCaDangKy = String(nv.ca_lam_id) === String(targetCa);
                if (!matchCaGoc && !matchCaDangKy) return false;
            }
            if (nguoiDung?.day_chuyen_id) {
                const matchLineGoc = String(nv.day_chuyen_goc_id) === String(nguoiDung.day_chuyen_id);
                const matchLinePhanCong = String(nv.phan_cong_day_chuyen_id) === String(nguoiDung.day_chuyen_id);
                if (!matchLineGoc && !matchLinePhanCong) return false;
            }
        }

        const matchesKw = !tuKhoaNv.trim() ||
            nv.ho_ten?.toLowerCase().includes(tuKhoaNv.toLowerCase()) ||
            nv.ma_nhan_vien?.toLowerCase().includes(tuKhoaNv.toLowerCase());

        if (!matchesKw) return false;

        if (caLamId && String(nv.nv_ca_lam_id || nv.ca_lam_id) !== String(caLamId)) {
            return false;
        }

        const isCurrentLine = nv.phan_cong_id && String(nv.phan_cong_day_chuyen_id) === String(dayChuyenId);
        const isOtherLine = nv.phan_cong_id && String(nv.phan_cong_day_chuyen_id) !== String(dayChuyenId);
        const isSelectedShift = caLamId && (String(nv.ca_lam_id) === String(caLamId) || String(nv.ca_lam_goc_id) === String(caLamId));

        if (tabFilterNv === "CA_NAY") return isSelectedShift;
        if (tabFilterNv === "CHUA_GAN") return !nv.phan_cong_id;
        if (tabFilterNv === "GAN_LINE_NAY") return isCurrentLine;
        if (tabFilterNv === "GAN_LINE_KHAC") return isOtherLine;
        return true;
    });

    const countSameShift = danhSachNhanSuTangCa.filter(nv => String(nv.ca_lam_id) === String(caLamId) || String(nv.ca_lam_goc_id) === String(caLamId)).length;

    const renderHanhDongBadge = (hd) => {
        switch (hd) {
            case "PHAN_BO":
                return <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>📌 PHÂN BỔ</span>;
            case "GO_PHAN_BO":
                return <span style={{ background: "#fef2f2", color: "#b91c1c", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>🔓 GỠ PHÂN BỔ</span>;
            case "TU_DONG_PHAN_BO":
                return <span style={{ background: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>🤖 TỰ ĐỘNG</span>;
            default:
                return <span style={{ background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>{hd}</span>;
        }
    };

    return (
        <div className="noi-dung-admin">
            {/* Thanh Tiêu đề */}
            <div className="admin-header-bar" style={{ marginBottom: "16px" }}>
                <div className="tieu-de-khoi">
                    <h2>⚡ Phân bổ Nhân sự khi Tăng ca (OT Allocation)</h2>
                    <p>Đối chiếu tay nghề, chứng chỉ & bộ phận của nhân sự đã được duyệt tăng ca và xếp vào từng công đoạn sản xuất</p>
                </div>
                {laLeader && (
                    <div className="nhom-nut-admin">
                        <button
                            className="nut-chinh nut-them-moi"
                            style={{ background: "var(--amber-dark)", color: "#1c2128" }}
                            disabled={dangXuLyAuto || unassignedStaff.length === 0}
                            onClick={xuLyTuDongPhanBo}
                        >
                            {dangXuLyAuto ? "⏳ Đang tính toán..." : "🤖 Tự động phân bổ theo tay nghề & Line"}
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
                <button
                    onClick={() => setTabChinh("PHAN_BO")}
                    style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: tabChinh === "PHAN_BO" ? "3px solid #2563eb" : "3px solid transparent",
                        color: tabChinh === "PHAN_BO" ? "#1e40af" : "#64748b"
                    }}
                >
                    ⚡ Sơ đồ Phân bổ Tăng ca
                </button>
                <button
                    onClick={() => setTabChinh("LICH_SU")}
                    style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: tabChinh === "LICH_SU" ? "3px solid #2563eb" : "3px solid transparent",
                        color: tabChinh === "LICH_SU" ? "#1e40af" : "#64748b"
                    }}
                >
                    📜 Thống kê & Lịch sử Phân bổ ({danhSachLichSu.length})
                </button>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">✅ {thongBao}</div>}
            {loi && <div className="thong-bao-loi">⚠️ {loi}</div>}

<<<<<<< HEAD
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
                        disabled={laLeaderOnly && Boolean(nguoiDung?.ca_lam_id)}
                        onChange={(e) => setCaLamId(e.target.value)}
<<<<<<< HEAD
                        disabled={!laAdmin && Boolean(userCaLamId)}
                        style={{
                            padding: "8px 12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "var(--radius)",
                            background: (!laAdmin && userCaLamId) ? "#f1f5f9" : "#fff",
                            cursor: (!laAdmin && userCaLamId) ? "not-allowed" : "pointer"
                        }}
                        title={!laAdmin && userCaLamId ? "Ca làm việc cố định của bạn (Không thể đổi)" : "Chọn ca tăng ca"}
=======
                        style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: laLeaderOnly && nguoiDung?.ca_lam_id ? "#f1f5f9" : "#fff" }}
>>>>>>> upstream/main
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
                        {danhSachDayChuyen
                            .filter(dc => !laLeaderOnly || !nguoiDung?.day_chuyen_id || String(dc.id) === String(nguoiDung.day_chuyen_id))
                            .map((dc) => (
                                <option key={dc.id} value={dc.id}>
                                    {dc.ten_day_chuyen}
                                </option>
                            ))}
                    </select>
                </div>

                {laLeaderOnly && (
                    <div style={{ fontSize: "12px", color: "#b45309", fontWeight: "600", marginLeft: "auto" }}>
                        🔒 Leader chỉ thao tác nhân sự ca/chuyền quản lý
                    </div>
                )}
            </div>

            {/* Bố cục 2 Cột: Bên trái Danh sách nhân sự tăng ca, Bên phải Sơ đồ công đoạn */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>

                {/* CỘT TRÁI: NHÂN SỰ ĐÃ DUYỆT TĂNG CA */}
                <div className="the-thong-tin" style={{ margin: 0, padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", color: "var(--charcoal)" }}>
                            👥 Nhân sự Đã duyệt Tăng ca ({filteredNhanSuList.length}/{danhSachNhanSuTangCa.length})
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
                                Tất cả ({danhSachNhanSuTangCa.length})
                            </button>
                            <button
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    border: "1px solid #0369a1",
                                    background: tabFilterNv === "CA_NAY" ? "#0284c7" : "#fff",
                                    color: tabFilterNv === "CA_NAY" ? "#fff" : "#0284c7",
                                    fontWeight: "bold",
                                    cursor: "pointer"
                                }}
                                onClick={() => setTabFilterNv("CA_NAY")}
                            >
                                Thuộc Ca này ({countSameShift})
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
=======
            {/* TAB 1: SƠ ĐỒ PHÂN BỔ NHÂN SỰ TĂNG CA */}
            {tabChinh === "PHAN_BO" && (
                <>
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
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e
                        </div>
                    </div>

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
                                disabled={laLeaderOnly && Boolean(nguoiDung?.ca_lam_id)}
                                onChange={(e) => setCaLamId(e.target.value)}
                                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: laLeaderOnly && nguoiDung?.ca_lam_id ? "#f1f5f9" : "#fff" }}
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
                                {danhSachDayChuyen
                                    .filter(dc => !laLeaderOnly || !nguoiDung?.day_chuyen_id || String(dc.id) === String(nguoiDung.day_chuyen_id))
                                    .map((dc) => (
                                        <option key={dc.id} value={dc.id}>
                                            {dc.ten_day_chuyen}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {laLeaderOnly && (
                            <div style={{ fontSize: "12px", color: "#b45309", fontWeight: "600", marginLeft: "auto" }}>
                                🔒 Leader chỉ thao tác nhân sự ca/chuyền quản lý
                            </div>
                        )}
                    </div>

                    {/* Bố cục 2 Cột: Bên trái Danh sách nhân sự tăng ca, Bên phải Sơ đồ công đoạn */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>

                        {/* CỘT TRÁI: NHÂN SỰ ĐÃ DUYỆT TĂNG CA */}
                        <div className="the-thong-tin" style={{ margin: 0, padding: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--charcoal)" }}>
                                    👥 Nhân sự Đã duyệt Tăng ca ({filteredNhanSuList.length}/{danhSachNhanSuTangCa.length})
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
                                        Tất cả ({danhSachNhanSuTangCa.length})
                                    </button>
                                    <button
                                        style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            border: "1px solid #0369a1",
                                            background: tabFilterNv === "CA_NAY" ? "#0284c7" : "#fff",
                                            color: tabFilterNv === "CA_NAY" ? "#fff" : "#0284c7",
                                            fontWeight: "bold",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => setTabFilterNv("CA_NAY")}
                                    >
                                        Thuộc Ca này ({countSameShift})
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

                            {/* Danh sách thẻ Nhân sự tăng ca */}
                            <div style={{ maxHeight: "580px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
                                {dangTai ? (
                                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Đang tải danh sách nhân sự tăng ca...</div>
                                ) : filteredNhanSuList.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "13px" }}>
                                        Không tìm thấy nhân sự tăng ca nào theo bộ lọc
                                    </div>
                                ) : (
                                    filteredNhanSuList.map((nv) => {
                                        const isAssignedCurrentLine = nv.phan_cong_id && String(nv.phan_cong_day_chuyen_id) === String(dayChuyenId);
                                        const isAssignedOtherLine = nv.phan_cong_id && String(nv.phan_cong_day_chuyen_id) !== String(dayChuyenId);
                                        const isSameLine = Number(nv.day_chuyen_goc_id) === Number(dayChuyenId);

                                        return (
                                            <div
                                                key={nv.dang_ky_id}
                                                style={{
                                                    padding: "12px 14px",
                                                    border: `1px solid ${isAssignedCurrentLine ? "#86efac" : isAssignedOtherLine ? "#fde68a" : "#cbd5e1"}`,
                                                    borderRadius: "var(--radius)",
                                                    background: isAssignedCurrentLine ? "#f0fdf4" : isAssignedOtherLine ? "#fffbeb" : "#fff",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "6px"
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <div>
                                                        <strong style={{ fontSize: "14px", color: "var(--charcoal)" }}>{nv.ho_ten}</strong>
                                                        <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "6px", fontFamily: "var(--font-mono)" }}>
                                                            ({nv.ma_nhan_vien})
                                                        </span>
                                                    </div>

                                                    {/* Badge trạng thái gán */}
                                                    {isAssignedCurrentLine ? (
                                                        <span style={{ fontSize: "11px", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                                                            ✓ Đã vào: {nv.ten_cong_doan}
                                                        </span>
                                                    ) : isAssignedOtherLine ? (
                                                        <span style={{ fontSize: "11px", background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                                                            🔄 Đã gán ở {nv.ten_day_chuyen_phan_cong}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: "10px" }}>
                                                            ⏳ Chưa gán
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ fontSize: "12px", color: "#475569", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                                    <span>
                                                        Line gốc: <strong style={{ color: isSameLine ? "#15803d" : "#475569" }}>{nv.ten_day_chuyen_goc || "Chưa gán"}</strong>
                                                    </span>
                                                    <span>Ca đăng ký OT: <strong>{nv.ten_ca}</strong></span>
                                                </div>

                                                {/* Danh sách Chứng chỉ / Kỹ năng */}
                                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
                                                    {nv.ky_nang_list && nv.ky_nang_list.length > 0 ? (
                                                        nv.ky_nang_list.map((kn, idx) => (
                                                            <span
                                                                key={idx}
                                                                style={{
                                                                    fontSize: "11px",
                                                                    background: "#e0f2fe",
                                                                    color: "#0369a1",
                                                                    padding: "1px 6px",
                                                                    borderRadius: "4px",
                                                                    fontWeight: "500"
                                                                }}
                                                            >
                                                                🎓 {kn.ten_chung_chi} (Cấp {kn.cap_do})
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Lao động phổ thông</span>
                                                    )}
                                                </div>

                                                {/* Chọn nhanh công đoạn để gán nếu chưa gán hoặc gỡ gán */}
                                                {laLeader && chiTietDayChuyen && chiTietDayChuyen.yeu_cau_nhan_su && (
                                                    <div style={{ marginTop: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
                                                        <select
                                                            value={isAssignedCurrentLine ? nv.cong_doan_id : ""}
                                                            onChange={(e) => xuLyPhanBo(nv.nhan_vien_id, e.target.value)}
                                                            style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", flex: 1 }}
                                                        >
                                                            <option value="">-- Xếp vào Công đoạn của Line này --</option>
                                                            {chiTietDayChuyen.yeu_cau_nhan_su.map((yc) => (
                                                                <option key={yc.cong_doan_id} value={yc.cong_doan_id}>
                                                                    📌 {yc.ten_cong_doan} (Nhu cầu: {yc.so_luong_can} người)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {nv.phan_cong_id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => xuLyGoPhanBo(nv.nhan_vien_id)}
                                                                style={{ fontSize: "11px", color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                                                                title="Gỡ phân công"
                                                            >
                                                                Gỡ gán
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* CỘT PHẢI: SƠ ĐỒ ĐỊNH BIÊN CÔNG ĐOẠN DÂY CHUYỀN */}
                        <div className="the-thong-tin" style={{ margin: 0, padding: "20px" }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "var(--charcoal)" }}>
                                🏭 Công đoạn Sản xuất Line: {chiTietDayChuyen?.ten_day_chuyen || "Đang tải..."}
                            </h3>

                            {!chiTietDayChuyen || !chiTietDayChuyen.yeu_cau_nhan_su || chiTietDayChuyen.yeu_cau_nhan_su.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                    Dây chuyền này chưa được cấu hình định biên công đoạn sản xuất
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {chiTietDayChuyen.yeu_cau_nhan_su.map((cd) => {
                                        // Tìm danh sách nhân viên đã được gán vào công đoạn này trong ca/ngày hiện tại
                                        const assignedInProcess = danhSachNhanSuTangCa.filter(
                                            (x) => x.phan_cong_id &&
                                                   String(x.phan_cong_day_chuyen_id) === String(dayChuyenId) &&
                                                   Number(x.cong_doan_id) === Number(cd.cong_doan_id)
                                        );

                                        const neededCount = cd.so_luong_can;
                                        const currentCount = assignedInProcess.length;
                                        const isFilled = currentCount >= neededCount;

                                        const tenChungChiYeuCau = cd.ten_cong_doan.replace(/\s+\d+$/, "").trim();

                                        return (
                                            <div
                                                key={cd.cong_doan_id}
                                                style={{
                                                    border: `1px solid ${isFilled ? "#86efac" : "#fde68a"}`,
                                                    borderRadius: "var(--radius)",
                                                    background: "#fff",
                                                    padding: "14px",
                                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                    <div>
                                                        <strong style={{ fontSize: "15px", color: "var(--charcoal)" }}>📌 {cd.ten_cong_doan}</strong>
                                                        <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginTop: "2px" }}>
                                                            Yêu cầu CC kỹ năng: <span style={{ color: "#0284c7", fontWeight: "600" }}>{tenChungChiYeuCau}</span>
                                                        </span>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <span
                                                            style={{
                                                                fontSize: "13px",
                                                                fontWeight: "bold",
                                                                color: isFilled ? "#15803d" : "#b45309",
                                                                background: isFilled ? "#dcfce7" : "#fef3c7",
                                                                padding: "4px 10px",
                                                                borderRadius: "12px"
                                                            }}
                                                        >
                                                            {currentCount} / {neededCount} người
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Danh sách nhân viên đang xếp vào công đoạn này */}
                                                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                                    {assignedInProcess.length === 0 ? (
                                                        <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", padding: "6px", background: "#f8fafc", borderRadius: "4px" }}>
                                                            Chưa có nhân sự nào được phân bổ vào công đoạn này
                                                        </div>
                                                    ) : (
                                                        assignedInProcess.map((staff) => {
                                                            const hasMatchingCert = (staff.ky_nang_list || []).some(
                                                                c => c.ten_chung_chi.toLowerCase() === tenChungChiYeuCau.toLowerCase()
                                                            );

                                                            return (
                                                                <div
                                                                    key={staff.nhan_vien_id}
                                                                    style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "center",
                                                                        padding: "6px 10px",
                                                                        background: "#f0fdf4",
                                                                        border: "1px solid #bbf7d0",
                                                                        borderRadius: "6px",
                                                                        fontSize: "12.5px"
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <strong style={{ color: "#166534" }}>{staff.ho_ten}</strong>
                                                                        <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "6px" }}>
                                                                            ({staff.ma_nhan_vien})
                                                                        </span>
                                                                        {hasMatchingCert ? (
                                                                            <span style={{ fontSize: "10px", background: "#e0f2fe", color: "#0369a1", padding: "1px 5px", borderRadius: "4px", marginLeft: "6px" }}>
                                                                                🎓 Đạt chứng chỉ
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ fontSize: "10px", background: "#fef3c7", color: "#b45309", padding: "1px 5px", borderRadius: "4px", marginLeft: "6px" }}>
                                                                                ⚠️ Phân bổ linh hoạt
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {laLeader && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => xuLyGoPhanBo(staff.nhan_vien_id)}
                                                                            style={{ fontSize: "11px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}
                                                                        >
                                                                            ✕ Gỡ
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
                </>
            )}

            {/* TAB 2: THỐNG KÊ LỊCH SỬ PHÂN BỔ TĂNG CA theo Ngày Tháng Năm */}
            {tabChinh === "LICH_SU" && (
                <>
                    {/* Thanh Lọc Nhật Ký Lịch Sử Phân Bổ */}
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            marginBottom: "16px",
                            flexWrap: "wrap",
                            background: "#fff",
                            padding: "14px 16px",
                            borderRadius: "var(--radius)",
                            border: "1px solid #e2e5ea",
                            alignItems: "center"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>📅 Từ ngày:</label>
                            <input
                                type="date"
                                value={tuNgayLichSu}
                                onChange={(e) => setTuNgayLichSu(e.target.value)}
                                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>📅 Đến ngày:</label>
                            <input
                                type="date"
                                value={denNgayLichSu}
                                onChange={(e) => setDenNgayLichSu(e.target.value)}
                                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>Tháng:</label>
                            <select
                                value={thangLichSu}
                                onChange={(e) => setThangLichSu(e.target.value)}
                                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                            >
                                <option value="">-- Cả năm --</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>Năm:</label>
                            <input
                                type="number"
                                value={namLichSu}
                                onChange={(e) => setNamLichSu(e.target.value)}
                                style={{ width: "80px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>

                        <select
                            value={hanhDongLichSu}
                            onChange={(e) => setHanhDongLichSu(e.target.value)}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                        >
                            <option value="ALL">-- Tất cả loại phân bổ --</option>
                            <option value="PHAN_BO">Phân bổ thủ công</option>
                            <option value="GO_PHAN_BO">Gỡ phân bổ</option>
                            <option value="TU_DONG_PHAN_BO">Tự động phân bổ</option>
                        </select>

                        <div style={{ flex: 1, minWidth: "180px" }}>
                            <input
                                type="text"
                                placeholder="🔍 Tìm theo Dây chuyền, Công đoạn hoặc Tên NV..."
                                value={tuKhoaLichSu}
                                onChange={(e) => setTuKhoaLichSu(e.target.value)}
                                style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>
                    </div>

                    {/* Bảng Nhật ký Lịch sử Phân bổ Tăng ca */}
                    <div className="khong-gian-bang">
                        {dangTaiLichSu ? (
                            <div className="trang-thai-rong">Đang tải nhật ký lịch sử phân bổ...</div>
                        ) : loiLichSu ? (
                            <div className="thong-bao-loi">{loiLichSu}</div>
                        ) : (
                            <table className="bang-du-lieu">
                                <thead>
                                    <tr>
                                        <th style={{ width: "50px", textAlign: "center" }}>STT</th>
                                        <th style={{ width: "160px" }}>Thời gian</th>
                                        <th style={{ width: "180px" }}>Người thực hiện / Quản lý</th>
                                        <th style={{ width: "130px" }}>Hành động</th>
                                        <th style={{ width: "220px" }}>Đối tượng phân bổ</th>
                                        <th>Chi tiết (Dây chuyền, Công đoạn, Chứng chỉ, Nhân sự...)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {danhSachLichSu.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="trang-thai-rong">
                                                Chưa có lịch sử phân bổ tăng ca nào phù hợp với bộ lọc ngày tháng năm này
                                            </td>
                                        </tr>
                                    ) : (
                                        danhSachLichSu.map((item, index) => (
                                            <tr key={item.id}>
                                                <td style={{ textAlign: "center" }}>{index + 1}</td>
                                                <td>
                                                    <strong style={{ fontSize: "12px", color: "var(--charcoal)" }}>
                                                        {new Date(item.thoi_gian).toLocaleString("vi-VN")}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <strong>{item.nguoi_thuc_hien || "Hệ thống"}</strong>
                                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
                                                        ({item.role_nguoi_thuc_hien || "ADMIN"})
                                                    </span>
                                                </td>
                                                <td>{renderHanhDongBadge(item.hanh_dong)}</td>
                                                <td>
                                                    <strong style={{ color: "#0369a1", fontSize: "13px" }}>{item.ten_doi_tuong}</strong>
                                                </td>
                                                <td style={{ fontSize: "12.5px", lineHeight: "1.5", color: "#334155" }}>
                                                    {item.chi_tiet}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
