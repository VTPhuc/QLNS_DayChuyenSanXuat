import AdminService from "../services/admin.service.js";
import * as XLSX from "xlsx";
import ApiError from "../utils/api_error.js";

/**
 * Controller xử lý các tác vụ quản trị của Admin
 */
class AdminController {
    static async layDanhSachTaiKhoan(req, res, next) {
        try {
            const data = await AdminService.layDanhSachTaiKhoan();
            return res.json({
                success: true,
                message: "Lấy danh sách tài khoản thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async taoTaiKhoan(req, res, next) {
        try {
            const { ten_dang_nhap, mat_khau, email, role, ho_ten, so_dien_thoai, gioi_tinh, day_chuyen_id, ca_lam_id, dia_chi, ngay_sinh, co_xoay_ca } = req.body;
            const data = await AdminService.taoTaiKhoan({
                ten_dang_nhap,
                mat_khau,
                email,
                role,
                ho_ten,
                so_dien_thoai,
                gioi_tinh,
                day_chuyen_id,
                ca_lam_id,
                dia_chi,
                ngay_sinh,
                co_xoay_ca
            });
            return res.status(201).json({
                success: true,
                message: "Tạo tài khoản thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async nhapExcel(req, res, next) {
        try {
            if (!req.file) {
                throw new ApiError(400, "Vui lòng tải lên tệp Excel");
            }
            const ketQua = await AdminService.nhapTaiKhoanTuExcel(req.file.buffer);
            return res.json({
                success: true,
                message: `Đã xử lý ${ketQua.tong_so_dong} dòng: ${ketQua.so_thanh_cong} thành công, ${ketQua.so_loi} lỗi`,
                data: ketQua
            });
        } catch (err) {
            next(err);
        }
    }

    static async thayDoiCapBacTaiKhoan(req, res, next) {
        try {
            const { id } = req.params;
            const { huong } = req.body;
            const data = await AdminService.capNhatCapBacTaiKhoan(id, huong);

            return res.json({
                success: true,
                message: "Đã cập nhật cấp bậc tài khoản",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async capNhatTaiKhoan(req, res, next) {
        try {
            const { id } = req.params;
            const { ten_dang_nhap, ho_ten, email, so_dien_thoai, role, trang_thai, mat_khau, gioi_tinh, day_chuyen_id, ca_lam_id, dia_chi, ngay_sinh, co_xoay_ca } = req.body;
            const data = await AdminService.capNhatTaiKhoan(id, {
                ten_dang_nhap,
                ho_ten,
                mat_khau,
                email,
                so_dien_thoai,
                role,
                trang_thai,
                gioi_tinh,
                day_chuyen_id,
                ca_lam_id,
                dia_chi,
                ngay_sinh,
                co_xoay_ca
            });
            return res.json({
                success: true,
                message: "Cập nhật tài khoản thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async xoaTaiKhoan(req, res, next) {
        try {
            const { id } = req.params;
            const nguoiDungHienTaiId = req.nguoiDung.id;
            const ketQua = await AdminService.xoaTaiKhoan(id, nguoiDungHienTaiId);

            return res.json(ketQua);
        } catch (err) {
            next(err);
        }
    }

    static async taiFileMauExcel(req, res, next) {
        try {
            const wb = XLSX.utils.book_new();
            const duLieuMau = [
                {
                    "Họ tên": "Nguyễn Văn A",
                    "Giới tính": "Nam",
                    "Số điện thoại": "0912345678",
                    "Ngày sinh": "15/08/1998",
                    "Email": "vana@company.com",
                    "Địa chỉ": "123 Đường số 4, TP.HCM",
                    "Ca làm": "Ca A",
                    "Vai trò": "Nhân viên"
                },
                {
                    "Họ tên": "Trần Thị B",
                    "Giới tính": "Nữ",
                    "Số điện thoại": "0987654321",
                    "Ngày sinh": "20/12/1995",
                    "Email": "thib@company.com",
                    "Địa chỉ": "456 Đường số 7, Bình Dương",
                    "Ca làm": "Ca B",
                    "Vai trò": "Nhân viên"
                }
            ];

            const ws = XLSX.utils.json_to_sheet(duLieuMau);
            XLSX.utils.book_append_sheet(wb, ws, "DanhSachNhanSu");

            const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

            res.setHeader("Content-Disposition", "attachment; filename=nhan_su_mau.xlsx");
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            return res.send(buffer);
        } catch (err) {
            next(err);
        }
    }

    static async layLichSuHeThong(req, res, next) {
        try {
            const data = await AdminService.layLichSuHeThong(req.query, req.nguoiDung);
            return res.json({
                success: true,
                message: "Lấy lịch sử hệ thống thành công",
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async ganCaLamHangLoat(req, res, next) {
        try {
            const { tai_khoan_ids, ca_lam_id } = req.body;
            await AdminService.ganCaLamHangLoat(tai_khoan_ids, ca_lam_id);
            return res.json({
                success: true,
                message: "Đã thiết lập ca làm việc hàng loạt thành công"
            });
        } catch (err) {
            next(err);
        }
    }
}

export default AdminController;