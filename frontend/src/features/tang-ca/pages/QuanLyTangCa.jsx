import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../api.js";

export default function QuanLyTangCa() {
    const { nguoiDung } = useAuth();
<<<<<<< HEAD
    const laAdmin = nguoiDung && nguoiDung.role === "ADMIN";
=======
    const laAdmin = nguoiDung && (nguoiDung.role === "ADMIN" || nguoiDung.role === "MANAGER");
    const laLeaderOnly = nguoiDung && (nguoiDung.role === "LEADER_LINE" || nguoiDung.role === "LEADER_KHU_VUC");
>>>>>>> upstream/main
    const laLeader = nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role);
    const userCaLamId = nguoiDung?.ca_lam_id ? String(nguoiDung.ca_lam_id) : "";

    const todayStr = new Date().toISOString().split("T")[0];

    // Filters
    const [ngayLoc, setNgayLoc] = useState(todayStr);
    const [dayChuyenLoc, setDayChuyenLoc] = useState("");
    const [caLamLoc, setCaLamLoc] = useState(!laAdmin && userCaLamId ? userCaLamId : "");
    const [trangThaiLoc, setTrangThaiLoc] = useState("");
    const [tuKhoa, setTuKhoa] = useState("");
    const [tuKhoaModal, setTuKhoaModal] = useState("");

    // Data lists
    const [danhSachTangCa, setDanhSachTangCa] = useState([]);
    const [danhSachDayChuyen, setDanhSachDayChuyen] = useState([]);
    const [danhSachCaLam, setDanhSachCaLam] = useState([]);
    const [danhSachNhanVien, setDanhSachNhanVien] = useState([]);

    const [dangTai, setDangTai] = useState(false);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // Checkbox selections for batch approval
    const [selectedIds, setSelectedIds] = useState([]);

    // Modal Dang ky Tang ca
    const [hienModalDangKy, setHienModalDangKy] = useState(false);
    const [formDangKy, setFormDangKy] = useState({
        cheDo: "CAN_HANH", // "CAN_HANH" | "CHUYEN"
        day_chuyen_id: "",
        nhan_vien_ids: [],
        ca_lam_id: "",
        ngay: todayStr,
        trang_thai: laLeader ? "DA_DUYET" : "CHO_DUYET"
    });

    // Load static lookups (dây chuyền, ca làm, nhân viên)
    const taiLookupData = useCallback(async () => {
        try {
            const [resDc, resCa, resNv] = await Promise.all([
                api("/day-chuyen"),
                api("/ca-lam"),
                api("/nhan-vien")
            ]);
            if (resDc.success) setDanhSachDayChuyen(resDc.data || []);
            if (resCa.success) {
                const caList = resCa.data || [];
                setDanhSachCaLam(caList);
                if (laLeaderOnly) {
                    if (nguoiDung?.ca_lam_id) {
                        setCaLamLoc(String(nguoiDung.ca_lam_id));
                    } else if (caList.length > 0) {
                        setCaLamLoc(String(caList[0].id));
                    }
                }
            }
            if (resNv.success) setDanhSachNhanVien(resNv.data || []);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu Lookup:", err);
        }
    }, [laLeaderOnly, nguoiDung]);

    // Load danh sách đăng ký tăng ca
    const taiDanhSachTangCa = useCallback(async () => {
        setDangTai(true);
        setLoi("");
        try {
            let url = `/tang-ca/dang-ky?`;
            if (ngayLoc) url += `&ngay=${ngayLoc}`;
            if (dayChuyenLoc) url += `&day_chuyen_id=${dayChuyenLoc}`;
            if (caLamLoc) url += `&ca_lam_id=${caLamLoc}`;
            if (trangThaiLoc) url += `&trang_thai=${trangThaiLoc}`;
            if (tuKhoa) url += `&q=${encodeURIComponent(tuKhoa)}`;

            const res = await api(url);
            if (res.success) {
                let data = res.data || [];
                // Nếu là Leader (LEADER_KHU_VUC hoặc LEADER_LINE): lọc danh sách thuộc ca/dây chuyền của mình
                if (laLeaderOnly) {
                    data = data.filter((item) => {
                        const targetCa = caLamLoc || nguoiDung?.ca_lam_id;
                        const matchCa = !targetCa || String(item.ca_lam_id) === String(targetCa) || String(item.ca_lam_goc_id) === String(targetCa);
                        const matchLeaderLine = !nguoiDung?.day_chuyen_id || String(item.day_chuyen_id) === String(nguoiDung.day_chuyen_id);
                        return matchCa && matchLeaderLine;
                    });
                }
                setDanhSachTangCa(data);
                setSelectedIds([]);
            }
        } catch (err) {
            setLoi(err.message || "Lỗi khi tải danh sách tăng ca");
        } finally {
            setDangTai(false);
        }
    }, [ngayLoc, dayChuyenLoc, caLamLoc, trangThaiLoc, tuKhoa, laLeaderOnly, nguoiDung]);

    useEffect(() => {
        taiLookupData();
    }, [taiLookupData]);

    useEffect(() => {
        taiDanhSachTangCa();
    }, [taiDanhSachTangCa]);

    useEffect(() => {
        if (!laAdmin && userCaLamId) {
            setCaLamLoc(userCaLamId);
        }
    }, [laAdmin, userCaLamId]);

    useEffect(() => {
        if (thongBao) {
            const timer = setTimeout(() => setThongBao(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [thongBao]);

    // Handlers chọn tất cả checkboxes
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(danhSachTangCa.map((item) => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((x) => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Duyệt / Từ chối đơn đăng ký
    const xuLyDuyet = async (ids, trangThaiMoi) => {
        setLoi("");
        try {
            const res = await api("/tang-ca/duyet", {
                method: "POST",
                body: JSON.stringify({ ids, trang_thai: trangThaiMoi })
            });
            setThongBao(res.message || "Đã cập nhật trạng thái tăng ca");
            taiDanhSachTangCa();
        } catch (err) {
            setLoi(err.message || "Lỗi khi duyệt tăng ca");
        }
    };

    const xuLyXoa = async (id, tenNv) => {
        if (!window.confirm(`Hủy đăng ký tăng ca của nhân viên "${tenNv}"?`)) return;
        setLoi("");
        try {
            const res = await api(`/tang-ca/dang-ky/${id}`, { method: "DELETE" });
            setThongBao(res.message || "Đã xóa đăng ký tăng ca");
            taiDanhSachTangCa();
        } catch (err) {
            setLoi(err.message || "Lỗi khi xóa đăng ký tăng ca");
        }
    };

    // Open Modal Đăng ký tăng ca
    const hienModalDangKyForm = () => {
<<<<<<< HEAD
        const caLamDefault = (!laAdmin && userCaLamId)
            ? userCaLamId
            : (caLamLoc || (danhSachCaLam.length > 0 ? String(danhSachCaLam[0].id) : ""));
=======
        setTuKhoaModal("");
        const defaultCaLamId = laLeaderOnly && nguoiDung?.ca_lam_id ? nguoiDung.ca_lam_id : (danhSachCaLam.length > 0 ? danhSachCaLam[0].id : "");
        const defaultDayChuyenId = laLeaderOnly && nguoiDung?.day_chuyen_id ? nguoiDung.day_chuyen_id : (danhSachDayChuyen.length > 0 ? danhSachDayChuyen[0].id : "");

>>>>>>> upstream/main
        setFormDangKy({
            cheDo: "CAN_HANH",
            day_chuyen_id: defaultDayChuyenId,
            nhan_vien_ids: [],
<<<<<<< HEAD
            ca_lam_id: caLamDefault,
=======
            ca_lam_id: defaultCaLamId,
>>>>>>> upstream/main
            ngay: ngayLoc || todayStr,
            trang_thai: "DA_DUYET"
        });
        setHienModalDangKy(true);
    };

    const xuLyNhanVienSelection = (id) => {
        const numId = Number(id);
        if (formDangKy.nhan_vien_ids.includes(numId)) {
            setFormDangKy({
                ...formDangKy,
                nhan_vien_ids: formDangKy.nhan_vien_ids.filter((x) => x !== numId)
            });
        } else {
            setFormDangKy({
                ...formDangKy,
                nhan_vien_ids: [...formDangKy.nhan_vien_ids, numId]
            });
        }
    };

    const xuLyChonTatCaSubLine = (dcId) => {
        const nvThuocLine = danhSachNhanVien
            .filter((nv) => String(nv.day_chuyen_id) === String(dcId))
            .map((nv) => nv.id);
        setFormDangKy({
            ...formDangKy,
            nhan_vien_ids: Array.from(new Set([...formDangKy.nhan_vien_ids, ...nvThuocLine]))
        });
    };

    const xuLyLuuDangKy = async (e) => {
        e.preventDefault();
        setLoi("");
        try {
            let targetNvIds = formDangKy.nhan_vien_ids;
            if (formDangKy.cheDo === "CHUYEN" && formDangKy.day_chuyen_id) {
                targetNvIds = danhSachNhanVien
                    .filter((nv) => String(nv.day_chuyen_id) === String(formDangKy.day_chuyen_id))
                    .map((nv) => nv.id);
            }

            if (targetNvIds.length === 0) {
                setLoi("Vui lòng chọn ít nhất 1 nhân viên để đăng ký tăng ca");
                return;
            }

            const res = await api("/tang-ca/dang-ky", {
                method: "POST",
                body: JSON.stringify({
                    nhan_vien_ids: targetNvIds,
                    ca_lam_id: formDangKy.ca_lam_id,
                    ngay: formDangKy.ngay,
                    trang_thai: formDangKy.trang_thai
                })
            });

            setThongBao(res.message || "Đăng ký tăng ca thành công");
            setHienModalDangKy(false);
            taiDanhSachTangCa();
        } catch (err) {
            setLoi(err.message || "Lỗi khi đăng ký tăng ca");
        }
    };

    // Badges & Render Helpers
    const renderTrangThai = (tt) => {
        switch (tt) {
            case "DA_DUYET":
                return <span className="trang-thai-badge active">✅ ĐÃ DUYỆT</span>;
            case "TU_CHOI":
                return <span className="trang-thai-badge locked">❌ TỪ CHỐI</span>;
            case "CHO_DUYET":
            default:
                return (
                    <span className="trang-thai-badge" style={{ background: "#fef3c7", color: "#d97706" }}>
                        ⏳ CHỜ DUYỆT
                    </span>
                );
        }
    };

    // Stats
    const choDuyetCount = danhSachTangCa.filter((x) => x.trang_thai === "CHO_DUYET").length;
    const daDuyetCount = danhSachTangCa.filter((x) => x.trang_thai === "DA_DUYET").length;
    const tuChoiCount = danhSachTangCa.filter((x) => x.trang_thai === "TU_CHOI").length;

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar">
                <div className="tieu-de-khoi">
                    <h2>📝 Quản lý Đăng ký Tăng ca (OT)</h2>
                    <p>Tiếp nhận đăng ký tăng ca, kiểm tra tay nghề và phê duyệt lượt tăng ca cho nhân sự dây chuyền</p>
                </div>
                {laLeader && (
                    <div className="nhom-nut-admin">
                        <button className="nut-chinh nut-them-moi" onClick={hienModalDangKyForm}>
                            ➕ Đăng ký Tăng ca
                        </button>
                    </div>
                )}
            </div>

            {/* Thống kê nhanh */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px"
                }}
            >
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Chờ duyệt
                    </span>
                    <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "#d97706" }}>{choDuyetCount}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Đã phê duyệt
                    </span>
                    <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--green)" }}>{daDuyetCount}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Từ chối
                    </span>
                    <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--red)" }}>{tuChoiCount}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Tổng số yêu cầu
                    </span>
                    <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--charcoal)" }}>{danhSachTangCa.length}</h3>
                </div>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">✅ {thongBao}</div>}
            {loi && <div className="thong-bao-loi">⚠️ {loi}</div>}

            {/* Thanh lọc dữ liệu */}
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
                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>📅 Ngày:</label>
                    <input
                        type="date"
                        value={ngayLoc}
                        onChange={(e) => setNgayLoc(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                    />
                </div>

                <select
                    value={dayChuyenLoc}
                    onChange={(e) => setDayChuyenLoc(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                >
                    {!laLeaderOnly && <option value="">-- Tất cả dây chuyền --</option>}
                    {danhSachDayChuyen
                        .filter(dc => !laLeaderOnly || !nguoiDung?.day_chuyen_id || String(dc.id) === String(nguoiDung.day_chuyen_id))
                        .map((dc) => (
                            <option key={dc.id} value={dc.id}>
                                {dc.ten_day_chuyen}
                            </option>
                        ))}
                </select>

                <select
                    value={caLamLoc}
                    disabled={laLeaderOnly && Boolean(nguoiDung?.ca_lam_id)}
                    onChange={(e) => setCaLamLoc(e.target.value)}
<<<<<<< HEAD
                    disabled={!laAdmin && Boolean(userCaLamId)}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "var(--radius)",
                        background: (!laAdmin && userCaLamId) ? "#f1f5f9" : "#fff",
                        cursor: (!laAdmin && userCaLamId) ? "not-allowed" : "pointer"
                    }}
                    title={!laAdmin && userCaLamId ? "Ca làm việc cố định của bạn (Không thể đổi)" : "Chọn ca làm việc"}
                >
                    <option value="">{laAdmin ? "-- Tất cả ca làm --" : "-- Ca làm của bạn --"}</option>
=======
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: laLeaderOnly && nguoiDung?.ca_lam_id ? "#f1f5f9" : "#fff" }}
                >
                    {!laLeaderOnly && <option value="">-- Tất cả ca làm --</option>}
>>>>>>> upstream/main
                    {danhSachCaLam.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                            {cl.ten_ca} ({cl.gio_bat_dau?.substring(0, 5)} - {cl.gio_ket_thuc?.substring(0, 5)})
                        </option>
                    ))}
                </select>

                <select
                    value={trangThaiLoc}
                    onChange={(e) => setTrangThaiLoc(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                >
                    <option value="">-- Tất cả trạng thái --</option>
                    <option value="CHO_DUYET">Chờ duyệt</option>
                    <option value="DA_DUYET">Đã duyệt</option>
                    <option value="TU_CHOI">Từ chối</option>
                </select>

                <input
                    type="text"
                    placeholder="🔍 Tim mã/họ tên NV..."
                    value={tuKhoa}
                    onChange={(e) => setTuKhoa(e.target.value)}
                    style={{ flex: "1 1 180px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                />

                {laLeader && selectedIds.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                        <button
                            className="nut-hanh-dong"
                            style={{ background: "var(--green)", color: "#fff" }}
                            onClick={() => xuLyDuyet(selectedIds, "DA_DUYET")}
                        >
                            ✅ Duyệt ({selectedIds.length})
                        </button>
                        <button
                            className="nut-hanh-dong"
                            style={{ background: "var(--red)", color: "#fff" }}
                            onClick={() => xuLyDuyet(selectedIds, "TU_CHOI")}
                        >
                            ❌ Từ chối ({selectedIds.length})
                        </button>
                    </div>
                )}
            </div>

            {/* Bảng danh sách đăng ký tăng ca */}
            <div className="bang-du-lieu-wrapper">
                {dangTai ? (
                    <div className="man-hinh-dang-tai">Đang tải danh sách tăng ca...</div>
                ) : (
                    <table className="bang-du-lieu">
                        <thead>
                            <tr>
                                {laLeader && (
                                    <th style={{ width: "40px", textAlign: "center" }}>
                                        <input
                                            type="checkbox"
                                            checked={danhSachTangCa.length > 0 && selectedIds.length === danhSachTangCa.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th>Mã NV</th>
                                <th>Họ tên Nhân viên</th>
                                <th>Dây chuyền</th>
                                <th>Ca tăng ca</th>
                                <th>Ngày tăng ca</th>
                                <th>Kỹ năng / Chứng chỉ</th>
                                <th>Trạng thái</th>
                                {laLeader && <th style={{ textAlign: "center" }}>Hành động</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {danhSachTangCa.length === 0 ? (
                                <tr>
                                    <td colSpan={laLeader ? 9 : 8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                                        Không có đơn đăng ký tăng ca nào phù hợp
                                    </td>
                                </tr>
                            ) : (
                                danhSachTangCa.map((item) => (
                                    <tr key={item.id}>
                                        {laLeader && (
                                            <td style={{ textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => handleSelectOne(item.id)}
                                                />
                                            </td>
                                        )}
                                        <td>
                                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: "bold" }}>
                                                {item.ma_nhan_vien}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>{item.ho_ten}</strong>
                                        </td>
                                        <td>{item.ten_day_chuyen || <span className="text-unspecified">Chưa gán</span>}</td>
                                        <td>
                                            <span style={{ fontWeight: "bold", color: "var(--amber-dark)" }}>
                                                ⏰ {item.ten_ca}
                                            </span>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                                {item.gio_bat_dau?.substring(0, 5)} - {item.gio_ket_thuc?.substring(0, 5)}
                                            </div>
                                        </td>
                                        <td>{item.ngay ? new Date(item.ngay).toLocaleDateString("vi-VN") : "-"}</td>
                                        <td>
                                            {item.ky_nang_list && item.ky_nang_list.length > 0 ? (
                                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                    {item.ky_nang_list.map((kn, idx) => (
                                                        <span
                                                            key={idx}
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
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-unspecified">Chưa có chứng chỉ</span>
                                            )}
                                        </td>
                                        <td>{renderTrangThai(item.trang_thai)}</td>
                                        {laLeader && (
                                            <td style={{ textAlign: "center" }}>
                                                <div className="nhom-nut-hanh-dong">
                                                    {item.trang_thai !== "DA_DUYET" && (
                                                        <button
                                                            className="nut-hanh-dong"
                                                            style={{ background: "#dcfce7", color: "#15803d", borderColor: "#86efac" }}
                                                            onClick={() => xuLyDuyet([item.id], "DA_DUYET")}
                                                            title="Phê duyệt tăng ca"
                                                        >
                                                            Duyệt
                                                        </button>
                                                    )}
                                                    {item.trang_thai !== "TU_CHOI" && (
                                                        <button
                                                            className="nut-hanh-dong"
                                                            style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fca5a5" }}
                                                            onClick={() => xuLyDuyet([item.id], "TU_CHOI")}
                                                            title="Từ chối tăng ca"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    )}
                                                    <button
                                                        className="nut-hanh-dong nut-xoa"
                                                        onClick={() => xuLyXoa(item.id, item.ho_ten)}
                                                        title="Xóa đơn"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Đăng ký Tăng ca */}
            {hienModalDangKy && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "560px" }}>
                        <div className="modal-header">
                            <h3>📝 Lập Đăng ký Tăng ca mới</h3>
                            <button className="nut-dong-modal" onClick={() => setHienModalDangKy(false)}>
                                &times;
                            </button>
                        </div>
                        <form onSubmit={xuLyLuuDangKy}>
                            <div className="modal-body">
                                <div className="nhom-o-nhap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label>Ngày tăng ca (*):</label>
                                        <input
                                            type="date"
                                            required
                                            value={formDangKy.ngay}
                                            onChange={(e) => setFormDangKy({ ...formDangKy, ngay: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span>Chọn Ca làm / Ca tăng ca (*):</span>
                                            {laLeaderOnly && nguoiDung?.ca_lam_id && (
                                                <span style={{ fontSize: "11px", color: "#b45309", fontWeight: "bold" }}>🔒 </span>
                                            )}
                                        </label>
                                        <select
                                            required
                                            disabled={!laAdmin && Boolean(userCaLamId)}
                                            value={formDangKy.ca_lam_id}
<<<<<<< HEAD
                                            onChange={(e) => setFormDangKy({ ...formDangKy, ca_lam_id: e.target.value, nhan_vien_ids: [] })}
                                            style={{
                                                background: (!laAdmin && userCaLamId) ? "#f1f5f9" : "#fff",
                                                cursor: (!laAdmin && userCaLamId) ? "not-allowed" : "pointer"
                                            }}
=======
                                            disabled={laLeaderOnly && Boolean(nguoiDung?.ca_lam_id)}
                                            onChange={(e) => setFormDangKy({ ...formDangKy, ca_lam_id: e.target.value })}
                                            style={{ background: laLeaderOnly && nguoiDung?.ca_lam_id ? "#f1f5f9" : "#fff" }}
>>>>>>> upstream/main
                                        >
                                            {danhSachCaLam.map((cl) => (
                                                <option key={cl.id} value={cl.id}>
                                                    {cl.ten_ca} ({cl.gio_bat_dau?.substring(0, 5)} - {cl.gio_ket_thuc?.substring(0, 5)}) {cl.loai_ca === "TANG_CA" ? "⚡[OT]" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="nhom-o-nhap">
                                    <label>Chế độ chọn Nhân sự:</label>
                                    <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                                        <label style={{ fontWeight: "normal", cursor: "pointer" }}>
                                            <input
                                                type="radio"
                                                name="cheDo"
                                                checked={formDangKy.cheDo === "CAN_HANH"}
                                                onChange={() => setFormDangKy({ ...formDangKy, cheDo: "CAN_HANH" })}
                                            />{" "}
                                            Chọn cá nhân cụ thể
                                        </label>
                                        <label style={{ fontWeight: "normal", cursor: "pointer" }}>
                                            <input
                                                type="radio"
                                                name="cheDo"
                                                checked={formDangKy.cheDo === "CHUYEN"}
                                                onChange={() => setFormDangKy({ ...formDangKy, cheDo: "CHUYEN" })}
                                            />{" "}
                                            Đăng ký toàn bộ Dây chuyền
                                        </label>
                                    </div>
                                </div>

                                {formDangKy.cheDo === "CHUYEN" ? (
                                    <div className="nhom-o-nhap">
                                        <label>Chọn Dây chuyền sản xuất (*):</label>
                                        <select
                                            value={formDangKy.day_chuyen_id}
                                            onChange={(e) => setFormDangKy({ ...formDangKy, day_chuyen_id: e.target.value })}
                                        >
                                            {danhSachDayChuyen
                                                .filter(dc => !laLeaderOnly || !nguoiDung?.day_chuyen_id || String(dc.id) === String(nguoiDung.day_chuyen_id))
                                                .map((dc) => (
                                                    <option key={dc.id} value={dc.id}>
                                                        {dc.ten_day_chuyen} (Duyệt toàn bộ nhân sự trong chuyền)
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="nhom-o-nhap">
<<<<<<< HEAD
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                            <label style={{ margin: 0 }}>Danh sách nhân viên (Đã chọn: {formDangKy.nhan_vien_ids.length}):</label>
                                            {formDangKy.day_chuyen_id && (
                                                <button
                                                    type="button"
                                                    style={{ fontSize: "12px", background: "none", border: "none", color: "var(--amber-dark)", cursor: "pointer", textDecoration: "underline" }}
                                                    onClick={() => xuLyChonTatCaSubLine(formDangKy.day_chuyen_id)}
                                                >
                                                    + Chọn nhanh line này
                                                </button>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                maxHeight: "180px",
                                                overflowY: "auto",
                                                border: "1px solid #d3d7de",
                                                borderRadius: "var(--radius)",
                                                padding: "8px 12px",
                                                background: "#fff"
                                            }}
                                        >
                                            {(() => {
                                                const nhanVienTheoCa = danhSachNhanVien.filter((nv) => {
                                                    if (!formDangKy.ca_lam_id) return true;
                                                    return String(nv.ca_lam_id) === String(formDangKy.ca_lam_id);
                                                });

                                                if (nhanVienTheoCa.length === 0) {
                                                    return (
                                                        <div style={{ padding: "12px", color: "var(--text-muted)", textAlign: "center", fontSize: "13px" }}>
                                                            ⚠️ Không có nhân viên nào thuộc ca làm được chọn
                                                        </div>
                                                    );
                                                }

                                                return nhanVienTheoCa.map((nv) => (
                                                    <label
                                                        key={nv.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            padding: "4px 0",
                                                            borderBottom: "1px solid #f1f5f9",
                                                            cursor: "pointer",
                                                            fontSize: "13px"
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formDangKy.nhan_vien_ids.includes(nv.id)}
                                                            onChange={() => xuLyNhanVienSelection(nv.id)}
                                                        />
                                                        <span>
                                                            <strong>{nv.ho_ten}</strong> ({nv.ma_nhan_vien || "NV"}) - {nv.ten_day_chuyen || "Tự do"}
                                                        </span>
                                                    </label>
                                                ));
                                            })()}
                                        </div>
=======
                                        {(() => {
                                            const laAdminUser = nguoiDung && (nguoiDung.role === "ADMIN" || nguoiDung.role === "MANAGER");
                                            const activeTargetCa = laLeaderOnly && nguoiDung?.ca_lam_id ? nguoiDung.ca_lam_id : formDangKy.ca_lam_id;

                                            // Lọc danh sách nhân viên trong modal
                                            let listNvFiltered = danhSachNhanVien;

                                            if (laLeaderOnly) {
                                                // Đối với Leader: CHỈ hiện nhân viên thuộc ca của Leader (VÀ thuộc chuyền nếu có)
                                                listNvFiltered = danhSachNhanVien.filter((nv) => {
                                                    const matchCa = !activeTargetCa || String(nv.ca_lam_id) === String(activeTargetCa);
                                                    const matchLine = !nguoiDung?.day_chuyen_id || String(nv.day_chuyen_id) === String(nguoiDung.day_chuyen_id);
                                                    return matchCa && matchLine; // AND: bắt buộc đúng ca
                                                });
                                            } else if (laAdminUser && formDangKy.ca_lam_id) {
                                                // Đối với Admin: hiển thị danh sách nhân viên thuộc ca được chọn
                                                listNvFiltered = danhSachNhanVien.filter(
                                                    (nv) => String(nv.ca_lam_id) === String(formDangKy.ca_lam_id)
                                                );
                                            }

                                            // Nếu lọc theo từ khóa trong modal (nếu có)
                                            if (tuKhoaModal) {
                                                const kw = tuKhoaModal.toLowerCase();
                                                listNvFiltered = listNvFiltered.filter(
                                                    (nv) => nv.ho_ten?.toLowerCase().includes(kw) || nv.ma_nhan_vien?.toLowerCase().includes(kw)
                                                );
                                            }

                                            const currentCa = danhSachCaLam.find(c => String(c.id) === String(formDangKy.ca_lam_id));
                                            const allChecked = listNvFiltered.length > 0 && listNvFiltered.every((nv) => formDangKy.nhan_vien_ids.includes(nv.id));

                                            return (
                                                <>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                        <label style={{ margin: 0, fontWeight: "bold" }}>
                                                            Danh sách Nhân viên {currentCa ? `(${currentCa.ten_ca})` : ""}:{" "}
                                                            <span style={{ fontSize: "12px", background: "#e2e8f0", color: "#0f172a", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                                                                Đã chọn: {formDangKy.nhan_vien_ids.length}
                                                            </span>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            style={{ fontSize: "12px", background: "none", border: "none", color: "var(--amber-dark)", cursor: "pointer", textDecoration: "underline", fontWeight: "bold" }}
                                                            onClick={() => {
                                                                const ids = listNvFiltered.map(n => n.id);
                                                                if (allChecked) {
                                                                    setFormDangKy({
                                                                        ...formDangKy,
                                                                        nhan_vien_ids: formDangKy.nhan_vien_ids.filter(id => !ids.includes(id))
                                                                    });
                                                                } else {
                                                                    setFormDangKy({
                                                                        ...formDangKy,
                                                                        nhan_vien_ids: Array.from(new Set([...formDangKy.nhan_vien_ids, ...ids]))
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            {allChecked ? "❌ Bỏ chọn ca này" : "✅ Chọn tất cả ca này"}
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        placeholder="🔍 Tìm nhân viên theo tên/mã..."
                                                        value={tuKhoaModal}
                                                        onChange={(e) => setTuKhoaModal(e.target.value)}
                                                        style={{ width: "100%", padding: "6px 10px", fontSize: "12px", marginBottom: "8px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                                                    />

                                                    {laAdminUser && (
                                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                                                            ℹ️ <i>(Admin đang xem nhân viên thuộc {currentCa ? currentCa.ten_ca : "ca đã chọn"})</i>
                                                        </div>
                                                    )}
                                                    {laLeaderOnly && (
                                                        <div style={{ fontSize: "11px", color: "#b45309", marginBottom: "6px", fontWeight: "600" }}>
                                                            🔒 <i>(Leader chỉ được chọn nhân viên thuộc ca/dây chuyền của mình)</i>
                                                        </div>
                                                    )}

                                                    <div
                                                        style={{
                                                            maxHeight: "200px",
                                                            overflowY: "auto",
                                                            border: "1px solid #d3d7de",
                                                            borderRadius: "var(--radius)",
                                                            padding: "8px 12px",
                                                            background: "#fff"
                                                        }}
                                                    >
                                                        {listNvFiltered.length === 0 ? (
                                                            <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
                                                                Không tìm thấy nhân viên thuộc ca này
                                                            </div>
                                                        ) : (
                                                            listNvFiltered.map((nv) => (
                                                                <label
                                                                    key={nv.id}
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                        padding: "5px 0",
                                                                        borderBottom: "1px solid #f1f5f9",
                                                                        cursor: "pointer",
                                                                        fontSize: "13px"
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formDangKy.nhan_vien_ids.includes(nv.id)}
                                                                        onChange={() => xuLyNhanVienSelection(nv.id)}
                                                                    />
                                                                    <span>
                                                                        <strong>{nv.ho_ten}</strong> ({nv.ma_nhan_vien || "NV"})
                                                                        <span style={{ color: "var(--steel)", marginLeft: "6px" }}>- {nv.ten_day_chuyen || "Tự do"}</span>
                                                                        {nv.ten_ca_lam && (
                                                                            <span style={{ color: "#d97706", marginLeft: "6px", fontWeight: "600" }}>
                                                                                [{nv.ten_ca_lam}]
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </label>
                                                            ))
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
>>>>>>> upstream/main
                                    </div>
                                )}

                                <div className="nhom-o-nhap">
                                    <label>Trạng thái khởi tạo:</label>
                                    <select
                                        value={formDangKy.trang_thai}
                                        onChange={(e) => setFormDangKy({ ...formDangKy, trang_thai: e.target.value })}
                                    >
                                        <option value="DA_DUYET">✅ Đã phê duyệt ngay (Cho phép phân bổ)</option>
                                        <option value="CHO_DUYET">⏳ Chờ duyệt (Cần xác nhận lại)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="nut-huy" onClick={() => setHienModalDangKy(false)}>
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="nut-chinh nut-luu">
                                    Xác nhận Đăng ký
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
