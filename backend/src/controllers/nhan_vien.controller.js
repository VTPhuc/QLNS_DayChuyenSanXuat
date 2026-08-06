import NhanVienService from "../services/nhan_vien.service.js";
import ApiError from "../utils/api_error.js";

/**
 * Controller xử lý các yêu cầu liên quan đến nhân viên
 */
class NhanVienController {
    static async layDanhSachNhanVien(req, res, next) {
        try {
            const { q, day_chuyen_id, ca_lam_id, trang_thai } = req.query;
            const data = await NhanVienService.layDanhSachNhanVien({ q, day_chuyen_id, ca_lam_id, trang_thai });
            return res.json({
                success: true,
                message: "Lấy danh sách nhân viên thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async layChungChiNhanVien(req, res, next) {
        try {
            const { id } = req.params;
            const data = await NhanVienService.layChungChiNhanVien(id);
            return res.json({
                success: true,
                message: "Lấy danh sách chứng chỉ nhân viên thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async layLichSuPhanCong(req, res, next) {
        try {
            const { id } = req.params;
            const data = await NhanVienService.layLichSuPhanCong(id);
            return res.json({
                success: true,
                message: "Lấy lịch sử phân công nhân viên thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatNhanVien(req, res, next) {
        try {
            const { id } = req.params;
            const { ho_ten, gioi_tinh, so_dien_thoai, day_chuyen_id, chuc_vu, trang_thai } = req.body;
            const thanhCong = await NhanVienService.capNhatNhanVien(id, {
                ho_ten,
                gioi_tinh,
                so_dien_thoai,
                day_chuyen_id,
                chuc_vu,
                trang_thai
            });
            if (thanhCong) {
                return res.json({
                    success: true,
                    message: "Cập nhật nhân viên thành công",
                    data: null
                });
            }
            throw new ApiError(400, "Cập nhật nhân viên thất bại");
        } catch (err) {
            next(err);
        }
    }

    static async xoaNhanVien(req, res, next) {
        try {
            const { id } = req.params;
            const thanhCong = await NhanVienService.xoaNhanVien(id);
            if (thanhCong) {
                return res.json({
                    success: true,
                    message: "Xóa nhân viên thành công",
                    data: null
                });
            }
            throw new ApiError(400, "Xóa nhân viên thất bại");
        } catch (err) {
            next(err);
        }
    }
}

export default NhanVienController;
