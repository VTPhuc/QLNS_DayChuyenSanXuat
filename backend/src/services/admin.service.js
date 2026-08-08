import TaiKhoanModel from "../models/tai_khoan.model.js";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import xlsx from "xlsx";
import ApiError from "../utils/api_error.js";

const DANH_SACH_ROLE = ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER", "NHAN_VIEN"];

/**
 * Service xử lý logic quản trị tài khoản & nhân sự
 */
class AdminService {
    static async layDanhSachTaiKhoan() {
        return await TaiKhoanModel.layTatCaTaiKhoan();
    }

    static async taoTaiKhoan({ ten_dang_nhap, mat_khau, email, role, ho_ten, so_dien_thoai, gioi_tinh, day_chuyen_id, ca_lam_id, dia_chi, ngay_sinh, co_xoay_ca }) {
        if (role && !DANH_SACH_ROLE.includes(role)) {
            throw new ApiError(400, "Vai trò không hợp lệ");
        }

        // Tự động tạo mật khẩu dạng DDMMYY nếu không nhập mật khẩu thủ công
        let rawPassword = mat_khau;
        if (!rawPassword && ngay_sinh) {
            const dob = new Date(ngay_sinh);
            if (!isNaN(dob.getTime())) {
                const day = String(dob.getDate()).padStart(2, '0');
                const month = String(dob.getMonth() + 1).padStart(2, '0');
                const year = String(dob.getFullYear()).slice(-2);
                rawPassword = `${day}${month}${year}`;
            }
        }
        if (!rawPassword) {
            rawPassword = "123456"; // Mật khẩu mặc định dự phòng
        }

        let username = ten_dang_nhap || "";
        if (!username) {
            if (email) {
                username = email.split("@")[0];
            } else {
                username = "temp_user_" + Date.now();
            }
        }

        // Kiểm tra xem username có bị trùng không
        if (username && !username.startsWith("temp_user_")) {
            const daTonTai = await TaiKhoanModel.timTheoTenDangNhap(username);
            if (daTonTai) {
                throw new ApiError(409, "Tên đăng nhập đã tồn tại");
            }
        }

        const soVongMaHoa = 10;
        const mat_khau_da_ma_hoa = await bcrypt.hash(rawPassword, soVongMaHoa);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [kqTaiKhoan] = await connection.query(
                "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, ?, 1)",
                [username, mat_khau_da_ma_hoa, email || null, role || "NHAN_VIEN"]
            );
            const taiKhoanId = kqTaiKhoan.insertId;

            // Sử dụng capNhatTaiKhoan của model để tạo mới nhan_vien & auto-increment mã số
            await TaiKhoanModel.capNhatTaiKhoan(taiKhoanId, {
                ten_dang_nhap: username,
                email,
                role: role || "NHAN_VIEN",
                trang_thai: 1,
                ho_ten,
                so_dien_thoai,
                gioi_tinh,
                day_chuyen_id,
                ca_lam_id,
                dia_chi,
                ngay_sinh,
                co_xoay_ca: co_xoay_ca !== undefined ? co_xoay_ca : 1
            });

            await connection.commit();
            return { id: taiKhoanId, ten_dang_nhap: username, email, role: role || "NHAN_VIEN" };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async capNhatTaiKhoan(id, { ten_dang_nhap, mat_khau, email, role, trang_thai, ho_ten, so_dien_thoai, gioi_tinh, day_chuyen_id, ca_lam_id, dia_chi, ngay_sinh, co_xoay_ca }) {
        if (!ten_dang_nhap) {
            throw new ApiError(400, "Tên đăng nhập không được để trống");
        }

        if (role && !DANH_SACH_ROLE.includes(role)) {
            throw new ApiError(400, "Vai trò (role) không hợp lệ");
        }

        const taiKhoanHienTai = await TaiKhoanModel.timTheoId(id);
        if (!taiKhoanHienTai) {
            throw new ApiError(404, "Không tìm thấy tài khoản");
        }

        if (ten_dang_nhap !== taiKhoanHienTai.ten_dang_nhap) {
            const daTonTai = await TaiKhoanModel.timTheoTenDangNhap(ten_dang_nhap);
            if (daTonTai) {
                throw new ApiError(409, "Tên đăng nhập đã tồn tại trong hệ thống");
            }
        }

        let mat_khau_da_ma_hoa = null;
        if (mat_khau && mat_khau.trim() !== "") {
            const soVongMaHoa = 10;
            mat_khau_da_ma_hoa = await bcrypt.hash(mat_khau, soVongMaHoa);
        }

        const thanhCong = await TaiKhoanModel.capNhatTaiKhoan(id, {
            ten_dang_nhap,
            email,
            role: role || taiKhoanHienTai.role,
            trang_thai: trang_thai !== undefined ? trang_thai : taiKhoanHienTai.trang_thai,
            mat_khau_da_ma_hoa,
            ho_ten: ho_ten || taiKhoanHienTai.ho_ten,
            so_dien_thoai: so_dien_thoai || taiKhoanHienTai.so_dien_thoai,
            gioi_tinh: gioi_tinh || taiKhoanHienTai.gioi_tinh,
            day_chuyen_id: day_chuyen_id !== undefined ? day_chuyen_id : taiKhoanHienTai.day_chuyen_id,
            ca_lam_id: ca_lam_id !== undefined ? ca_lam_id : taiKhoanHienTai.ca_lam_id,
            dia_chi: dia_chi !== undefined ? dia_chi : taiKhoanHienTai.dia_chi,
            ngay_sinh: ngay_sinh !== undefined ? ngay_sinh : taiKhoanHienTai.ngay_sinh,
            co_xoay_ca: co_xoay_ca !== undefined ? co_xoay_ca : taiKhoanHienTai.co_xoay_ca
        });

        if (thanhCong) {
            await AdminService._dongBoChucVuNhanVien(id, role || taiKhoanHienTai.role);
        } else {
            throw new ApiError(500, "Cập nhật thất bại");
        }

        return {
            id,
            ten_dang_nhap,
            email,
            role: role || taiKhoanHienTai.role,
            trang_thai: trang_thai !== undefined ? trang_thai : taiKhoanHienTai.trang_thai
        };
    }

    static async _dongBoChucVuNhanVien(taiKhoanId, role) {
        await pool.query(
            "UPDATE nhan_vien SET chuc_vu = ? WHERE tai_khoan_id = ?",
            [role, taiKhoanId]
        );
    }

    static async capNhatCapBacTaiKhoan(id, huong) {
        const taiKhoan = await TaiKhoanModel.timTheoId(id);
        if (!taiKhoan) {
            throw new ApiError(404, "Không tìm thấy tài khoản");
        }

        const roleHienTai = taiKhoan.role;
        let roleMoi = roleHienTai;

        if (huong === "THANG_CAP") {
            if (roleHienTai === "NHAN_VIEN") roleMoi = "LEADER_LINE";
            else if (roleHienTai === "LEADER_LINE") roleMoi = "LEADER_KHU_VUC";
            else if (roleHienTai === "LEADER_KHU_VUC") roleMoi = "ADMIN";
        } else if (huong === "HA_CAP") {
            if (roleHienTai === "ADMIN") roleMoi = "LEADER_KHU_VUC";
            else if (roleHienTai === "LEADER_KHU_VUC") roleMoi = "LEADER_LINE";
            else if (roleHienTai === "LEADER_LINE") roleMoi = "NHAN_VIEN";
        }

        if (roleMoi === roleHienTai) {
            throw new ApiError(400, "Không thể thăng/hạ cấp vai trò này thêm nữa");
        }

        await pool.query("UPDATE tai_khoan SET role = ? WHERE id = ?", [roleMoi, id]);
        await AdminService._dongBoChucVuNhanVien(id, roleMoi);

        // Ghi log lịch sử thay đổi vai trò
        const [nv] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [id]);
        if (nv.length > 0) {
            await pool.query(
                `INSERT INTO lich_su_dieu_dong (nhan_vien_id, ly_do, loai_thay_doi)
                 VALUES (?, ?, 'VAI_TRO')`,
                [nv[0].id, `Thăng/Hạ cấp vai trò: từ [${roleHienTai}] sang [${roleMoi}] (Admin)`]
            );
        }

        return { id, role: roleMoi };
    }

    static async xoaTaiKhoan(id, idNguoiDungHienTai) {
        if (Number(id) === Number(idNguoiDungHienTai)) {
            throw new ApiError(400, "Bạn không thể tự xóa tài khoản của chính mình");
        }

        const taiKhoan = await TaiKhoanModel.timTheoId(id);
        if (!taiKhoan) {
            throw new ApiError(404, "Không tìm thấy tài khoản");
        }

        await TaiKhoanModel.huyLienKetNhanVien(id);

        const thanhCong = await TaiKhoanModel.xoaTaiKhoan(id);
        if (!thanhCong) {
            throw new ApiError(500, "Không thể xóa tài khoản");
        }

        return { success: true, message: "Đã xóa tài khoản thành công" };
    }

    static _layGiaTriCot(row, danhSachKhoa) {
        for (const khoa of danhSachKhoa) {
            if (row[khoa] !== undefined) return row[khoa];
        }
        const cacKhoaTrongExcel = Object.keys(row);
        for (const khoa of danhSachKhoa) {
            const timKhop = cacKhoaTrongExcel.find(k => k.toLowerCase().trim() === khoa.toLowerCase().trim());
            if (timKhop) return row[timKhop];
        }
        return null;
    }

    static _chuanHoaNgaySinh(ngaySinh) {
        if (!ngaySinh) return null;
        if (typeof ngaySinh === "number") {
            const date = new Date((ngaySinh - 25569) * 86400 * 1000);
            return date.toISOString().slice(0, 10);
        }
        const d = new Date(ngaySinh);
        if (!isNaN(d.getTime())) {
            return d.toISOString().slice(0, 10);
        }
        const parts = String(ngaySinh).split("/");
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2].length === 2 ? `19${parts[2]}` : parts[2];
            return `${year}-${month}-${day}`;
        }
        return null;
    }

    static _taoMatKhauTuNgaySinh(ngaySinh) {
        if (!ngaySinh) {
            return "123456";
        }

        if (typeof ngaySinh === "number") {
            const date = new Date((ngaySinh - 25569) * 86400 * 1000);
            return AdminService._dinhDangMatKhauTuDate(date);
        }

        const chuoi = String(ngaySinh).trim();

        const phanTachSlash = chuoi.split("/");
        if (phanTachSlash.length === 3) {
            const ngay = phanTachSlash[0].padStart(2, '0');
            const thang = phanTachSlash[1].padStart(2, '0');
            const nam = phanTachSlash[2].slice(-2);
            return `${ngay}${thang}${nam}`;
        }

        const phanTachDash = chuoi.split("-");
        if (phanTachDash.length === 3) {
            if (phanTachDash[0].length === 4) {
                const nam = phanTachDash[0].slice(-2);
                const thang = phanTachDash[1].padStart(2, '0');
                const ngay = phanTachDash[2].padStart(2, '0');
                return `${ngay}${thang}${nam}`;
            } else {
                const ngay = phanTachDash[0].padStart(2, '0');
                const thang = phanTachDash[1].padStart(2, '0');
                const nam = phanTachDash[2].slice(-2);
                return `${ngay}${thang}${nam}`;
            }
        }

        const d = new Date(chuoi);
        if (!isNaN(d.getTime())) {
            return AdminService._dinhDangMatKhauTuDate(d);
        }

        return "123456";
    }

    static _dinhDangMatKhauTuDate(date) {
        const ngay = String(date.getDate()).padStart(2, '0');
        const thang = String(date.getMonth() + 1).padStart(2, '0');
        const nam = String(date.getFullYear()).slice(-2);
        return `${ngay}${thang}${nam}`;
    }

    static _chuanHoaGioiTinh(gt) {
        if (!gt) return "Khac";
        const str = String(gt).trim().toLowerCase();
        if (str.startsWith("nam")) return "Nam";
        if (str.startsWith("nữ") || str.startsWith("nu")) return "Nu";
        return "Khac";
    }

    static _chuanHoaVaiTro(vaiTroText) {
        const text = (vaiTroText || "").toString().trim().toLowerCase();
        if (text.includes("leader") && text.includes("khu")) return "LEADER_KHU_VUC";
        if (text.includes("leader")) return "LEADER_LINE";
        if (text.includes("admin")) return "ADMIN";
        return "NHAN_VIEN";
    }

    static _mapCaLam(caLamText) {
        if (!caLamText) return 1; // Default to Ca A
        const text = String(caLamText).toLowerCase();
        if (text.includes("b") || text.includes("đêm") || text.includes("dem")) {
            return 2;
        }
        return 1;
    }

    static async nhapTaiKhoanTuExcel(fileBuffer) {
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
            throw new ApiError(400, "Tệp Excel không chứa dữ liệu hoặc sai định dạng");
        }

        const [existing] = await pool.query(
            "SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien LIKE 'DP_%'"
        );
        let maxNum = 0;
        existing.forEach(row => {
            const code = row.ma_nhan_vien;
            const numPart = code.substring(3);
            const num = parseInt(numPart, 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        });

        let currentIdx = maxNum + 1;
        const loiList = [];
        let soThanhCong = 0;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const hoTen = AdminService._layGiaTriCot(row, ["Họ tên", "Ho ten", "Họ và tên", "Ho va ten", "Name", "Full Name", "ho_ten"]);
                
                if (!hoTen || String(hoTen).trim() === "") {
                    continue;
                }

                const gioiTinh = AdminService._chuanHoaGioiTinh(AdminService._layGiaTriCot(row, ["Giới tính", "Gioi tinh", "Gender", "gioi_tinh"]));
                const soDienThoai = AdminService._layGiaTriCot(row, ["Số điện thoại", "So dien thoai", "SĐT", "SDT", "Phone", "Phone Number", "so_dien_thoai"]);
                const ngaySinhRaw = AdminService._layGiaTriCot(row, ["Ngày sinh", "Ngay sinh", "DOB", "Date of Birth", "ngay_sinh", "birthday", "Ngay thang nam sinh"]);
                const email = AdminService._layGiaTriCot(row, ["Email", "Thư điện tử", "email"]);
                const diaChi = AdminService._layGiaTriCot(row, ["Địa chỉ", "Dia chi", "diachi", "dia_chi", "Address"]);
                const caLamRaw = AdminService._layGiaTriCot(row, ["Ca làm", "Ca lam", "Ca", "calam", "ca_lam", "Shift"]);
                const vaiTroRaw = AdminService._layGiaTriCot(row, ["Vai trò", "Vai tro", "Role", "vai_tro", "Vai tro"]);

                const ngaySinh = AdminService._chuanHoaNgaySinh(ngaySinhRaw);
                const caLamId = AdminService._mapCaLam(caLamRaw);

                try {
                    // Tự tăng mã nhân viên dạng DP_01, DP_02...
                    const formattedIdx = currentIdx < 10 ? `0${currentIdx}` : `${currentIdx}`;
                    const maNhanVien = `DP_${formattedIdx}`;
                    
                    const matKhauMacDinh = AdminService._taoMatKhauTuNgaySinh(ngaySinhRaw);
                    const matKhauDaMaHoa = await bcrypt.hash(matKhauMacDinh, 10);
                    const tenDangNhap = maNhanVien;
                    const role = AdminService._chuanHoaVaiTro(vaiTroRaw);

                    const [trungUsername] = await connection.query(
                        "SELECT id FROM tai_khoan WHERE ten_dang_nhap = ?",
                        [tenDangNhap]
                    );
                    if (trungUsername.length > 0) {
                        throw new Error(`Mã nhân viên ${tenDangNhap} đã tồn tại trong cơ sở dữ liệu`);
                    }

                    const [kqTaiKhoan] = await connection.query(
                        "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, role, trang_thai) VALUES (?, ?, ?, ?, 1)",
                        [tenDangNhap, matKhauDaMaHoa, email || null, role]
                    );
                    const taiKhoanId = kqTaiKhoan.insertId;

                    await connection.query(
                        `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, gioi_tinh, so_dien_thoai, ngay_vao_lam, tai_khoan_id, chuc_vu, trang_thai, dia_chi, ngay_sinh, ca_lam_id) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, 'DANG_LAM', ?, ?, ?)`,
                        [maNhanVien, hoTen, gioiTinh, soDienThoai ? String(soDienThoai) : null, new Date(), taiKhoanId, role, diaChi || null, ngaySinh, caLamId]
                    );

                    currentIdx++;
                    soThanhCong++;
                } catch (errRow) {
                    loiList.push({
                        dong: i + 2,
                        nhanVien: hoTen,
                        loi: errRow.message
                    });
                }
            }

            await connection.commit();
        } catch (errTx) {
            await connection.rollback();
            throw errTx;
        } finally {
            connection.release();
        }

        return {
            tong_so_dong: soThanhCong + loiList.length,
            so_thanh_cong: soThanhCong,
            so_loi: loiList.length,
            loi: loiList
        };
    }

    static async layLichSuHeThong(queryObj = {}, nguoiDung = null) {
        const { loai_doi_tuong, ngay, thang, nam, tu_ngay, den_ngay, q } = queryObj;
        
        let sql = `
            SELECT 
                nk.id,
                nk.loai_doi_tuong,
                nk.hanh_dong,
                nk.doi_tuong_id,
                nk.ten_doi_tuong,
                nk.chi_tiet AS ly_do,
                nk.nguoi_thuc_hien AS ho_ten,
                nk.role_nguoi_thuc_hien,
                nk.thoi_gian
            FROM nhat_ky_he_thong nk
            WHERE 1=1
        `;
        const params = [];

        if (loai_doi_tuong && loai_doi_tuong !== "ALL") {
            sql += " AND nk.loai_doi_tuong = ?";
            params.push(loai_doi_tuong);
        }

        if (ngay) {
            sql += " AND DATE(nk.thoi_gian) = ?";
            params.push(ngay);
        }

        if (thang) {
            sql += " AND MONTH(nk.thoi_gian) = ?";
            params.push(Number(thang));
        }

        if (nam) {
            sql += " AND YEAR(nk.thoi_gian) = ?";
            params.push(Number(nam));
        }

        if (tu_ngay) {
            sql += " AND DATE(nk.thoi_gian) >= ?";
            params.push(tu_ngay);
        }

        if (den_ngay) {
            sql += " AND DATE(nk.thoi_gian) <= ?";
            params.push(den_ngay);
        }

        if (q) {
            sql += " AND (nk.ten_doi_tuong LIKE ? OR nk.chi_tiet LIKE ? OR nk.nguoi_thuc_hien LIKE ?)";
            const likeQ = `%${q}%`;
            params.push(likeQ, likeQ, likeQ);
        }

        sql += " ORDER BY nk.thoi_gian DESC, nk.id DESC LIMIT 500";

        const [rows] = await pool.query(sql, params);

        // Nếu bảng nhat_ky_he_thong chưa có dữ liệu cũ, truy vấn thêm từ các bảng nhat_ky_phan_cong & lich_su_dieu_dong
        if (rows.length < 5) {
            const [legacyRows] = await pool.query(
                `SELECT 
                    'CONG_DOAN' AS loai_doi_tuong,
                    nk.hanh_dong AS hanh_dong,
                    nk.id AS doi_tuong_id,
                    dc.ten_day_chuyen AS ten_doi_tuong,
                    CONCAT('Phân công: ', nv.ho_ten, ' (', nv.ma_nhan_vien, ') tại ', COALESCE(cd.ten_cong_doan, 'Công đoạn'), ' - ', COALESCE(cl.ten_ca, 'Ca làm')) AS ly_do,
                    nv.ho_ten AS ho_ten,
                    'Hệ thống' AS role_nguoi_thuc_hien,
                    nk.thoi_gian AS thoi_gian
                 FROM nhat_ky_phan_cong nk
                 JOIN nhan_vien nv ON nk.nhan_vien_id = nv.id
                 LEFT JOIN day_chuyen dc ON nk.day_chuyen_id = dc.id
                 LEFT JOIN cong_doan cd ON nk.cong_doan_id = cd.id
                 LEFT JOIN ca_lam_viec cl ON nk.ca_lam_id = cl.id

                 UNION ALL

                 SELECT 
                    'NHAN_VIEN' AS loai_doi_tuong,
                    'DIEU_DONG' AS hanh_dong,
                    ls.id AS doi_tuong_id,
                    nv.ho_ten AS ten_doi_tuong,
                    ls.ly_do AS ly_do,
                    nv.ho_ten AS ho_ten,
                    'ADMIN' AS role_nguoi_thuc_hien,
                    ls.thoi_gian AS thoi_gian
                 FROM lich_su_dieu_dong ls
                 JOIN nhan_vien nv ON ls.nhan_vien_id = nv.id

                 ORDER BY thoi_gian DESC LIMIT 100`
            );
            return [...rows, ...legacyRows];
        }

        return rows;
    }

    static async ganCaLamHangLoat(taiKhoanIds, caLamId) {
        if (!Array.isArray(taiKhoanIds) || taiKhoanIds.length === 0) {
            throw new ApiError(400, "Danh sách tài khoản không hợp lệ");
        }
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Lấy tên ca làm mới
            let tenCaMoi = "Chưa gán";
            if (caLamId) {
                const [caRows] = await connection.query("SELECT ten_ca FROM ca_lam_viec WHERE id = ?", [caLamId]);
                if (caRows.length > 0) tenCaMoi = caRows[0].ten_ca;
            }

            for (const tkId of taiKhoanIds) {
                // Lấy thông tin nhân sự và ca làm cũ
                const [nvRows] = await connection.query(
                    "SELECT id, ca_lam_id FROM nhan_vien WHERE tai_khoan_id = ?",
                    [tkId]
                );

                if (nvRows.length > 0) {
                    const nvId = nvRows[0].id;
                    const oldCaLamId = nvRows[0].ca_lam_id;
                    const newCaLamId = caLamId ? Number(caLamId) : null;

                    if (oldCaLamId !== newCaLamId) {
                        // Cập nhật ca làm
                        await connection.query(
                            "UPDATE nhan_vien SET ca_lam_id = ? WHERE id = ?",
                            [newCaLamId, nvId]
                        );

                        // Lấy tên ca làm cũ
                        let tenCaCu = "Chưa gán";
                        if (oldCaLamId) {
                            const [oldCaRows] = await connection.query("SELECT ten_ca FROM ca_lam_viec WHERE id = ?", [oldCaLamId]);
                            if (oldCaRows.length > 0) tenCaCu = oldCaRows[0].ten_ca;
                        }

                        // Ghi nhận lịch sử điều chuyển ca
                        await connection.query(
                            `INSERT INTO lich_su_dieu_dong (nhan_vien_id, ly_do, loai_thay_doi)
                             VALUES (?, ?, 'CA_LAM')`,
                            [nvId, `Thay đổi ca làm cố định hàng loạt từ [${tenCaCu}] sang [${tenCaMoi}] (Admin)`]
                        );
                    }
                }
            }

            await connection.commit();
            return true;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

export const nhapNhanVienTuExcel = AdminService.nhapTaiKhoanTuExcel;
export default AdminService;
