import ChungChiService from "../services/chung_chi.service.js";

class ChungChiController {
    // ================= DÂN MỤC CHỨNG CHỈ =================
    static async layDanhSachChungChi(req, res, next) {
        try {
            const { q } = req.query;
            const data = await ChungChiService.layDanhSachChungChi({ q });
            return res.json({ success: true, message: "Lấy danh sách chứng chỉ thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async layChungChiTheoId(req, res, next) {
        try {
            const { id } = req.params;
            const data = await ChungChiService.layChungChiTheoId(id);
            if (!data) {
                return res.status(404).json({ success: false, message: "Không tìm thấy chứng chỉ", data: null });
            }
            return res.json({ success: true, message: "Lấy thông tin chứng chỉ thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async taoChungChi(req, res, next) {
        try {
            const { ten_chung_chi, mo_ta } = req.body;
            const data = await ChungChiService.taoChungChi({ ten_chung_chi, mo_ta });
            return res.status(201).json({ success: true, message: "Thêm chứng chỉ mới thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatChungChi(req, res, next) {
        try {
            const { id } = req.params;
            const { ten_chung_chi, mo_ta } = req.body;
            const data = await ChungChiService.capNhatChungChi(id, { ten_chung_chi, mo_ta });
            return res.json({ success: true, message: "Cập nhật chứng chỉ thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async xoaChungChi(req, res, next) {
        try {
            const { id } = req.params;
            await ChungChiService.xoaChungChi(id);
            return res.json({ success: true, message: "Xóa chứng chỉ thành công", data: null });
        } catch (err) {
            next(err);
        }
    }

    // ================= CHỨNG CHỈ NHÂN VIÊN =================
    static async layDanhSachChungChiNhanVien(req, res, next) {
        try {
            const { nhan_vien_id, chung_chi_id, trang_thai, q } = req.query;
            const data = await ChungChiService.layDanhSachChungChiNhanVien({
                nhan_vien_id,
                chung_chi_id,
                trang_thai,
                q
            });
            return res.json({ success: true, message: "Lấy danh sách chứng chỉ nhân viên thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async ganChungChiNhanVien(req, res, next) {
        try {
            const { nhan_vien_id, nhan_vien_ids, chung_chi_id, cap_do, ngay_cap, ngay_het_han, trang_thai } = req.body;
            const data = await ChungChiService.ganChungChiNhanVien({
                nhan_vien_id,
                nhan_vien_ids,
                chung_chi_id,
                cap_do,
                ngay_cap,
                ngay_het_han,
                trang_thai
            });
            return res.json({ success: true, message: `Gán chứng chỉ thành công cho ${data.successCount || 1} nhân viên`, data });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatChungChiNhanVien(req, res, next) {
        try {
            const { id } = req.params;
            const { cap_do, ngay_cap, ngay_het_han, trang_thai } = req.body;
            const data = await ChungChiService.capNhatChungChiNhanVien(id, {
                cap_do,
                ngay_cap,
                ngay_het_han,
                trang_thai
            });
            return res.json({ success: true, message: "Cập nhật chứng chỉ nhân viên thành công", data });
        } catch (err) {
            next(err);
        }
    }

    static async xoaChungChiNhanVien(req, res, next) {
        try {
            const { id } = req.params;
            await ChungChiService.xoaChungChiNhanVien(id);
            return res.json({ success: true, message: "Thu hồi chứng chỉ nhân viên thành công", data: null });
        } catch (err) {
            next(err);
        }
    }
}

export default ChungChiController;
