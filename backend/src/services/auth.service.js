import bcrypt from "bcrypt";
import TaiKhoanModel from "../models/tai_khoan.model.js";
import { taoToken } from "../utils/jwt.util.js";
import ApiError from "../utils/api_error.js";

export const DANH_SACH_ROLE = ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "NHAN_VIEN"];

/**
 * Service xử lý xác thực tài khoản
 */
class AuthService {
    static DANH_SACH_ROLE = DANH_SACH_ROLE;

    static async dangNhap(ten_dang_nhap, mat_khau) {
        const taiKhoan = await TaiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);

        if (!taiKhoan) {
            throw new ApiError(401, "Tên đăng nhập hoặc mật khẩu không đúng");
        }

        if (taiKhoan.trang_thai === 0) {
            throw new ApiError(403, "Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên");
        }

        const matKhauDung = await bcrypt.compare(mat_khau, taiKhoan.mat_khau);
        if (!matKhauDung) {
            throw new ApiError(401, "Tên đăng nhập hoặc mật khẩu không đúng");
        }

        const token = taoToken({
            id: taiKhoan.id,
            ten_dang_nhap: taiKhoan.ten_dang_nhap,
            role: taiKhoan.role
        });

        const thongTinChiTiet = await TaiKhoanModel.timTheoId(taiKhoan.id);

        return {
            token,
            nguoiDung: thongTinChiTiet || {
                id: taiKhoan.id,
                ten_dang_nhap: taiKhoan.ten_dang_nhap,
                email: taiKhoan.email,
                role: taiKhoan.role
            }
        };
    }

    static async dangKy({ ten_dang_nhap, mat_khau, email, role }) {
        if (!ten_dang_nhap || !mat_khau) {
            throw new ApiError(400, "Thiếu tên đăng nhập hoặc mật khẩu");
        }

        if (role && !DANH_SACH_ROLE.includes(role)) {
            throw new ApiError(400, "Role không hợp lệ");
        }

        const daTonTai = await TaiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);
        if (daTonTai) {
            throw new ApiError(409, "Tên đăng nhập đã tồn tại");
        }

        const soVongMaHoa = 10;
        const mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, soVongMaHoa);

        const id = await TaiKhoanModel.taoTaiKhoan({
            ten_dang_nhap,
            mat_khau_da_ma_hoa,
            email,
            role: role || "NHAN_VIEN"
        });

        return { id, ten_dang_nhap, email, role: role || "NHAN_VIEN" };
    }

    static async capNhatThongTinCaNhan(id, { mat_khau, email, ho_ten, so_dien_thoai, gioi_tinh }) {
        const taiKhoan = await TaiKhoanModel.timTheoId(id);
        if (!taiKhoan) {
            throw new ApiError(404, "Tài khoản không tồn tại");
        }

        let mat_khau_da_ma_hoa = null;
        if (mat_khau && mat_khau.trim() !== "") {
            mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, 10);
        }

        await TaiKhoanModel.capNhatTaiKhoan(id, {
            ten_dang_nhap: taiKhoan.ten_dang_nhap,
            email: email !== undefined ? email : taiKhoan.email,
            role: taiKhoan.role,
            trang_thai: taiKhoan.trang_thai,
            mat_khau_da_ma_hoa,
            ho_ten: ho_ten !== undefined ? ho_ten : taiKhoan.ho_ten,
            so_dien_thoai: so_dien_thoai !== undefined ? so_dien_thoai : taiKhoan.so_dien_thoai,
            gioi_tinh: gioi_tinh !== undefined ? gioi_tinh : taiKhoan.gioi_tinh
        });

        return await TaiKhoanModel.timTheoId(id);
    }
}

export default AuthService;
