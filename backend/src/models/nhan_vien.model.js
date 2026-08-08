import pool from "../config/db.js";

/**
 * Model quản lý dữ liệu nhân viên
 */
class NhanVienModel {
    static async layDanhSachNhanVien({ q, day_chuyen_id, ca_lam_id, trang_thai } = {}) {
        let sql = `
            SELECT nv.*, dc.ten_day_chuyen, cl.ten_ca AS ten_ca_lam, tk.ten_dang_nhap, tk.email
            FROM nhan_vien nv
            LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
            LEFT JOIN ca_lam_viec cl ON nv.ca_lam_id = cl.id
            LEFT JOIN tai_khoan tk ON nv.tai_khoan_id = tk.id
            WHERE 1=1
        `;
        const params = [];

        if (q) {
            sql += " AND (nv.ho_ten LIKE ? OR nv.ma_nhan_vien LIKE ? OR nv.so_dien_thoai LIKE ?)";
            const likeQ = `%${q}%`;
            params.push(likeQ, likeQ, likeQ);
        }

        if (day_chuyen_id) {
            sql += " AND nv.day_chuyen_id = ?";
            params.push(day_chuyen_id);
        }

        if (ca_lam_id) {
            sql += " AND nv.ca_lam_id = ?";
            params.push(ca_lam_id);
        }

        if (trang_thai) {
            sql += " AND nv.trang_thai = ?";
            params.push(trang_thai);
        }

        sql += " ORDER BY nv.id DESC";
        const [rows] = await pool.query(sql, params);
        return rows;
    }

    static async layChungChiNhanVien(nhanVienId) {
        const [rows] = await pool.query(
            `SELECT ccnv.id, cc.ten_chung_chi, cc.mo_ta AS mo_ta_chung_chi, 
                    ccnv.cap_do, ccnv.ngay_cap, ccnv.ngay_het_han, ccnv.trang_thai
             FROM chung_chi_nhan_vien ccnv
             JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
             WHERE ccnv.nhan_vien_id = ?`,
            [nhanVienId]
        );
        return rows;
    }

    static async layLichSuPhanCong(nhanVienId) {
        const [rows] = await pool.query(
            `SELECT 
                'PHAN_CONG' AS loai,
                nk.ngay AS ngay,
                nk.hanh_dong AS hanh_dong,
                nk.thoi_gian AS thoi_gian,
                dc.ten_day_chuyen AS ten_day_chuyen,
                cd.ten_cong_doan AS ten_cong_doan,
                cl.ten_ca AS ten_ca,
                NULL AS tu_day_chuyen,
                NULL AS den_day_chuyen,
                NULL AS cong_doan_cu,
                NULL AS cong_doan_moi,
                NULL AS ly_do
             FROM nhat_ky_phan_cong nk
             JOIN day_chuyen dc ON nk.day_chuyen_id = dc.id
             JOIN cong_doan cd ON nk.cong_doan_id = cd.id
             LEFT JOIN ca_lam_viec cl ON nk.ca_lam_id = cl.id
             WHERE nk.nhan_vien_id = ?
             
             UNION ALL
             
             SELECT 
                'DIEU_DONG' AS loai,
                NULL AS ngay,
                'DIEU_DONG' AS hanh_dong,
                ls.thoi_gian AS thoi_gian,
                NULL AS ten_day_chuyen,
                NULL AS ten_cong_doan,
                NULL AS ten_ca,
                dc_tu.ten_day_chuyen AS tu_day_chuyen,
                dc_den.ten_day_chuyen AS den_day_chuyen,
                cd_cu.ten_cong_doan AS cong_doan_cu,
                cd_moi.ten_cong_doan AS cong_doan_moi,
                ls.ly_do AS ly_do
             FROM lich_su_dieu_dong ls
             LEFT JOIN day_chuyen dc_tu ON ls.tu_day_chuyen_id = dc_tu.id
             LEFT JOIN day_chuyen dc_den ON ls.den_day_chuyen_id = dc_den.id
             LEFT JOIN cong_doan cd_cu ON ls.cong_doan_cu_id = cd_cu.id
             LEFT JOIN cong_doan cd_moi ON ls.cong_doan_moi_id = cd_moi.id
             WHERE ls.nhan_vien_id = ?
             
             ORDER BY thoi_gian DESC`,
            [nhanVienId, nhanVienId]
        );
        return rows;
    }

    static async capNhatNhanVien(id, { ho_ten, gioi_tinh, so_dien_thoai, day_chuyen_id, chuc_vu, trang_thai }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Lấy day_chuyen_id hiện tại để kiểm tra thay đổi
            const [currentNv] = await connection.query(
                "SELECT day_chuyen_id FROM nhan_vien WHERE id = ?",
                [id]
            );

            const oldDayChuyenId = currentNv.length > 0 ? currentNv[0].day_chuyen_id : null;
            const newDayChuyenId = day_chuyen_id ? Number(day_chuyen_id) : null;

            const [result] = await connection.query(
                `UPDATE nhan_vien 
                 SET ho_ten = ?, gioi_tinh = ?, so_dien_thoai = ?, day_chuyen_id = ?, chuc_vu = ?, trang_thai = ?
                 WHERE id = ?`,
                [ho_ten, gioi_tinh, so_dien_thoai || null, day_chuyen_id || null, chuc_vu, trang_thai, id]
            );

            // Nếu thay đổi dây chuyền cố định, ghi vào lịch sử điều động
            if (result.affectedRows > 0 && oldDayChuyenId !== newDayChuyenId) {
                await connection.query(
                    `INSERT INTO lich_su_dieu_dong (nhan_vien_id, tu_day_chuyen_id, den_day_chuyen_id, ly_do)
                     VALUES (?, ?, ?, ?)`,
                    [id, oldDayChuyenId, newDayChuyenId, 'Thay đổi dây chuyền cố định (Admin)']
                );
            }

            await connection.commit();
            return result.affectedRows > 0;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async xoaNhanVien(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [nv] = await connection.query("SELECT tai_khoan_id FROM nhan_vien WHERE id = ?", [id]);
            if (nv.length > 0 && nv[0].tai_khoan_id) {
                const tkId = nv[0].tai_khoan_id;
                await connection.query("UPDATE nhan_vien SET tai_khoan_id = NULL WHERE id = ?", [id]);
                await connection.query("DELETE FROM tai_khoan WHERE id = ?", [tkId]);
            }

            await connection.query("DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ?", [id]);
            await connection.query("DELETE FROM dang_ky_tang_ca WHERE nhan_vien_id = ?", [id]);
            await connection.query("DELETE FROM chung_chi_nhan_vien WHERE nhan_vien_id = ?", [id]);
            await connection.query("DELETE FROM lich_su_dieu_dong WHERE nhan_vien_id = ?", [id]);
            await connection.query("DELETE FROM thong_bao WHERE nguoi_nhan_id = ?", [id]);

            const [result] = await connection.query("DELETE FROM nhan_vien WHERE id = ?", [id]);

            await connection.commit();
            return result.affectedRows > 0;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

export default NhanVienModel;
