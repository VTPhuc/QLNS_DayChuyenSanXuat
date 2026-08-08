import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCrud } from "../../../hooks/useCrud.js";
import { layDanhSachKhuVuc, taoKhuVuc, capNhatKhuVuc, xoaKhuVuc } from "../services/khuVuc.service.js";
import ModalKhuVuc from "../components/ModalKhuVuc.jsx";
import LichSuVaThongKeEmbedded from "../../../components/common/LichSuVaThongKeEmbedded.jsx";

export default function QuanLyKhuVuc() {
    const { nguoiDung } = useAuth();
    const navigate = useNavigate();
    
    const laAdmin = nguoiDung && nguoiDung.role === "ADMIN";

    const {
        danhSach,
        dangTai,
        loi,
        thongBao,
        modalHienThi,
        modalCheDo,
        dangChon,
        hienModalThem,
        hienModalSua,
        dongModal,
        xuLyLuu,
        xuLyXoa
    } = useCrud(layDanhSachKhuVuc, taoKhuVuc, capNhatKhuVuc, xoaKhuVuc, "khu vực");

    return (
        <div className="noi-dung-admin">
            <div className="admin-header-bar">
                <div className="tieu-de-khoi">
                    <h2>Quản lý khu vực nhà máy</h2>
                    <p>Danh sách khu vực, khách hàng liên kết và leader phụ trách quản lý</p>
                </div>
                {laAdmin && (
                    <button className="nut-chinh nut-them-moi" onClick={hienModalThem}>
                        + Thêm khu vực mới
                    </button>
                )}
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">{thongBao}</div>}
            {loi && <div className="thong-bao-loi">{loi}</div>}

            <div className="bang-du-lieu-wrapper">
                {dangTai ? (
                    <div className="man-hinh-dang-tai">Đang tải danh sách khu vực...</div>
                ) : (
                    <table className="bang-du-lieu">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên khu vực</th>
                                <th>Khách hàng liên kết</th>
                                <th>Leader phụ trách</th>
                                <th>Mã số nhân viên</th>
                                {laAdmin && <th style={{ textAlign: "center" }}>Hành động</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {danhSach.length === 0 ? (
                                <tr>
                                    <td colSpan={laAdmin ? 6 : 5} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                                        Chưa có khu vực nào được tạo
                                    </td>
                                </tr>
                            ) : (
                                danhSach.map((kv) => (
                                    <tr key={kv.id}>
                                        <td>{kv.id}</td>
                                        <td><strong>{kv.ten_khu_vuc}</strong></td>
                                        <td>{kv.ten_khach_hang}</td>
                                        <td>
                                            {kv.ten_leader ? (
                                                <span style={{ fontWeight: 600, color: "var(--amber-dark)" }}>{kv.ten_leader}</span>
                                            ) : (
                                                <span className="text-unspecified">Chưa gán leader</span>
                                            )}
                                        </td>
                                        <td>{kv.ma_leader || "-"}</td>
                                        {laAdmin && (
                                            <td style={{ textAlign: "center" }}>
                                                <div className="nhom-nut-hanh-dong">
                                                    <button 
                                                        className="nut-hanh-dong nut-sua" 
                                                        onClick={() => hienModalSua(kv)}
                                                        title="Sửa thông tin khu vực"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button 
                                                        className="nut-hanh-dong nut-xoa" 
                                                        onClick={() => xuLyXoa(kv.id, kv.ten_khu_vuc)}
                                                        title="Xóa khu vực"
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

            <ModalKhuVuc
                isOpen={modalHienThi}
                cheDo={modalCheDo}
                khuVuc={dangChon}
                onClose={dongModal}
                onSave={xuLyLuu}
            />

            {/* Embedded Audit History & Statistics for Khu vực */}
            <LichSuVaThongKeEmbedded
                loaiDoiTuong="KHU_VUC"
                tieuDe="Nhật ký & Lịch sử Khu vực"
                moTa="Ghi nhận mốc thời gian thêm khu vực, leader phụ trách, khách hàng liên kết và lịch sử xóa khu vực"
            />
        </div>
    );
}
