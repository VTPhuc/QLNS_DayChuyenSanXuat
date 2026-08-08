import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import {
    layDanhSachCaLam,
    taoCaLam,
    capNhatCaLam,
    xoaCaLam,
    layDanhSachLichLam,
    taoLichLam,
    capNhatLichLam,
    xoaLichLam,
    xoayCaLichLam
} from "../services/caLam.service.js";
import LichSuVaThongKeEmbedded from "../../../components/common/LichSuVaThongKeEmbedded.jsx";

export default function QuanLyCaLam() {
    const { nguoiDung } = useAuth();
    const laAdminOrLeaderKhuVuc = nguoiDung && ["ADMIN", "LEADER_KHU_VUC"].includes(nguoiDung.role);

    const [danhSachCa, setDanhSachCa] = useState([]);
    const [danhSachLich, setDanhSachLich] = useState([]);
    const [dangTai, setDangTai] = useState(true);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // State cho Modal Ca Lam
    const [modalOpen, setModalOpen] = useState(false);
    const [cheDo, setCheDo] = useState("THEM"); // "THEM" hoặc "SUA"
    const [caLamTarget, setCaLamTarget] = useState(null);

    // Form inputs Ca Lam
    const [tenCa, setTenCa] = useState("");
    const [gioBatDau, setGioBatDau] = useState("");
    const [gioKetThuc, setGioKetThuc] = useState("");
    const [loaiCa, setLoaiCa] = useState("THUONG");
    const [lichLamId, setLichLamId] = useState("");
    const [dangXuLy, setDangXuLy] = useState(false);

    // State cho Modal Lich Lam
    const [modalLichOpen, setModalLichOpen] = useState(false);
    const [cheDoLich, setCheDoLich] = useState("THEM"); // "THEM" hoặc "SUA"
    const [lichTarget, setLichTarget] = useState(null);

    // Form inputs Lich Lam
    const [tenLich, setTenLich] = useState("");
    const [chuKyTuan, setChuKyTuan] = useState(2);
    const [ngayBatDau, setNgayBatDau] = useState("");
    const [ngayKetThuc, setNgayKetThuc] = useState("");
    const [moTaLich, setMoTaLich] = useState("");
    const [caLamIds, setCaLamIds] = useState([]); // Danh sách ID ca làm liên kết
    const [dangXuLyLich, setDangXuLyLich] = useState(false);

    useEffect(() => {
        TaiDuLieu();
    }, []);

    async function TaiDuLieu() {
        setDangTai(true);
        setLoi("");
        try {
            const [resCa, resLich] = await Promise.all([
                layDanhSachCaLam(),
                layDanhSachLichLam()
            ]);
            if (resCa.success) setDanhSachCa(resCa.data);
            if (resLich.success) setDanhSachLich(resLich.data);
        } catch (err) {
            setLoi(err.message || "Không thể tải dữ liệu ca làm và lịch làm");
        } finally {
            setDangTai(false);
        }
    }

    function hienThongBao(msg) {
        setThongBao(msg);
        setTimeout(() => setThongBao(""), 4000);
    }

    // ================= XỬ LÝ LỊCH LÀM =================
    function handleThemLich() {
        setCheDoLich("THEM");
        setLichTarget(null);
        setTenLich("");
        setChuKyTuan(2);
        setNgayBatDau("");
        setNgayKetThuc("");
        setMoTaLich("");
        setCaLamIds([]);
        setModalLichOpen(true);
    }

    function handleSuaLich(lich) {
        setCheDoLich("SUA");
        setLichTarget(lich);
        setTenLich(lich.ten_lich || "");
        setChuKyTuan(lich.chu_ky_tuan || 0);
        setNgayBatDau(lich.ngay_bat_dau ? new Date(lich.ngay_bat_dau).toISOString().slice(0, 10) : "");
        setNgayKetThuc(lich.ngay_ket_thuc ? new Date(lich.ngay_ket_thuc).toISOString().slice(0, 10) : "");
        setMoTaLich(lich.mo_ta || "");
        setCaLamIds(lich.ca_lam_list ? lich.ca_lam_list.map(c => c.id) : []);
        setModalLichOpen(true);
    }

    async function handleXoaLich(lich) {
        if (!laAdminOrLeaderKhuVuc) return;
        if (window.confirm(`Bạn có chắc chắn muốn xóa lịch làm việc "${lich.ten_lich}"? Tất cả ca làm liên kết sẽ bị gỡ.`)) {
            try {
                const res = await xoaLichLam(lich.id);
                if (res.success) {
                    hienThongBao(`Đã xóa lịch làm việc "${lich.ten_lich}" thành công!`);
                    TaiDuLieu();
                }
            } catch (err) {
                alert(err.message || "Xóa lịch làm thất bại");
            }
        }
    }

    async function handleXoayCa(lich) {
        if (!laAdminOrLeaderKhuVuc) return;
        const msg = `Bạn có chắc chắn muốn thực hiện ĐẢO CA làm việc?\n\nHành động này sẽ hoán đổi ca làm của tất cả nhân sự đang được phân công trong các ca thuộc lịch này.`;
        if (window.confirm(msg)) {
            try {
                const res = await xoayCaLichLam(lich.id);
                if (res.success) {
                    hienThongBao(res.message || "Đảo ca thành công!");
                    TaiDuLieu();
                }
            } catch (err) {
                alert(err.message || "Xoay ca thất bại!");
            }
        }
    }

    const handleToggleShiftSelect = (id) => {
        if (caLamIds.includes(id)) {
            setCaLamIds(prev => prev.filter(item => item !== id));
        } else {
            setCaLamIds(prev => [...prev, id]);
        }
    };

    async function xuLyLuuLich(e) {
        e.preventDefault();
        setDangXuLyLich(true);
        try {
            const body = {
                ten_lich: tenLich.trim(),
                chu_ky_tuan: Number(chuKyTuan),
                ngay_bat_dau: ngayBatDau || null,
                ngay_ket_thuc: ngayKetThuc || null,
                mo_ta: moTaLich.trim(),
                ca_lam_ids: caLamIds
            };

            let res;
            if (cheDoLich === "THEM") {
                res = await taoLichLam(body);
            } else {
                res = await capNhatLichLam(lichTarget.id, body);
            }

            if (res.success) {
                hienThongBao(cheDoLich === "THEM" ? "Tạo lịch làm việc mới thành công!" : "Cập nhật lịch làm việc thành công!");
                setModalLichOpen(false);
                TaiDuLieu();
            }
        } catch (err) {
            alert(err.message || "Lưu lịch làm việc thất bại");
        } finally {
            setDangXuLyLich(false);
        }
    }

    // ================= XỬ LÝ CA LÀM =================
    function handleThemCa() {
        setCheDo("THEM");
        setCaLamTarget(null);
        setTenCa("");
        setGioBatDau("08:00");
        setGioKetThuc("17:00");
        setLoaiCa("THUONG");
        setLichLamId("");
        setModalOpen(true);
    }

    function handleSuaCa(ca) {
        setCheDo("SUA");
        setCaLamTarget(ca);
        setTenCa(ca.ten_ca || "");
        setGioBatDau(ca.gio_bat_dau ? ca.gio_bat_dau.slice(0, 5) : "");
        setGioKetThuc(ca.gio_ket_thuc ? ca.gio_ket_thuc.slice(0, 5) : "");
        setLoaiCa(ca.loai_ca || "THUONG");
        setLichLamId(ca.lich_lam_id || "");
        setModalOpen(true);
    }

    async function handleXoaCa(ca) {
        if (!laAdminOrLeaderKhuVuc) return;
        if (window.confirm(`Bạn có chắc chắn muốn xóa ca làm việc "${ca.ten_ca}"?`)) {
            try {
                const res = await xoaCaLam(ca.id);
                if (res.success) {
                    hienThongBao(`Đã xóa ca làm việc "${ca.ten_ca}" thành công!`);
                    TaiDuLieu();
                }
            } catch (err) {
                alert(err.message || "Xóa ca làm việc thất bại");
            }
        }
    }

    async function xuLyLuuCa(e) {
        e.preventDefault();
        setDangXuLy(true);
        try {
            const body = {
                ten_ca: tenCa.trim(),
                gio_bat_dau: gioBatDau.includes(":") && gioBatDau.split(":").length === 2 ? `${gioBatDau}:00` : gioBatDau,
                gio_ket_thuc: gioKetThuc.includes(":") && gioKetThuc.split(":").length === 2 ? `${gioKetThuc}:00` : gioKetThuc,
                loai_ca: loaiCa,
                lich_lam_id: lichLamId ? Number(lichLamId) : null
            };

            let res;
            if (cheDo === "THEM") {
                res = await taoCaLam(body);
            } else {
                res = await capNhatCaLam(caLamTarget.id, body);
            }

            if (res.success) {
                hienThongBao(cheDo === "THEM" ? "Tạo ca làm việc mới thành công!" : "Cập nhật ca làm việc thành công!");
                setModalOpen(false);
                TaiDuLieu();
            }
        } catch (err) {
            alert(err.message || "Lưu ca làm việc thất bại");
        } finally {
            setDangXuLy(false);
        }
    }

    const formatNgayVN = (chuoiNgay) => {
        if (!chuoiNgay) return "-";
        return new Date(chuoiNgay).toLocaleDateString("vi-VN");
    };

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div className="tieu-de-khoi">
                    <h2>Quản lý Lịch xoay ca & Ca làm việc</h2>
                    <p style={{ marginTop: "4px" }}>Cấu hình các chu kỳ xoay ca, thời hạn áp dụng, và liên kết các nhóm ca sản xuất trong nhà máy</p>
                </div>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}
            {loi && <div className="thong-bao-loi">{loi}</div>}

            {dangTai ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    Đang tải dữ liệu ca làm và lịch làm...
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    
                    {/* KHỐI 1: CẤU HÌNH LỊCH LÀM VIỆC (SCHEDULES) */}
                    <div className="the-thong-tin">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "16px" }}>📅 Cấu hình Lịch làm việc & Đảo ca tự động</h3>
                            {laAdminOrLeaderKhuVuc && (
                                <button className="nut-chinh" onClick={handleThemLich} style={{ width: "auto", fontSize: "12px", padding: "6px 12px" }}>
                                    + Thêm lịch làm mới
                                </button>
                            )}
                        </div>

                        {danhSachLich.length === 0 ? (
                            <div style={{ padding: "16px", color: "var(--text-muted)", textAlign: "center", fontStyle: "italic" }}>
                                Chưa có lịch làm việc nào được cấu hình.
                            </div>
                        ) : (
                            <div className="bang-du-lieu-wrapper">
                                <table className="bang-du-lieu">
                                    <thead>
                                        <tr>
                                            <th>Tên lịch làm</th>
                                            <th>Thời hạn áp dụng</th>
                                            <th style={{ textAlign: "center" }}>Chu kỳ đảo</th>
                                            <th>Ngày đảo gần nhất</th>
                                            <th>Các ca liên kết</th>
                                            <th style={{ textAlign: "center" }}>Trạng thái</th>
                                            {laAdminOrLeaderKhuVuc && <th style={{ textAlign: "center", width: "260px" }}>Hành động</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {danhSachLich.map((lich) => (
                                            <tr key={lich.id}>
                                                <td>
                                                    <strong>{lich.ten_lich}</strong>
                                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{lich.mo_ta || "Không có mô tả"}</div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: "12px" }}>
                                                        {lich.ngay_bat_dau ? formatNgayVN(lich.ngay_bat_dau) : "Bất đầu"} ➔ {lich.ngay_ket_thuc ? formatNgayVN(lich.ngay_ket_thuc) : "Vô hạn"}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "center" }}>
                                                    {lich.chu_ky_tuan > 0 ? (
                                                        <span style={{ fontWeight: "bold", color: "var(--primary-color)" }}>{lich.chu_ky_tuan} tuần / lần</span>
                                                    ) : (
                                                        <span style={{ color: "var(--text-muted)" }}>Cố định</span>
                                                    )}
                                                </td>
                                                <td>{formatNgayVN(lich.ngay_xoay_gan_nhat)}</td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                        {lich.ca_lam_list && lich.ca_lam_list.length > 0 ? (
                                                            lich.ca_lam_list.map((c) => (
                                                                <span key={c.id} style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", border: "1px solid #e2e8f0" }}>
                                                                    {c.ten_ca}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>Trống</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "center" }}>
                                                    {lich.chu_ky_tuan > 0 ? (
                                                        lich.can_xoay_ca === 1 ? (
                                                            <span style={{ background: "#fee2e2", color: "var(--red)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", border: "1px solid #fca5a5" }}>
                                                                ĐẾN HẠN ĐẢO CA
                                                            </span>
                                                        ) : (
                                                            <span style={{ background: "#dcfce7", color: "var(--green)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                                                                BÌNH THƯỜNG
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Không xoay</span>
                                                    )}
                                                </td>
                                                {laAdminOrLeaderKhuVuc && (
                                                    <td style={{ textAlign: "center" }}>
                                                        {lich.chu_ky_tuan > 0 && lich.ca_lam_list && lich.ca_lam_list.length >= 2 && (
                                                            <button 
                                                                className="nut-hanh-dong" 
                                                                onClick={() => handleXoayCa(lich)} 
                                                                style={{ 
                                                                    padding: "4px 8px", 
                                                                    fontSize: "12px", 
                                                                    backgroundColor: lich.can_xoay_ca === 1 ? "#ea580c" : "#0284c7", 
                                                                    color: "#fff",
                                                                    borderColor: "transparent",
                                                                    marginRight: "6px"
                                                                }}
                                                                title="Hoán đổi các ca làm việc của nhân sự"
                                                            >
                                                                🔄 Đảo ca
                                                            </button>
                                                        )}
                                                        <button className="nut-hanh-dong nut-sua" onClick={() => handleSuaLich(lich)} style={{ padding: "4px 8px", fontSize: "12px" }}>
                                                            Sửa
                                                        </button>
                                                        <button className="nut-hanh-dong nut-xoa" onClick={() => handleXoaLich(lich)} style={{ padding: "4px 8px", fontSize: "12px", marginLeft: "6px" }}>
                                                            Xóa
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* KHỐI 2: ĐỊNH NGHĨA CÁC CA LÀM VIỆC (SHIFTS) */}
                    <div className="the-thong-tin">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "16px" }}>⏰ Định nghĩa các Ca làm việc</h3>
                            {laAdminOrLeaderKhuVuc && (
                                <button className="nut-chinh" onClick={handleThemCa} style={{ width: "auto", fontSize: "12px", padding: "6px 12px" }}>
                                    + Thêm ca làm mới
                                </button>
                            )}
                        </div>

                        {danhSachCa.length === 0 ? (
                            <div style={{ padding: "16px", color: "var(--text-muted)", textAlign: "center", fontStyle: "italic" }}>
                                Chưa có ca làm việc nào được tạo.
                            </div>
                        ) : (
                            <div className="bang-du-lieu-wrapper">
                                <table className="bang-du-lieu">
                                    <thead>
                                        <tr>
                                            <th>Tên ca làm việc</th>
                                            <th>Giờ bắt đầu</th>
                                            <th>Giờ kết thúc</th>
                                            <th>Thuộc Lịch làm việc</th>
                                            <th>Phân loại</th>
                                            {laAdminOrLeaderKhuVuc && <th style={{ textAlign: "center", width: "150px" }}>Hành động</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {danhSachCa.map((ca) => (
                                            <tr key={ca.id}>
                                                <td><strong>{ca.ten_ca}</strong></td>
                                                <td>{ca.gio_bat_dau}</td>
                                                <td>{ca.gio_ket_thuc}</td>
                                                <td>
                                                    {ca.ten_lich ? (
                                                        <span style={{ fontWeight: 600, color: "var(--charcoal)" }}>{ca.ten_lich}</span>
                                                    ) : (
                                                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa liên kết lịch</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {ca.loai_ca === "TANG_CA" ? (
                                                        <span style={{ background: "#fff7ed", color: "#ea580c", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "bold" }}>
                                                            TĂNG CA (OT)
                                                        </span>
                                                    ) : (
                                                        <span style={{ background: "#f0fdf4", color: "var(--green)", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "bold" }}>
                                                            CA THƯỜNG
                                                        </span>
                                                    )}
                                                </td>
                                                {laAdminOrLeaderKhuVuc && (
                                                    <td style={{ textAlign: "center" }}>
                                                        <button className="nut-hanh-dong nut-sua" onClick={() => handleSuaCa(ca)} style={{ padding: "4px 8px", fontSize: "12px" }}>
                                                            Sửa
                                                        </button>
                                                        <button className="nut-hanh-dong nut-xoa" onClick={() => handleXoaCa(ca)} style={{ padding: "4px 8px", fontSize: "12px", marginLeft: "6px" }}>
                                                            Xóa
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* MODAL THÊM / SỬA LỊCH LÀM VIỆC */}
            {modalLichOpen && (
                <Modal
                    isOpen={modalLichOpen}
                    onClose={() => setModalLichOpen(false)}
                    title={cheDoLich === "THEM" ? "Tạo lịch làm việc mới" : "Chỉnh sửa lịch làm việc"}
                    footer={
                        <>
                            <button type="button" className="nut-huy" onClick={() => setModalLichOpen(false)} disabled={dangXuLyLich}>Hủy</button>
                            <button type="submit" form="form-lich-lam" className="nut-chinh" style={{ width: "auto" }} disabled={dangXuLyLich}>
                                {dangXuLyLich ? "Đang lưu..." : "Lưu lịch làm"}
                            </button>
                        </>
                    }
                >
                    <form id="form-lich-lam" onSubmit={xuLyLuuLich}>
                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_ten_lich">Tên lịch làm việc *</label>
                            <input
                                id="modal_ten_lich"
                                type="text"
                                value={tenLich}
                                onChange={(e) => setTenLich(e.target.value)}
                                placeholder="Ví dụ: Lịch xoay ca 2 tuần, Lịch hành chính..."
                                required
                            />
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div className="nhom-o-nhap" style={{ flex: 1 }}>
                                <label htmlFor="modal_ngay_bat_dau">Ngày bắt đầu áp dụng</label>
                                <input
                                    id="modal_ngay_bat_dau"
                                    type="date"
                                    value={ngayBatDau}
                                    onChange={(e) => setNgayBatDau(e.target.value)}
                                />
                            </div>

                            <div className="nhom-o-nhap" style={{ flex: 1 }}>
                                <label htmlFor="modal_ngay_ket_thuc">Ngày kết thúc áp dụng</label>
                                <input
                                    id="modal_ngay_ket_thuc"
                                    type="date"
                                    value={ngayKetThuc}
                                    onChange={(e) => setNgayKetThuc(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_chu_ky_tuan">Chu kỳ đảo ca tự động *</label>
                            <select
                                id="modal_chu_ky_tuan"
                                value={chuKyTuan}
                                onChange={(e) => setChuKyTuan(Number(e.target.value))}
                                required
                            >
                                <option value="0">Cố định (Không đảo ca)</option>
                                <option value="1">Xoay ca sau mỗi 1 tuần</option>
                                <option value="2">Xoay ca sau mỗi 2 tuần (Mặc định)</option>
                                <option value="3">Xoay ca sau mỗi 3 tuần</option>
                                <option value="4">Xoay ca sau mỗi 4 tuần</option>
                            </select>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                Hệ thống sẽ đối chiếu với ngày đảo ca gần nhất để đưa ra cảnh báo đến hạn.
                            </p>
                        </div>

                        {/* PHẦN CHỌN CÁC CA LÀM VIỆC HIỆN CÓ ĐỂ ADD VÀO LỊCH */}
                        <div className="nhom-o-nhap">
                            <label style={{ marginBottom: "8px", display: "block", fontWeight: "600" }}>
                                Thêm ca làm việc hiện có vào lịch này
                            </label>
                            {danhSachCa.length === 0 ? (
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                    Chưa có ca làm việc nào được định nghĩa trong hệ thống để chọn.
                                </p>
                            ) : (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                    gap: "8px",
                                    maxHeight: "150px",
                                    overflowY: "auto",
                                    padding: "10px",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "4px",
                                    backgroundColor: "#f8fafc"
                                }}>
                                    {danhSachCa.map((ca) => (
                                        <label key={ca.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={caLamIds.includes(ca.id)}
                                                onChange={() => handleToggleShiftSelect(ca.id)}
                                            />
                                            <span>
                                                <strong>{ca.ten_ca}</strong> ({ca.gio_bat_dau.slice(0, 5)} - {ca.gio_ket_thuc.slice(0, 5)})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                * Các ca được chọn sẽ được gán và tham gia vào chu kỳ xoay ca luân phiên của lịch này.
                            </p>
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_mo_ta_lich">Mô tả lịch</label>
                            <textarea
                                id="modal_mo_ta_lich"
                                value={moTaLich}
                                onChange={(e) => setMoTaLich(e.target.value)}
                                placeholder="Ghi chú chi tiết hoặc mô tả cho lịch này..."
                                rows="3"
                                style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                            />
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL THÊM / SỬA CA LÀM VIỆC */}
            {modalOpen && (
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={cheDo === "THEM" ? "Tạo ca làm việc mới" : "Chỉnh sửa ca làm việc"}
                    footer={
                        <>
                            <button type="button" className="nut-huy" onClick={() => setModalOpen(false)} disabled={dangXuLy}>Hủy</button>
                            <button type="submit" form="form-ca-lam" className="nut-chinh" style={{ width: "auto" }} disabled={dangXuLy}>
                                {dangXuLy ? "Đang lưu..." : "Lưu ca làm"}
                            </button>
                        </>
                    }
                >
                    <form id="form-ca-lam" onSubmit={xuLyLuuCa}>
                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_ten_ca">Tên ca làm việc *</label>
                            <input
                                id="modal_ten_ca"
                                type="text"
                                value={tenCa}
                                onChange={(e) => setTenCa(e.target.value)}
                                placeholder="Ví dụ: Ca A, Ca B, Ca tăng ca..."
                                required
                            />
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div className="nhom-o-nhap" style={{ flex: 1 }}>
                                <label htmlFor="modal_gio_bat_dau">Giờ bắt đầu *</label>
                                <input
                                    id="modal_gio_bat_dau"
                                    type="time"
                                    value={gioBatDau}
                                    onChange={(e) => setGioBatDau(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="nhom-o-nhap" style={{ flex: 1 }}>
                                <label htmlFor="modal_gio_ket_thuc">Giờ kết thúc *</label>
                                <input
                                    id="modal_gio_ket_thuc"
                                    type="time"
                                    value={gioKetThuc}
                                    onChange={(e) => setGioKetThuc(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_lich_lam_id">Thuộc Lịch làm việc</label>
                            <select
                                id="modal_lich_lam_id"
                                value={lichLamId}
                                onChange={(e) => setLichLamId(e.target.value)}
                            >
                                <option value="">-- Chọn lịch làm việc --</option>
                                {danhSachLich.map(l => (
                                    <option key={l.id} value={l.id}>{l.ten_lich}</option>
                                ))}
                            </select>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                Liên kết ca này vào một lịch làm việc để áp dụng chu kỳ xoay ca.
                            </p>
                        </div>

                        <div className="nhom-o-nhap">
                            <label htmlFor="modal_loai_ca">Phân loại ca *</label>
                            <select
                                id="modal_loai_ca"
                                value={loaiCa}
                                onChange={(e) => setLoaiCa(e.target.value)}
                                required
                            >
                                <option value="THUONG">Ca thường</option>
                                <option value="TANG_CA">Ca tăng ca (OT)</option>
                            </select>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
