import TangCaService from "../services/tang_ca.service.js";

class TangCaController {
    // ================= QUẢN LÝ ĐĂNG KÝ TĂNG CA =================
    static async layDanhSachUngVienTangCa(req, res, next) {
        try {
            const { ngay, ca_lam_id, day_chuyen_ids, q } = req.query;
            const data = await TangCaService.layDanhSachUngVienTangCa({
                ngay,
                ca_lam_id,
                day_chuyen_ids,
                q,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: "Lấy danh sách ứng viên sẵn sàng tăng ca thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layDanhSachDangKyTangCa(req, res, next) {
        try {
            const { ngay, day_chuyen_id, ca_lam_id, trang_thai, q } = req.query;
            const data = await TangCaService.layDanhSachDangKyTangCa({
                ngay,
                day_chuyen_id,
                ca_lam_id,
                trang_thai,
                q,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: "Lấy danh sách đăng ký tăng ca thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async taoDangKyTangCa(req, res, next) {
        try {
            const { nhan_vien_ids, ca_lam_id, ngay, trang_thai, chi_tiet_day_chuyen } = req.body;
            const nguoiThucHien = req.nguoiDung ? (req.nguoiDung.ho_ten || req.nguoiDung.ten_dang_nhap) : "Hệ thống";
            const roleNguoiThucHien = req.nguoiDung ? req.nguoiDung.role : "ADMIN";

            const data = await TangCaService.taoDangKyTangCa({
                nhan_vien_ids,
                ca_lam_id,
                ngay,
                trang_thai,
                chi_tiet_day_chuyen,
                nguoi_thuc_hien: nguoiThucHien,
                role_nguoi_thuc_hien: roleNguoiThucHien,
                nguoiDung: req.nguoiDung
            });
            return res.status(201).json({ success: true, message: `Đã đăng ký tăng ca thành công cho ${data.successCount} nhân viên`, data });
        } catch (err) {
            next(err);
        }
    }

    static async duyetDangKyTangCa(req, res, next) {
        try {
            const { ids, trang_thai } = req.body;
            const nguoiThucHien = req.nguoiDung ? (req.nguoiDung.ho_ten || req.nguoiDung.ten_dang_nhap) : "Hệ thống";
            const roleNguoiThucHien = req.nguoiDung ? req.nguoiDung.role : "ADMIN";

            const data = await TangCaService.duyetDangKyTangCa({
                ids,
                trang_thai,
                nguoi_thuc_hien: nguoiThucHien,
                role_nguoi_thuc_hien: roleNguoiThucHien,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: "Cập nhật trạng thái tăng ca thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async xoaDangKyTangCa(req, res, next) {
        try {
            const { id } = req.params;
            const nguoiThucHien = req.nguoiDung ? (req.nguoiDung.ho_ten || req.nguoiDung.ten_dang_nhap) : "Hệ thống";
            const roleNguoiThucHien = req.nguoiDung ? req.nguoiDung.role : "ADMIN";

            await TangCaService.xoaDangKyTangCa(id, nguoiThucHien, roleNguoiThucHien, req.nguoiDung);
            return res.json({ success: true, message: "Xóa đăng ký tăng ca thành công", data: null });
        } catch (err) {
            next(err);
        }
    }

    // ================= PHÂN BỔ NHÂN SỰ KHI TĂNG CA =================
    static async layDanhSachNhanSuTangCaChoPhanBo(req, res, next) {
        try {
            const { ngay, ca_lam_id, day_chuyen_id } = req.query;
            const data = await TangCaService.layDanhSachNhanSuTangCaChoPhanBo({
                ngay,
                ca_lam_id,
                day_chuyen_id,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: "Lấy danh sách nhân sự sẵn sàng phân bổ tăng ca thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async phanBoNhanSuTangCa(req, res, next) {
        try {
            const { nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay } = req.body;
            const nguoiThucHien = req.nguoiDung ? (req.nguoiDung.ho_ten || req.nguoiDung.ten_dang_nhap) : "Hệ thống";
            const roleNguoiThucHien = req.nguoiDung ? req.nguoiDung.role : "ADMIN";

            const data = await TangCaService.phanBoNhanSuTangCa({
                nhan_vien_id,
                day_chuyen_id,
                cong_doan_id,
                ca_lam_id,
                ngay,
                nguoi_thuc_hien: nguoiThucHien,
                role_nguoi_thuc_hien: roleNguoiThucHien,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: "Phân bổ nhân sự tăng ca thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async goPhanBoTangCa(req, res, next) {
        try {
            const { nhan_vien_id, ca_lam_id, ngay } = req.body;
            const nguoiThucHien = req.nguoiDung ? (req.nguoiDung.ho_ten || req.nguoiDung.ten_dang_nhap) : "Hệ thống";
            const roleNguoiThucHien = req.nguoiDung ? req.nguoiDung.role : "ADMIN";

            await TangCaService.goPhanBoTangCa({
                nhan_vien_id,
                ca_lam_id,
                ngay,
                nguoi_thuc_hien: nguoiThucHien,
                role_nguoi_thuc_hien: roleNguoiThucHien,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: "Đã gỡ phân bổ nhân sự tăng ca", data: null });
        } catch (err) {
            next(err);
        }
    }

    static async tuDongPhanBoTangCa(req, res, next) {
        try {
            const { day_chuyen_id, ca_lam_id, ngay } = req.body;
            const nguoiThucHien = req.nguoiDung ? (req.nguoiDung.ho_ten || req.nguoiDung.ten_dang_nhap) : "Hệ thống";
            const roleNguoiThucHien = req.nguoiDung ? req.nguoiDung.role : "ADMIN";

            const data = await TangCaService.tuDongPhanBoTangCa({
                day_chuyen_id,
                ca_lam_id,
                ngay,
                nguoi_thuc_hien: nguoiThucHien,
                role_nguoi_thuc_hien: roleNguoiThucHien,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: `Tự động phân bổ thành công ${data.assignedCount} nhân sự tăng ca`, data });
        } catch (err) {
            next(err);
        }
    }

    // ================= THỐNG KÊ LỊCH SỬ TĂNG CA & PHÂN BỔ =================
    static async layLichSuTangCa(req, res, next) {
        try {
            const { ngay, tu_ngay, den_ngay, thang, nam, loai_doi_tuong, hanh_dong, q } = req.query;
            const data = await TangCaService.layLichSuTangCa({
                ngay,
                tu_ngay,
                den_ngay,
                thang,
                nam,
                loai_doi_tuong,
                hanh_dong,
                q,
                nguoiDung: req.nguoiDung
            });
            return res.json({ success: true, message: "Lấy lịch sử tăng ca thành công", data });
        } catch (err) {
            next(err);
        }
    }
}

export default TangCaController;
