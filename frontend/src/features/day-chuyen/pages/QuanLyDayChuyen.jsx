import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCrud } from "../../../hooks/useCrud.js";
import { layDanhSachDayChuyen, taoDayChuyen, capNhatDayChuyen, xoaDayChuyen } from "../services/dayChuyen.service.js";
import ModalDayChuyen from "../components/ModalDayChuyen.jsx";
import LichSuVaThongKeEmbedded from "../../../components/common/LichSuVaThongKeEmbedded.jsx";

export default function QuanLyDayChuyen() {
    const { nguoiDung } = useAuth();
    const navigate = useNavigate();
    
    const laAdmin = nguoiDung && nguoiDung.role === "ADMIN";
    const laAdminOrLeaderKhuVuc = nguoiDung && ["ADMIN", "LEADER_KHU_VUC"].includes(nguoiDung.role);

    const {
        danhSach,
        dangTai,
        loi,
        thongBao,
        modalHienThi,
        modalCheDo,
        dangChon,
        taiDanhSach,
        hienModalThem,
        hienModalSua,
        dongModal,
        xuLyLuu,
        xuLyXoa
    } = useCrud(layDanhSachDayChuyen, taoDayChuyen, capNhatDayChuyen, xoaDayChuyen, "dây chuyền");

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar">
                <div className="tieu-de-khoi">
                    <h2>Quản lý dây chuyền sản xuất</h2>
                    <p>Theo dõi tình hình định biên nhân sự trực quan và phân công trực nhật dây chuyền</p>
                </div>
                {laAdminOrLeaderKhuVuc && (
                    <button className="nut-chinh nut-them-moi" onClick={hienModalThem}>
                        + Thêm dây chuyền mới
                    </button>
                )}
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}
            {loi && <div className="thong-bao-loi">{loi}</div>}

            {/* SƠ ĐỒ TRỰC QUAN CÁC LINE SẢN XUẤT (VISUAL DIAGRAM) */}
            <div className="the-thong-tin" style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    ⛓️ Sơ đồ tổng quan nhân sự các Line sản xuất (Hôm nay)
                </h3>
                {dangTai ? (
                    <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "13px" }}>Đang tải sơ đồ...</p>
                ) : danhSach.length === 0 ? (
                    <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "13px" }}>Chưa có dây chuyền nào để hiển thị sơ đồ.</p>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                        {danhSach.map((dc) => {
                            const yeuCau = Number(dc.total_yeu_cau) || 0;
                            const hienCo = Number(dc.total_hien_co) || 0;
                            const thieu = yeuCau > hienCo ? yeuCau - hienCo : 0;
                            const phanTram = yeuCau > 0 ? Math.min(Math.round((hienCo / yeuCau) * 100), 100) : 0;
                            const trangThaiLuc = dc.trang_thai === "TAM_DUNG" ? "TAM_DUNG" : thieu > 0 ? "THIEU" : "DU";

                            return (
                                <div 
                                    key={dc.id} 
                                    className="so-do-line-card" 
                                    style={{
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        padding: "16px",
                                        background: dc.trang_thai === "TAM_DUNG" ? "#f1f5f9" : "#ffffff",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                        borderLeft: `5px solid ${dc.trang_thai === "TAM_DUNG" ? "#94a3b8" : thieu > 0 ? "var(--red)" : "var(--green)"}`,
                                        cursor: "pointer"
                                    }}
                                    onClick={() => navigate(`/admin/day-chuyen/${dc.id}`)}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                                        <h4 style={{ margin: 0, fontSize: "15px", color: "var(--charcoal)" }}>{dc.ten_day_chuyen}</h4>
                                        <span style={{
                                            fontSize: "10px",
                                            fontWeight: "bold",
                                            padding: "2px 8px",
                                            borderRadius: "999px",
                                            backgroundColor: dc.trang_thai === "TAM_DUNG" ? "#cbd5e1" : thieu > 0 ? "#fee2e2" : "#dcfce7",
                                            color: dc.trang_thai === "TAM_DUNG" ? "#475569" : thieu > 0 ? "var(--red)" : "var(--green)"
                                        }}>
                                            {dc.trang_thai === "TAM_DUNG" ? "Tạm dừng" : thieu > 0 ? `Thiếu ${thieu}` : "Đủ nhân sự"}
                                        </span>
                                    </div>
                                    <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                                        Khu vực: <strong>{dc.ten_khu_vuc}</strong>
                                    </p>
                                    <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                                        Leader: <strong>{dc.ten_leader || "Chưa gán"}</strong>
                                    </p>

                                    <div style={{ marginTop: "12px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                                            <span>Định biên: {hienCo}/{yeuCau} người</span>
                                            <span>{phanTram}%</span>
                                        </div>
                                        <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                            <div style={{
                                                width: `${phanTram}%`,
                                                height: "100%",
                                                backgroundColor: dc.trang_thai === "TAM_DUNG" ? "#94a3b8" : thieu > 0 ? "#f59e0b" : "var(--green)"
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* BẢNG DANH SÁCH CHI TIẾT */}
            <div className="bang-du-lieu-wrapper">
                {dangTai ? (
                    <div className="man-hinh-dang-tai">Đang tải danh sách dây chuyền...</div>
                ) : (
                    <table className="bang-du-lieu">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên dây chuyền</th>
                                <th>Thuộc khu vực</th>
                                <th>Trưởng dây chuyền (Leader)</th>
                                <th>Nhân sự (Hiện tại / Định biên)</th>
                                <th>Trạng thái định biên</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: "center" }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {danhSach.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                        Chưa có dây chuyền nào được tạo
                                    </td>
                                </tr>
                            ) : (
                                danhSach.map((dc) => {
                                    const yeuCau = Number(dc.total_yeu_cau) || 0;
                                    const hienCo = Number(dc.total_hien_co) || 0;
                                    const thieu = yeuCau > hienCo ? yeuCau - hienCo : 0;
                                    return (
                                        <tr key={dc.id}>
                                            <td>{dc.id}</td>
                                            <td><strong>{dc.ten_day_chuyen}</strong></td>
                                            <td>{dc.ten_khu_vuc}</td>
                                            <td>
                                                {dc.ten_leader ? (
                                                    <span style={{ fontWeight: 600, color: "var(--amber-dark)" }}>{dc.ten_leader}</span>
                                                ) : (
                                                    <span className="text-unspecified">Chưa gán leader</span>
                                                )}
                                            </td>
                                            <td>
                                                <strong>{hienCo}</strong> / {yeuCau} người
                                            </td>
                                            <td>
                                                {dc.trang_thai === "TAM_DUNG" ? (
                                                    <span style={{ color: "#64748b", fontWeight: "bold", fontSize: "12px" }}>-</span>
                                                ) : thieu > 0 ? (
                                                    <span style={{ color: "var(--red)", fontWeight: "bold", fontSize: "12px" }}>⚠️ Thiếu {thieu} người</span>
                                                ) : (
                                                    <span style={{ color: "var(--green)", fontWeight: "bold", fontSize: "12px" }}>✅ Đủ nhân sự</span>
                                                )}
                                            </td>
                                            <td>
                                                {dc.trang_thai === "HOAT_DONG" ? (
                                                    <span className="trang-thai-badge active">Hoạt động</span>
                                                ) : (
                                                    <span className="trang-thai-badge locked">Tạm dừng</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <div className="nhom-nut-hanh-dong">
                                                    <button 
                                                        className="nut-hanh-dong" 
                                                        onClick={() => navigate(`/admin/day-chuyen/${dc.id}`)}
                                                        title="Xem chi tiết phân công nhân sự"
                                                        style={{ backgroundColor: "#e2f0fd", color: "#1e3a8a", border: "1px solid #cbd5e0" }}
                                                    >
                                                        Chi tiết
                                                    </button>
                                                    {laAdminOrLeaderKhuVuc && (
                                                        <button 
                                                            className="nut-hanh-dong nut-sua" 
                                                            onClick={() => hienModalSua(dc)}
                                                            title="Sửa thông tin dây chuyền"
                                                        >
                                                            Sửa
                                                        </button>
                                                    )}
                                                    {laAdmin && (
                                                        <button 
                                                            className="nut-hanh-dong nut-xoa" 
                                                            onClick={() => xuLyXoa(dc.id, dc.ten_day_chuyen)}
                                                            title="Xóa dây chuyền"
                                                        >
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <ModalDayChuyen
                isOpen={modalHienThi}
                cheDo={modalCheDo}
                dayChuyen={dangChon}
                onClose={dongModal}
                onSave={xuLyLuu}
            />

            {/* Embedded Audit History & Statistics for Dây chuyền */}
            <LichSuVaThongKeEmbedded
                loaiDoiTuong="DAY_CHUYEN"
                tieuDe="Nhật ký & Lịch sử Dây chuyền sản xuất"
                moTa="Lưu vết thời điểm tạo dây chuyền, điều chuyển leader, thay đổi trạng thái và nhật ký xóa dây chuyền"
            />
        </div>
    );
}
