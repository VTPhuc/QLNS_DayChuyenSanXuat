import pool from "./config/db.js";

/**
 * Tự động kiểm tra và khởi tạo/cập nhật các bảng & cột còn thiếu trong MySQL database
 */
export async function initDatabaseTables() {
    try {
        // 1. Tạo bảng nhat_ky_he_thong & lich_lam nếu chưa tồn tại
        await pool.query(`
            CREATE TABLE IF NOT EXISTS nhat_ky_he_thong (
                id INT AUTO_INCREMENT PRIMARY KEY,
                loai_doi_tuong VARCHAR(50) NOT NULL,
                hanh_dong VARCHAR(50) NOT NULL,
                doi_tuong_id INT NULL,
                ten_doi_tuong VARCHAR(150) NULL,
                chi_tiet TEXT,
                nguoi_thuc_hien VARCHAR(100) DEFAULT 'Hệ thống',
                role_nguoi_thuc_hien VARCHAR(50) DEFAULT 'ADMIN',
                thoi_gian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX(loai_doi_tuong),
                INDEX(thoi_gian)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS lich_lam (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ten_lich VARCHAR(100) NOT NULL,
                chu_ky_tuan INT DEFAULT 0,
                ngay_xoay_gan_nhat DATE,
                mo_ta TEXT,
                ngay_bat_dau DATE,
                ngay_ket_thuc DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Helper kiểm tra cột đã có hay chưa
        const checkColumn = async (table, column) => {
            const [rows] = await pool.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                [table, column]
            );
            return rows.length > 0;
        };

        // 2. Kiểm tra & thêm cột lich_lam_id vào ca_lam_viec
        if (!(await checkColumn('ca_lam_viec', 'lich_lam_id'))) {
            await pool.query(`ALTER TABLE ca_lam_viec ADD COLUMN lich_lam_id INT NULL`);
            try {
                await pool.query(`ALTER TABLE ca_lam_viec ADD CONSTRAINT fk_calam_lichlam FOREIGN KEY (lich_lam_id) REFERENCES lich_lam(id) ON DELETE SET NULL`);
            } catch (fkErr) {
                console.warn("Lưu ý FK fk_calam_lichlam:", fkErr.message);
            }
        }

        // 3. Kiểm tra & thêm cột vào nhan_vien
        if (!(await checkColumn('nhan_vien', 'ca_lam_id'))) {
            await pool.query(`ALTER TABLE nhan_vien ADD COLUMN ca_lam_id INT NULL`);
            try {
                await pool.query(`ALTER TABLE nhan_vien ADD CONSTRAINT fk_nhanvien_calam FOREIGN KEY (ca_lam_id) REFERENCES ca_lam_viec(id) ON DELETE SET NULL`);
            } catch (fkErr) {
                console.warn("Lưu ý FK fk_nhanvien_calam:", fkErr.message);
            }
        }

        if (!(await checkColumn('nhan_vien', 'co_xoay_ca'))) {
            await pool.query(`ALTER TABLE nhan_vien ADD COLUMN co_xoay_ca TINYINT DEFAULT 1`);
        }

        if (!(await checkColumn('nhan_vien', 'dia_chi'))) {
            await pool.query(`ALTER TABLE nhan_vien ADD COLUMN dia_chi TEXT NULL`);
        }

        if (!(await checkColumn('nhan_vien', 'ngay_sinh'))) {
            await pool.query(`ALTER TABLE nhan_vien ADD COLUMN ngay_sinh DATE NULL`);
        }

        // 4. Kiểm tra & thêm cột loai_thay_doi vào lich_su_dieu_dong
        if (!(await checkColumn('lich_su_dieu_dong', 'loai_thay_doi'))) {
            await pool.query(`ALTER TABLE lich_su_dieu_dong ADD COLUMN loai_thay_doi VARCHAR(50) DEFAULT 'DAY_CHUYEN'`);
        }

        console.log("✅ Cấu trúc cơ sở dữ liệu đã được khởi tạo/cập nhật đầy đủ thành công.");
    } catch (err) {
        console.error("❌ Lỗi khi khởi tạo/cập nhật cơ sở dữ liệu:", err.message);
    }
}

export default initDatabaseTables;
