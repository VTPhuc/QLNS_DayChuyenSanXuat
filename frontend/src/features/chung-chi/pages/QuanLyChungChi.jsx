import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../api.js";

export default function QuanLyChungChi() {
    const { nguoiDung } = useAuth();
    const laAdmin = nguoiDung && (nguoiDung.role === "ADMIN" || nguoiDung.role === "MANAGER" || nguoiDung.role === "LEADER_KHU_VUC");

    const [tabHienTai, setTabHienTai] = useState("nhan_vien"); // "nhan_vien" | "danh_muc"
    
    // States danh mục chứng chỉ
    const [danhSachChungChi, setDanhSachChungChi] = useState([]);
    // States chứng chỉ nhân viên
    const [danhSachCCMV, setDanhSachCCMV] = useState([]);
    // States danh sách nhân viên (để chọn khi gán)
    const [danhSachNhanVien, setDanhSachNhanVien] = useState([]);

    const [dangTai, setDangTai] = useState(false);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // Bộ lọc tab chứng chỉ nhân viên
    const [tuKhoa, setTuKhoa] = useState("");
    const [locChungChi, setLocChungChi] = useState("");
    const [locTrangThai, setLocTrangThai] = useState("");

    // Modal Danh mục Chứng chỉ
    const [hienModalDM, setHienModalDM] = useState(false);
    const [modalDMCheDo, setModalDMCheDo] = useState("THEM"); // "THEM" | "SUA"
    const [formDM, setFormDM] = useState({ id: null, ten_chung_chi: "", mo_ta: "" });

    // Modal Gán Chứng chỉ Nhân viên
    const [hienModalGan, setHienModalGan] = useState(false);
    const [modalGanCheDo, setModalGanCheDo] = useState("THEM"); // "THEM" | "SUA"
    const [tuKhoaTimNvGan, setTuKhoaTimNvGan] = useState("");
    const [formGan, setFormGan] = useState({
        id: null,
        nhan_vien_ids: [],
        nhan_vien_id: "",
        chung_chi_id: "",
        cap_do: 1,
        ngay_cap: new Date().toISOString().split("T")[0],
        ngay_het_han: "",
        trang_thai: "HIEU_LUC"
    });

    // Load danh mục chứng chỉ
    const taidanhSachChungChi = useCallback(async () => {
        try {
            const res = await api("/chung-chi");
            if (res.success) {
                setDanhSachChungChi(res.data || []);
            }
        } catch (err) {
            setLoi(err.message || "Lỗi khi tải danh mục chứng chỉ");
        }
    }, []);

    // Load danh sách gán chứng chỉ nhân viên
    const taiDanhSachCCMV = useCallback(async () => {
        try {
            let url = `/chung-chi/nhan-vien?`;
            if (tuKhoa) url += `&q=${encodeURIComponent(tuKhoa)}`;
            if (locChungChi) url += `&chung_chi_id=${locChungChi}`;
            if (locTrangThai) url += `&trang_thai=${locTrangThai}`;

            const res = await api(url);
            if (res.success) {
                setDanhSachCCMV(res.data || []);
            }
        } catch (err) {
            setLoi(err.message || "Lỗi khi tải dữ liệu chứng chỉ nhân viên");
        }
    }, [tuKhoa, locChungChi, locTrangThai]);

    // Load danh sách nhân viên (để gán)
    const taiDanhSachNhanVien = useCallback(async () => {
        try {
            const res = await api("/nhan-vien");
            if (res.success) {
                setDanhSachNhanVien(res.data || []);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách nhân viên:", err);
        }
    }, []);

    const taidanhSach = useCallback(async () => {
        setDangTai(true);
        setLoi("");
        await Promise.all([taidanhSachChungChi(), taiDanhSachCCMV(), taiDanhSachNhanVien()]);
        setDangTai(false);
    }, [taidanhSachChungChi, taiDanhSachCCMV, taiDanhSachNhanVien]);

    useEffect(() => {
        taidanhSach();
    }, [taidanhSach]);

    useEffect(() => {
        taiDanhSachCCMV();
    }, [taiDanhSachCCMV]);

    // Tự đóng thông báo thành công sau 4s
    useEffect(() => {
        if (thongBao) {
            const timer = setTimeout(() => setThongBao(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [thongBao]);

    // Handlers Danh mục Chứng chỉ
    const hienModalThemDM = () => {
        setFormDM({ id: null, ten_chung_chi: "", mo_ta: "" });
        setModalDMCheDo("THEM");
        setHienModalDM(true);
    };

    const hienModalSuaDM = (item) => {
        setFormDM({ id: item.id, ten_chung_chi: item.ten_chung_chi, mo_ta: item.mo_ta || "" });
        setModalDMCheDo("SUA");
        setHienModalDM(true);
    };

    const xuLyLuuDM = async (e) => {
        e.preventDefault();
        setLoi("");
        try {
            if (modalDMCheDo === "THEM") {
                const res = await api("/chung-chi", {
                    method: "POST",
                    body: JSON.stringify({ ten_chung_chi: formDM.ten_chung_chi, mo_ta: formDM.mo_ta })
                });
                setThongBao(res.message || "Tạo chứng chỉ thành công");
            } else {
                const res = await api(`/chung-chi/${formDM.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ ten_chung_chi: formDM.ten_chung_chi, mo_ta: formDM.mo_ta })
                });
                setThongBao(res.message || "Cập nhật chứng chỉ thành công");
            }
            setHienModalDM(false);
            taidanhSachChungChi();
        } catch (err) {
            setLoi(err.message || "Đã có lỗi xảy ra");
        }
    };

    const xuLyXoaDM = async (id, ten) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa chứng chỉ "${ten}"?`)) return;
        setLoi("");
        try {
            const res = await api(`/chung-chi/${id}`, { method: "DELETE" });
            setThongBao(res.message || "Xóa chứng chỉ thành công");
            taidanhSachChungChi();
        } catch (err) {
            setLoi(err.message || "Đã có lỗi xảy ra");
        }
    };

    // Handlers Gán Chứng chỉ Nhân viên
    const hienModalThemGan = () => {
        setTuKhoaTimNvGan("");
        setFormGan({
            id: null,
            nhan_vien_ids: [],
            nhan_vien_id: "",
            chung_chi_id: danhSachChungChi.length > 0 ? danhSachChungChi[0].id : "",
            cap_do: 1,
            ngay_cap: new Date().toISOString().split("T")[0],
            ngay_het_han: "",
            trang_thai: "HIEU_LUC"
        });
        setModalGanCheDo("THEM");
        setHienModalGan(true);
    };

    const hienModalSuaGan = (item) => {
        setFormGan({
            id: item.id,
            nhan_vien_ids: [item.nhan_vien_id],
            nhan_vien_id: item.nhan_vien_id,
            chung_chi_id: item.chung_chi_id,
            cap_do: item.cap_do || 1,
            ngay_cap: item.ngay_cap ? new Date(item.ngay_cap).toISOString().split("T")[0] : "",
            ngay_het_han: item.ngay_het_han ? new Date(item.ngay_het_han).toISOString().split("T")[0] : "",
            trang_thai: item.trang_thai || "HIEU_LUC"
        });
        setModalGanCheDo("SUA");
        setHienModalGan(true);
    };

    const xuLyChonNvGan = (id) => {
        const numId = Number(id);
        if (formGan.nhan_vien_ids.includes(numId)) {
            setFormGan({
                ...formGan,
                nhan_vien_ids: formGan.nhan_vien_ids.filter((x) => x !== numId)
            });
        } else {
            setFormGan({
                ...formGan,
                nhan_vien_ids: [...formGan.nhan_vien_ids, numId]
            });
        }
    };

    const xuLyChonTatCaNvGan = (danhSachFiltered) => {
        const idsFiltered = danhSachFiltered.map((nv) => nv.id);
        const allSelected = idsFiltered.every((id) => formGan.nhan_vien_ids.includes(id));

        if (allSelected) {
            setFormGan({
                ...formGan,
                nhan_vien_ids: formGan.nhan_vien_ids.filter((id) => !idsFiltered.includes(id))
            });
        } else {
            setFormGan({
                ...formGan,
                nhan_vien_ids: Array.from(new Set([...formGan.nhan_vien_ids, ...idsFiltered]))
            });
        }
    };

    const xuLyLuuGan = async (e) => {
        e.preventDefault();
        setLoi("");
        try {
            if (modalGanCheDo === "THEM") {
                if (formGan.nhan_vien_ids.length === 0) {
                    setLoi("Vui lòng chọn ít nhất 1 nhân viên để gán chứng chỉ");
                    return;
                }
                const res = await api("/chung-chi/nhan-vien", {
                    method: "POST",
                    body: JSON.stringify({
                        nhan_vien_ids: formGan.nhan_vien_ids,
                        chung_chi_id: formGan.chung_chi_id,
                        cap_do: formGan.cap_do,
                        ngay_cap: formGan.ngay_cap,
                        ngay_het_han: formGan.ngay_het_han,
                        trang_thai: formGan.trang_thai
                    })
                });
                setThongBao(res.message || "Gán chứng chỉ cho nhân viên thành công");
            } else {
                const res = await api(`/chung-chi/nhan-vien/${formGan.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        cap_do: formGan.cap_do,
                        ngay_cap: formGan.ngay_cap,
                        ngay_het_han: formGan.ngay_het_han,
                        trang_thai: formGan.trang_thai
                    })
                });
                setThongBao(res.message || "Cập nhật chứng chỉ nhân viên thành công");
            }
            setHienModalGan(false);
            taiDanhSachCCMV();
            taidanhSachChungChi();
        } catch (err) {
            setLoi(err.message || "Đã có lỗi xảy ra");
        }
    };

    const xuLyXoaGan = async (id, tenNv, tenCc) => {
        if (!window.confirm(`Thu hồi chứng chỉ "${tenCc}" của nhân viên ${tenNv}?`)) return;
        setLoi("");
        try {
            const res = await api(`/chung-chi/nhan-vien/${id}`, { method: "DELETE" });
            setThongBao(res.message || "Thu hồi chứng chỉ thành công");
            taiDanhSachCCMV();
            taidanhSachChungChi();
        } catch (err) {
            setLoi(err.message || "Đã có lỗi xảy ra");
        }
    };

    // Render helper cho level vạch kỹ năng
    const renderCapDoVach = (capDo) => {
        const bars = [];
        for (let i = 1; i <= 5; i++) {
            bars.push(
                <span
                    key={i}
                    className={`cap-do-vach ${i <= capDo ? "active" : ""}`}
                    title={`Cấp độ ${capDo}`}
                />
            );
        }
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div className="cap-do-hien-thi">{bars}</div>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--steel)" }}>
                    Cấp {capDo}
                </span>
            </div>
        );
    };

    // Render helper cho badge trạng thái
    const renderTrangThaiBadge = (tt) => {
        switch (tt) {
            case "HIEU_LUC":
                return <span className="trang-thai-badge active">🟢 HIỆU LỰC</span>;
            case "HET_HAN":
                return <span className="trang-thai-badge locked">🔴 HẾT HẠN</span>;
            case "DAO_TAO":
                return (
                    <span
                        className="trang-thai-badge"
                        style={{ background: "#fef3c7", color: "#d97706" }}
                    >
                        🟡 ĐANG ĐÀO TẠO
                    </span>
                );
            default:
                return <span className="trang-thai-badge">{tt}</span>;
        }
    };

    // Thống kê nhanh
    const tongChungChi = danhSachChungChi.length;
    const tongNhanVienCap = danhSachCCMV.length;
    const hetHanCount = danhSachCCMV.filter((item) => item.trang_thai === "HET_HAN").length;
    const daoTaoCount = danhSachCCMV.filter((item) => item.trang_thai === "DAO_TAO").length;

    return (
        <div className="noi-dung-admin">
            {/* Header section */}
            <div className="admin-header-bar">
                <div className="tieu-de-khoi">
                    <h2>Quản lý Chứng chỉ & Kỹ năng Tay nghề</h2>
                    <p>Quản lý danh mục kỹ năng nhà máy và cấp độ chứng chỉ của từng nhân viên dây chuyền</p>
                </div>
                {laAdmin && (
                    <div className="nhom-nut-admin">
                        <button className="nut-chinh nut-them-moi" onClick={hienModalThemGan}>
                            🎓 Gán chứng chỉ nhân viên
                        </button>
                        <button
                            className="nut-import-excel"
                            style={{ background: "var(--steel)", color: "#fff", borderColor: "var(--steel)" }}
                            onClick={hienModalThemDM}
                        >
                            + Thêm loại chứng chỉ
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
                        Danh mục chứng chỉ
                    </span>
                    <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--charcoal)" }}>{tongChungChi}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Chứng chỉ đã gán
                    </span>
                    <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--green)" }}>{tongNhanVienCap}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Đang đào tạo
                    </span>
                    <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "#d97706" }}>{daoTaoCount}</h3>
                </div>
                <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Hết hiệu lực
                    </span>
                    <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--red)" }}>{hetHanCount}</h3>
                </div>
            </div>

            {/* Thống báo & Lỗi */}
            {thongBao && <div className="thong-bao-thanh-cong">✅ {thongBao}</div>}
            {loi && <div className="thong-bao-loi">⚠️ {loi}</div>}

            {/* Tab navigation */}
            <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
                <button
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: tabHienTai === "nhan_vien" ? "3px solid var(--amber)" : "3px solid transparent",
                        fontWeight: tabHienTai === "nhan_vien" ? "bold" : "normal",
                        color: tabHienTai === "nhan_vien" ? "var(--charcoal)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "15px"
                    }}
                    onClick={() => setTabHienTai("nhan_vien")}
                >
                    📜 Chứng chỉ Nhân viên ({tongNhanVienCap})
                </button>
                <button
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: tabHienTai === "danh_muc" ? "3px solid var(--amber)" : "3px solid transparent",
                        fontWeight: tabHienTai === "danh_muc" ? "bold" : "normal",
                        color: tabHienTai === "danh_muc" ? "var(--charcoal)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "15px"
                    }}
                    onClick={() => setTabHienTai("danh_muc")}
                >
                    📋 Danh mục Kỹ năng / Chứng chỉ ({tongChungChi})
                </button>
            </div>

            {/* TAB 1: CHỨNG CHỈ NHÂN VIÊN */}
            {tabHienTai === "nhan_vien" && (
                <>
                    {/* Thanh lọc dữ liệu */}
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            marginBottom: "16px",
                            flexWrap: "wrap",
                            background: "#fff",
                            padding: "12px 16px",
                            borderRadius: "var(--radius)",
                            border: "1px solid #e2e5ea"
                        }}
                    >
                        <input
                            type="text"
                            placeholder="🔍 Tìm theo mã NV, tên NV, tên chứng chỉ..."
                            value={tuKhoa}
                            onChange={(e) => setTuKhoa(e.target.value)}
                            style={{
                                flex: "1 1 240px",
                                padding: "8px 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "var(--radius)"
                            }}
                        />
                        <select
                            value={locChungChi}
                            onChange={(e) => setLocChungChi(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "var(--radius)",
                                background: "#fff"
                            }}
                        >
                            <option value="">-- Tất cả chứng chỉ --</option>
                            {danhSachChungChi.map((cc) => (
                                <option key={cc.id} value={cc.id}>
                                    {cc.ten_chung_chi}
                                </option>
                            ))}
                        </select>
                        <select
                            value={locTrangThai}
                            onChange={(e) => setLocTrangThai(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "var(--radius)",
                                background: "#fff"
                            }}
                        >
                            <option value="">-- Tất cả trạng thái --</option>
                            <option value="HIEU_LUC">Hiệu lực</option>
                            <option value="DAO_TAO">Đang đào tạo</option>
                            <option value="HET_HAN">Hết hạn</option>
                        </select>
                    </div>

                    <div className="bang-du-lieu-wrapper">
                        {dangTai ? (
                            <div className="man-hinh-dang-tai">Đang tải danh sách chứng chỉ nhân viên...</div>
                        ) : (
                            <table className="bang-du-lieu">
                                <thead>
                                    <tr>
                                        <th>Mã NV</th>
                                        <th>Họ tên Nhân viên</th>
                                        <th>Dây chuyền</th>
                                        <th>Chứng chỉ / Kỹ năng</th>
                                        <th>Cấp độ tay nghề</th>
                                        <th>Ngày cấp</th>
                                        <th>Hạn sử dụng</th>
                                        <th>Trạng thái</th>
                                        {laAdmin && <th style={{ textAlign: "center" }}>Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {danhSachCCMV.length === 0 ? (
                                        <tr>
                                            <td colSpan={laAdmin ? 9 : 8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                                                Chưa có thông tin chứng chỉ nhân viên phù hợp
                                            </td>
                                        </tr>
                                    ) : (
                                        danhSachCCMV.map((item) => (
                                            <tr key={item.id}>
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
                                                    <span style={{ fontWeight: "600", color: "var(--charcoal)" }}>
                                                        {item.ten_chung_chi}
                                                    </span>
                                                </td>
                                                <td>{renderCapDoVach(item.cap_do)}</td>
                                                <td>{item.ngay_cap ? new Date(item.ngay_cap).toLocaleDateString("vi-VN") : "-"}</td>
                                                <td>
                                                    {item.ngay_het_han
                                                        ? new Date(item.ngay_het_han).toLocaleDateString("vi-VN")
                                                        : <span className="text-unspecified">Vô thời hạn</span>}
                                                </td>
                                                <td>{renderTrangThaiBadge(item.trang_thai)}</td>
                                                {laAdmin && (
                                                    <td style={{ textAlign: "center" }}>
                                                        <div className="nhom-nut-hanh-dong">
                                                            <button
                                                                className="nut-hanh-dong nut-sua"
                                                                onClick={() => hienModalSuaGan(item)}
                                                                title="Cập nhật cấp độ / thời hạn"
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                className="nut-hanh-dong nut-xoa"
                                                                onClick={() => xuLyXoaGan(item.id, item.ho_ten, item.ten_chung_chi)}
                                                                title="Thu hồi chứng chỉ"
                                                            >
                                                                Thu hồi
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
                </>
            )}

            {/* TAB 2: DANH MỤC CHỨNG CHỈ */}
            {tabHienTai === "danh_muc" && (
                <div className="bang-du-lieu-wrapper">
                    {dangTai ? (
                        <div className="man-hinh-dang-tai">Đang tải danh mục chứng chỉ...</div>
                    ) : (
                        <table className="bang-du-lieu">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên chứng chỉ / Kỹ năng</th>
                                    <th>Mô tả chi tiết</th>
                                    <th>Số NV đang sở hữu</th>
                                    {laAdmin && <th style={{ textAlign: "center" }}>Hành động</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {danhSachChungChi.length === 0 ? (
                                    <tr>
                                        <td colSpan={laAdmin ? 5 : 4} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                                            Chưa có chứng chỉ nào trong hệ thống
                                        </td>
                                    </tr>
                                ) : (
                                    danhSachChungChi.map((cc) => (
                                        <tr key={cc.id}>
                                            <td>{cc.id}</td>
                                            <td>
                                                <strong style={{ fontSize: "15px", color: "var(--charcoal)" }}>
                                                    🎓 {cc.ten_chung_chi}
                                                </strong>
                                            </td>
                                            <td>{cc.mo_ta || <span className="text-unspecified">Không có mô tả</span>}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        background: "#e2e8f0",
                                                        padding: "2px 10px",
                                                        borderRadius: "12px",
                                                        fontWeight: "bold",
                                                        fontSize: "13px"
                                                    }}
                                                >
                                                    👥 {cc.so_luong_nhan_vien || 0} nhân viên
                                                </span>
                                            </td>
                                            {laAdmin && (
                                                <td style={{ textAlign: "center" }}>
                                                    <div className="nhom-nut-hanh-dong">
                                                        <button
                                                            className="nut-hanh-dong nut-sua"
                                                            onClick={() => hienModalSuaDM(cc)}
                                                            title="Sửa chứng chỉ"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            className="nut-hanh-dong nut-xoa"
                                                            onClick={() => xuLyXoaDM(cc.id, cc.ten_chung_chi)}
                                                            title="Xóa loại chứng chỉ"
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
            )}

            {/* MODAL 1: Thêm/Sửa Danh mục chứng chỉ */}
            {hienModalDM && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{modalDMCheDo === "THEM" ? "Thêm loại chứng chỉ mới" : "Chỉnh sửa thông tin chứng chỉ"}</h3>
                            <button className="nut-dong-modal" onClick={() => setHienModalDM(false)}>
                                &times;
                            </button>
                        </div>
                        <form onSubmit={xuLyLuuDM}>
                            <div className="modal-body">
                                <div className="nhom-o-nhap">
                                    <label>Tên chứng chỉ / Kỹ năng (*):</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Vận hành máy SMT, QC kiểm hàng..."
                                        value={formDM.ten_chung_chi}
                                        onChange={(e) => setFormDM({ ...formDM, ten_chung_chi: e.target.value })}
                                    />
                                </div>
                                <div className="nhom-o-nhap">
                                    <label>Mô tả chi tiết:</label>
                                    <textarea
                                        rows="3"
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d3d7de",
                                            borderRadius: "var(--radius)",
                                            fontFamily: "var(--font-body)"
                                        }}
                                        placeholder="Mô tả ngắn gọn tiêu chuẩn đánh giá hoặc phạm vi công việc..."
                                        value={formDM.mo_ta}
                                        onChange={(e) => setFormDM({ ...formDM, mo_ta: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="nut-huy" onClick={() => setHienModalDM(false)}>
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="nut-chinh nut-luu">
                                    {modalDMCheDo === "THEM" ? "Thêm chứng chỉ" : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Gán/Sửa chứng chỉ nhân viên */}
            {hienModalGan && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{modalGanCheDo === "THEM" ? "Gán chứng chỉ mới cho Nhân viên" : "Cập nhật chứng chỉ Nhân viên"}</h3>
                            <button className="nut-dong-modal" onClick={() => setHienModalGan(false)}>
                                &times;
                            </button>
                        </div>
                        <form onSubmit={xuLyLuuGan}>
                            <div className="modal-body">
                                {modalGanCheDo === "THEM" ? (
                                    <>
                                        <div className="nhom-o-nhap">
                                            <label>Chọn Loại Chứng chỉ (*):</label>
                                            <select
                                                required
                                                value={formGan.chung_chi_id}
                                                onChange={(e) => setFormGan({ ...formGan, chung_chi_id: e.target.value })}
                                            >
                                                <option value="">-- Chọn chứng chỉ --</option>
                                                {danhSachChungChi.map((cc) => (
                                                    <option key={cc.id} value={cc.id}>
                                                        {cc.ten_chung_chi}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Chọn nhiều Nhân viên */}
                                        <div className="nhom-o-nhap">
                                            {(() => {
                                                const dsNvFiltered = danhSachNhanVien.filter((nv) => {
                                                    if (!tuKhoaTimNvGan.trim()) return true;
                                                    const kw = tuKhoaTimNvGan.toLowerCase();
                                                    return (
                                                        nv.ho_ten?.toLowerCase().includes(kw) ||
                                                        nv.ma_nhan_vien?.toLowerCase().includes(kw) ||
                                                        nv.ten_day_chuyen?.toLowerCase().includes(kw) ||
                                                        nv.ten_ca_lam?.toLowerCase().includes(kw)
                                                    );
                                                });
                                                const allChecked = dsNvFiltered.length > 0 && dsNvFiltered.every((nv) => formGan.nhan_vien_ids.includes(nv.id));

                                                return (
                                                    <>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                            <label style={{ margin: 0, fontWeight: "bold" }}>
                                                                Chọn Nhân viên (*):{" "}
                                                                <span style={{ fontSize: "12px", background: "#e2e8f0", color: "#0f172a", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                                                                    Đã chọn: {formGan.nhan_vien_ids.length} nhân viên
                                                                </span>
                                                            </label>
                                                            <button
                                                                type="button"
                                                                style={{ fontSize: "12px", background: "none", border: "none", color: "var(--amber-dark)", cursor: "pointer", textDecoration: "underline", fontWeight: "bold" }}
                                                                onClick={() => xuLyChonTatCaNvGan(dsNvFiltered)}
                                                            >
                                                                {allChecked ? "❌ Bỏ chọn tất cả" : "✅ Chọn tất cả (kết quả lọc)"}
                                                            </button>
                                                        </div>

                                                        <input
                                                            type="text"
                                                            placeholder="🔍 Tìm nhân viên theo tên, mã NV, dây chuyền, ca..."
                                                            value={tuKhoaTimNvGan}
                                                            onChange={(e) => setTuKhoaTimNvGan(e.target.value)}
                                                            style={{
                                                                width: "100%",
                                                                padding: "7px 10px",
                                                                marginBottom: "8px",
                                                                fontSize: "13px",
                                                                border: "1px solid #cbd5e1",
                                                                borderRadius: "var(--radius)"
                                                            }}
                                                        />

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
                                                            {dsNvFiltered.length === 0 ? (
                                                                <div style={{ textAlign: "center", padding: "12px", color: "var(--text-muted)", fontSize: "13px" }}>
                                                                    Không tìm thấy nhân viên nào phù hợp
                                                                </div>
                                                            ) : (
                                                                dsNvFiltered.map((nv) => (
                                                                    <label
                                                                        key={nv.id}
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "8px",
                                                                            padding: "6px 0",
                                                                            borderBottom: "1px solid #f1f5f9",
                                                                            cursor: "pointer",
                                                                            fontSize: "13px"
                                                                        }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={formGan.nhan_vien_ids.includes(nv.id)}
                                                                            onChange={() => xuLyChonNvGan(nv.id)}
                                                                        />
                                                                        <span>
                                                                            <strong>{nv.ho_ten}</strong> ({nv.ma_nhan_vien || "NV"})
                                                                            {nv.ten_day_chuyen ? <span style={{ color: "var(--steel)", marginLeft: "6px" }}>- Line: {nv.ten_day_chuyen}</span> : ""}
                                                                            {nv.ten_ca_lam ? <span style={{ color: "#d97706", marginLeft: "6px", fontWeight: "600" }}>- {nv.ten_ca_lam}</span> : ""}
                                                                        </span>
                                                                    </label>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        style={{
                                            background: "#f8fafc",
                                            padding: "12px 16px",
                                            borderRadius: "var(--radius)",
                                            marginBottom: "16px",
                                            border: "1px solid #cbd5e1"
                                        }}
                                    >
                                        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Nhân viên:</div>
                                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                                            {danhSachCCMV.find((x) => x.id === formGan.id)?.ho_ten}
                                        </div>
                                        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>Chứng chỉ:</div>
                                        <div style={{ fontWeight: "bold", color: "var(--amber-dark)" }}>
                                            {danhSachCCMV.find((x) => x.id === formGan.id)?.ten_chung_chi}
                                        </div>
                                    </div>
                                )}

                                <div className="nhom-o-nhap">
                                    <label>Cấp độ tay nghề (1 - 5) (*):</label>
                                    <select
                                        value={formGan.cap_do}
                                        onChange={(e) => setFormGan({ ...formGan, cap_do: Number(e.target.value) })}
                                    >
                                        <option value={1}>Cấp độ 1 (Cơ bản / Học việc)</option>
                                        <option value={2}>Cấp độ 2 (Thành thạo cơ bản)</option>
                                        <option value={3}>Cấp độ 3 (Khá / Làm độc lập)</option>
                                        <option value={4}>Cấp độ 4 (Giỏi / Hướng dẫn lại)</option>
                                        <option value={5}>Cấp độ 5 (Chuyên gia / Master)</option>
                                    </select>
                                </div>

                                <div className="nhom-o-nhap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label>Ngày cấp:</label>
                                        <input
                                            type="date"
                                            value={formGan.ngay_cap}
                                            onChange={(e) => setFormGan({ ...formGan, ngay_cap: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label>Ngày hết hạn (nếu có):</label>
                                        <input
                                            type="date"
                                            value={formGan.ngay_het_han}
                                            onChange={(e) => setFormGan({ ...formGan, ngay_het_han: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="nhom-o-nhap">
                                    <label>Trạng thái chứng chỉ:</label>
                                    <select
                                        value={formGan.trang_thai}
                                        onChange={(e) => setFormGan({ ...formGan, trang_thai: e.target.value })}
                                    >
                                        <option value="HIEU_LUC">Hiệu lực</option>
                                        <option value="DAO_TAO">Đang đào tạo</option>
                                        <option value="HET_HAN">Hết hạn</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="nut-huy" onClick={() => setHienModalGan(false)}>
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="nut-chinh nut-luu">
                                    {modalGanCheDo === "THEM" ? "Xác nhận gán" : "Lưu thông tin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
