import KhuVucService from "../services/khu_vuc.service.js";
import ApiError from "../utils/api_error.js";

/**
 * Controller xử lý các yêu cầu liên quan đến khu vực
 */
class KhuVucController {
    static async layDanhSachKhuVuc(req, res, next) {
        try {
            const data = await KhuVucService.layDanhSachKhuVuc();
            return res.json({ success: true, message: "Lấy danh sách khu vực thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layDanhSachLeaderKhuVuc(req, res, next) {
        try {
            const data = await KhuVucService.layDanhSachLeaderKhuVuc();
            return res.json({ success: true, message: "Lấy danh sách leader khu vực thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layDanhSachKhachHang(req, res, next) {
        try {
            const data = await KhuVucService.layDanhSachKhachHang();
            return res.json({ success: true, message: "Lấy danh sách khách hàng thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layKhuVucTheoId(req, res, next) {
        try {
            const data = await KhuVucService.timKhuVucTheoId(req.params.id);
            if (!data) {
                throw new ApiError(404, "Không tìm thấy khu vực");
            }
            return res.json({ success: true, message: "Lấy chi tiết khu vực thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async taoKhuVuc(req, res, next) {
        try {
            const { ten_khu_vuc, khach_hang_id, leader_id } = req.body;
            const data = await KhuVucService.taoKhuVuc({ ten_khu_vuc, khach_hang_id, leader_id, nguoiDung: req.nguoiDung });
            return res.status(201).json({ success: true, message: "Tạo khu vực thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatKhuVuc(req, res, next) {
        try {
            const { ten_khu_vuc, khach_hang_id, leader_id } = req.body;
            const data = await KhuVucService.capNhatKhuVuc(req.params.id, { ten_khu_vuc, khach_hang_id, leader_id, nguoiDung: req.nguoiDung });
            return res.json({ success: true, message: "Cập nhật khu vực thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async xoaKhuVuc(req, res, next) {
        try {
            await KhuVucService.xoaKhuVuc(req.params.id, req.nguoiDung);
            return res.json({ success: true, message: "Xóa khu vực thành công", data: null });
        } catch (err) {
            next(err);
        }
    }

    static async layBanDoKhuVuc(req, res, next) {
        try {
            const data = await KhuVucService.layBanDoKhuVuc(req.params.id);
            return res.json({ success: true, message: "Lấy bản đồ khu vực thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async luuBanDoKhuVuc(req, res, next) {
        try {
            await KhuVucService.luuBanDoKhuVuc(req.params.id, req.body);
            return res.json({ success: true, message: "Đã lưu sơ đồ bản đồ khu vực thành công", data: null });
        } catch (err) {
            next(err);
        }
    }
}

export default KhuVucController;
