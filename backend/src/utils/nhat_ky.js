import pool from "../config/db.js";

/**
 * Ghi nhật ký thao tác hệ thống (Audit Trail)
 */
export async function ghiNhatKyHeThong({
    loai_doi_tuong,
    hanh_dong,
    doi_tuong_id = null,
    ten_doi_tuong = "",
    chi_tiet = "",
    nguoi_thuc_hien = "Hệ thống",
    role_nguoi_thuc_hien = "ADMIN"
}) {
    try {
        await pool.query(
            `INSERT INTO nhat_ky_he_thong 
             (loai_doi_tuong, hanh_dong, doi_tuong_id, ten_doi_tuong, chi_tiet, nguoi_thuc_hien, role_nguoi_thuc_hien)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                loai_doi_tuong,
                hanh_dong,
                doi_tuong_id ? Number(doi_tuong_id) : null,
                ten_doi_tuong || "",
                chi_tiet || "",
                nguoi_thuc_hien || "Hệ thống",
                role_nguoi_thuc_hien || "ADMIN"
            ]
        );
    } catch (err) {
        console.error("Lỗi khi ghi nhật ký hệ thống:", err.message);
    }
}

export default ghiNhatKyHeThong;
