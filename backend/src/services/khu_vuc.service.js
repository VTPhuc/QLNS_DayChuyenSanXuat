import pool from "../config/db.js";
import ApiError from "../utils/api_error.js";
import { ghiNhatKyHeThong } from "../utils/nhat_ky.js";

/**
 * Service xử lý nghiệp vụ liên quan đến khu vực
 */
class KhuVucService {
    static async layDanhSachKhuVuc() {
        const [rows] = await pool.query(
            `SELECT kv.id, kv.ten_khu_vuc, kv.khach_hang_id, kv.leader_id,
                    kh.ten_khach_hang,
                    nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader
             FROM khu_vuc kv
             LEFT JOIN khach_hang kh ON kv.khach_hang_id = kh.id
             LEFT JOIN nhan_vien nv ON kv.leader_id = nv.id
             ORDER BY kv.id DESC`
        );
        return rows;
    }

    static async timKhuVucTheoId(id) {
        const [rows] = await pool.query(
            `SELECT kv.id, kv.ten_khu_vuc, kv.khach_hang_id, kv.leader_id,
                    kh.ten_khach_hang,
                    nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader
             FROM khu_vuc kv
             LEFT JOIN khach_hang kh ON kv.khach_hang_id = kh.id
             LEFT JOIN nhan_vien nv ON kv.leader_id = nv.id
             WHERE kv.id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async taoKhuVuc({ ten_khu_vuc, khach_hang_id, leader_id, nguoiDung }) {
        if (!ten_khu_vuc || !khach_hang_id) {
            throw new ApiError(400, "Tên khu vực và Khách hàng không được để trống");
        }

        const [ketQua] = await pool.query(
            "INSERT INTO khu_vuc (ten_khu_vuc, khach_hang_id, leader_id) VALUES (?, ?, ?)",
            [ten_khu_vuc, khach_hang_id, leader_id || null]
        );

        // Fetch meta details for audit log
        const [khRows] = await pool.query("SELECT ten_khach_hang FROM khach_hang WHERE id = ?", [khach_hang_id]);
        const tenKhachHang = khRows[0]?.ten_khach_hang || "N/A";
        let tenLeader = "Chưa phân công";
        if (leader_id) {
            const [ldRows] = await pool.query("SELECT ho_ten FROM nhan_vien WHERE id = ?", [leader_id]);
            if (ldRows[0]) tenLeader = ldRows[0].ho_ten;
        }

        await ghiNhatKyHeThong({
            loai_doi_tuong: "KHU_VUC",
            hanh_dong: "THEM",
            doi_tuong_id: ketQua.insertId,
            ten_doi_tuong: ten_khu_vuc,
            chi_tiet: `Thêm khu vực mới: "${ten_khu_vuc}". Khách hàng: "${tenKhachHang}". Leader phụ trách: "${tenLeader}".`,
            nguoi_thuc_hien: nguoiDung?.ho_ten || nguoiDung?.ten_dang_nhap || "Admin",
            role_nguoi_thuc_hien: nguoiDung?.role || "ADMIN"
        });

        return { id: ketQua.insertId, ten_khu_vuc, khach_hang_id, leader_id };
    }

    static async capNhatKhuVuc(id, { ten_khu_vuc, khach_hang_id, leader_id, nguoiDung }) {
        if (!ten_khu_vuc || !khach_hang_id) {
            throw new ApiError(400, "Tên khu vực và Khách hàng không được để trống");
        }

        const khuVuc = await KhuVucService.timKhuVucTheoId(id);
        if (!khuVuc) {
            throw new ApiError(404, "Không tìm thấy khu vực");
        }

        await pool.query(
            "UPDATE khu_vuc SET ten_khu_vuc = ?, khach_hang_id = ?, leader_id = ? WHERE id = ?",
            [ten_khu_vuc, khach_hang_id, leader_id || null, id]
        );

        const [khRows] = await pool.query("SELECT ten_khach_hang FROM khach_hang WHERE id = ?", [khach_hang_id]);
        const tenKhachHang = khRows[0]?.ten_khach_hang || "N/A";
        let tenLeader = "Chưa phân công";
        if (leader_id) {
            const [ldRows] = await pool.query("SELECT ho_ten FROM nhan_vien WHERE id = ?", [leader_id]);
            if (ldRows[0]) tenLeader = ldRows[0].ho_ten;
        }

        await ghiNhatKyHeThong({
            loai_doi_tuong: "KHU_VUC",
            hanh_dong: "SUA",
            doi_tuong_id: id,
            ten_doi_tuong: ten_khu_vuc,
            chi_tiet: `Cập nhật khu vực "${ten_khu_vuc}". Khách hàng: "${tenKhachHang}". Leader: "${tenLeader}".`,
            nguoi_thuc_hien: nguoiDung?.ho_ten || nguoiDung?.ten_dang_nhap || "Admin",
            role_nguoi_thuc_hien: nguoiDung?.role || "ADMIN"
        });

        return { id, ten_khu_vuc, khach_hang_id, leader_id };
    }

    static async xoaKhuVuc(id, nguoiDung) {
        const khuVuc = await KhuVucService.timKhuVucTheoId(id);
        if (!khuVuc) {
            throw new ApiError(404, "Không tìm thấy khu vực");
        }

        const [dayChuyen] = await pool.query("SELECT id FROM day_chuyen WHERE khu_vuc_id = ? LIMIT 1", [id]);
        if (dayChuyen.length > 0) {
            throw new ApiError(400, "Không thể xóa khu vực đang chứa dây chuyền hoạt động");
        }

        const [ketQua] = await pool.query("DELETE FROM khu_vuc WHERE id = ?", [id]);

        if (ketQua.affectedRows > 0) {
            await ghiNhatKyHeThong({
                loai_doi_tuong: "KHU_VUC",
                hanh_dong: "XOA",
                doi_tuong_id: id,
                ten_doi_tuong: khuVuc.ten_khu_vuc,
                chi_tiet: `Xóa khu vực "${khuVuc.ten_khu_vuc}". Khách hàng cũ: "${khuVuc.ten_khach_hang || 'N/A'}". Leader cũ: "${khuVuc.ten_leader || 'Chưa phân công'}".`,
                nguoi_thuc_hien: nguoiDung?.ho_ten || nguoiDung?.ten_dang_nhap || "Admin",
                role_nguoi_thuc_hien: nguoiDung?.role || "ADMIN"
            });
        }

        return ketQua.affectedRows > 0;
    }

    static async layDanhSachLeaderKhuVuc() {
        const [rows] = await pool.query(
            `SELECT id, ho_ten, ma_nhan_vien 
             FROM nhan_vien 
             WHERE chuc_vu = 'LEADER_KHU_VUC' AND trang_thai = 'DANG_LAM'`
        );
        return rows;
    }

    static async layDanhSachKhachHang() {
        const [rows] = await pool.query("SELECT id, ten_khach_hang, mo_ta FROM khach_hang ORDER BY ten_khach_hang ASC");
        return rows;
    }

    static async layBanDoKhuVuc(khuVucId) {
        const khuVuc = await KhuVucService.timKhuVucTheoId(khuVucId);
        if (!khuVuc) {
            throw new ApiError(404, "Không tìm thấy khu vực");
        }

        const [dayChuyenRows] = await pool.query(
            `SELECT id, ten_day_chuyen, trang_thai FROM day_chuyen WHERE khu_vuc_id = ?`,
            [khuVucId]
        );

        const [congDoanRows] = await pool.query(
            `SELECT cd.id AS cong_doan_id, cd.ten_cong_doan, cd.vi_tri_x, cd.vi_tri_y, cd.xoay,
                    yc.day_chuyen_id, yc.so_luong_can, yc.so_luong_min, yc.so_luong_max,
                    dc.ten_day_chuyen,
                    (SELECT COUNT(*) FROM phan_cong_nhan_su WHERE cong_doan_id = cd.id AND ngay = CURDATE()) AS so_luong_da_gan,
                    (SELECT GROUP_CONCAT(nv.ho_ten ORDER BY nv.ho_ten ASC SEPARATOR ', ')
                     FROM phan_cong_nhan_su pc
                     JOIN nhan_vien nv ON pc.nhan_vien_id = nv.id
                     WHERE pc.cong_doan_id = cd.id AND pc.ngay = CURDATE()) AS danh_sach_nv
             FROM cong_doan cd
             JOIN yeu_cau_nhan_su yc ON cd.id = yc.cong_doan_id
             JOIN day_chuyen dc ON yc.day_chuyen_id = dc.id
             WHERE dc.khu_vuc_id = ?`,
            [khuVucId]
        );

        return {
            khu_vuc: khuVuc,
            day_chuyen: dayChuyenRows,
            cong_doan: congDoanRows
        };
    }

    static async luuBanDoKhuVuc(khuVucId, { cong_doan_positions }) {
        if (!Array.isArray(cong_doan_positions)) {
            throw new ApiError(400, "Dữ liệu vị trí công đoạn không hợp lệ");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const pos of cong_doan_positions) {
                const x = pos.vi_tri_x !== undefined && pos.vi_tri_x !== null ? Number(pos.vi_tri_x) : null;
                const y = pos.vi_tri_y !== undefined && pos.vi_tri_y !== null ? Number(pos.vi_tri_y) : null;
                const xoay = pos.xoay !== undefined && pos.xoay !== null ? Number(pos.xoay) : 0;
                const cdId = Number(pos.cong_doan_id);

                await connection.query(
                    `UPDATE cong_doan SET vi_tri_x = ?, vi_tri_y = ?, xoay = ? WHERE id = ?`,
                    [x, y, xoay, cdId]
                );
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

export default KhuVucService;
