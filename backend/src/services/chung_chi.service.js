import pool from "../config/db.js";

class ChungChiService {
    /**
     * Lấy danh sách chứng chỉ kèm số lượng nhân viên sở hữu
     */
    static async layDanhSachChungChi({ q } = {}) {
        let sql = `
            SELECT cc.id, cc.ten_chung_chi, cc.mo_ta,
                   COUNT(ccnv.id) AS so_luong_nhan_vien
            FROM chung_chi cc
            LEFT JOIN chung_chi_nhan_vien ccnv ON cc.id = ccnv.chung_chi_id
            WHERE 1=1
        `;
        const params = [];

        if (q) {
            sql += " AND (cc.ten_chung_chi LIKE ? OR cc.mo_ta LIKE ?)";
            const likeQ = `%${q}%`;
            params.push(likeQ, likeQ);
        }

        sql += " GROUP BY cc.id ORDER BY cc.id DESC";

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    /**
     * Lấy chi tiết 1 chứng chỉ theo ID
     */
    static async layChungChiTheoId(id) {
        const [rows] = await pool.query("SELECT * FROM chung_chi WHERE id = ?", [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Tạo mới chứng chỉ
     */
    static async taoChungChi({ ten_chung_chi, mo_ta }) {
        if (!ten_chung_chi || !ten_chung_chi.trim()) {
            throw new Error("Tên chứng chỉ không được để trống");
        }

        const [existing] = await pool.query(
            "SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1",
            [ten_chung_chi.trim()]
        );
        if (existing.length > 0) {
            throw new Error("Tên chứng chỉ này đã tồn tại trong hệ thống");
        }

        const [result] = await pool.query(
            "INSERT INTO chung_chi (ten_chung_chi, mo_ta) VALUES (?, ?)",
            [ten_chung_chi.trim(), mo_ta ? mo_ta.trim() : null]
        );

        return { id: result.insertId, ten_chung_chi: ten_chung_chi.trim(), mo_ta };
    }

    /**
     * Cập nhật chứng chỉ
     */
    static async capNhatChungChi(id, { ten_chung_chi, mo_ta }) {
        if (!ten_chung_chi || !ten_chung_chi.trim()) {
            throw new Error("Tên chứng chỉ không được để trống");
        }

        const [existing] = await pool.query(
            "SELECT id FROM chung_chi WHERE ten_chung_chi = ? AND id != ? LIMIT 1",
            [ten_chung_chi.trim(), id]
        );
        if (existing.length > 0) {
            throw new Error("Tên chứng chỉ này đã trùng với chứng chỉ khác");
        }

        const [result] = await pool.query(
            "UPDATE chung_chi SET ten_chung_chi = ?, mo_ta = ? WHERE id = ?",
            [ten_chung_chi.trim(), mo_ta ? mo_ta.trim() : null, id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Không tìm thấy chứng chỉ để cập nhật");
        }

        return { id, ten_chung_chi: ten_chung_chi.trim(), mo_ta };
    }

    /**
     * Xóa chứng chỉ
     */
    static async xoaChungChi(id) {
        const [inUse] = await pool.query(
            "SELECT id FROM chung_chi_nhan_vien WHERE chung_chi_id = ? LIMIT 1",
            [id]
        );
        if (inUse.length > 0) {
            throw new Error("Không thể xóa chứng chỉ này vì đã được gán cho nhân viên. Hãy thu hồi chứng chỉ khỏi nhân viên trước.");
        }

        const [result] = await pool.query("DELETE FROM chung_chi WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            throw new Error("Không tìm thấy chứng chỉ để xóa");
        }
        return true;
    }

    /**
     * Lấy danh sách gán chứng chỉ nhân viên
     */
    static async layDanhSachChungChiNhanVien({ nhan_vien_id, chung_chi_id, trang_thai, q } = {}) {
        let sql = `
            SELECT ccnv.id, ccnv.nhan_vien_id, ccnv.chung_chi_id, ccnv.cap_do, 
                   ccnv.ngay_cap, ccnv.ngay_het_han, ccnv.trang_thai,
                   nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, dc.ten_day_chuyen,
                   cc.ten_chung_chi, cc.mo_ta AS mo_ta_chung_chi
            FROM chung_chi_nhan_vien ccnv
            JOIN nhan_vien nv ON ccnv.nhan_vien_id = nv.id
            JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
            LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
            WHERE 1=1
        `;
        const params = [];

        if (nhan_vien_id) {
            sql += " AND ccnv.nhan_vien_id = ?";
            params.push(nhan_vien_id);
        }

        if (chung_chi_id) {
            sql += " AND ccnv.chung_chi_id = ?";
            params.push(chung_chi_id);
        }

        if (trang_thai) {
            sql += " AND ccnv.trang_thai = ?";
            params.push(trang_thai);
        }

        if (q) {
            sql += " AND (nv.ho_ten LIKE ? OR nv.ma_nhan_vien LIKE ? OR cc.ten_chung_chi LIKE ?)";
            const likeQ = `%${q}%`;
            params.push(likeQ, likeQ, likeQ);
        }

        sql += " ORDER BY ccnv.id DESC";

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    /**
     * Gán chứng chỉ cho 1 hoặc nhiều nhân viên (hoặc cập nhật nếu đã gán)
     */
    static async ganChungChiNhanVien({ nhan_vien_id, nhan_vien_ids, chung_chi_id, cap_do = 1, ngay_cap, ngay_het_han, trang_thai = 'HIEU_LUC' }) {
        if (!chung_chi_id) {
            throw new Error("Chứng chỉ là bắt buộc");
        }

        let nvIds = [];
        if (Array.isArray(nhan_vien_ids)) {
            nvIds = nhan_vien_ids.map(id => Number(id)).filter(id => Boolean(id));
        } else if (nhan_vien_id) {
            nvIds = [Number(nhan_vien_id)];
        }

        if (nvIds.length === 0) {
            throw new Error("Vui lòng chọn ít nhất một nhân viên để gán chứng chỉ");
        }

        const capDoNum = Number(cap_do) || 1;
        const ngayCapVal = ngay_cap ? ngay_cap : new Date().toISOString().split('T')[0];
        const ngayHetHanVal = ngay_het_han ? ngay_het_han : null;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            let successCount = 0;

            for (const idNv of nvIds) {
                await connection.query(
                    `INSERT INTO chung_chi_nhan_vien (nhan_vien_id, chung_chi_id, cap_do, ngay_cap, ngay_het_han, trang_thai)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        cap_do = VALUES(cap_do), 
                        ngay_cap = VALUES(ngay_cap), 
                        ngay_het_han = VALUES(ngay_het_han), 
                        trang_thai = VALUES(trang_thai)`,
                    [idNv, chung_chi_id, capDoNum, ngayCapVal, ngayHetHanVal, trang_thai]
                );
                successCount++;
            }

            await connection.commit();
            return { successCount, total: nvIds.length, chung_chi_id, cap_do: capDoNum, ngay_cap: ngayCapVal, ngay_het_han: ngayHetHanVal, trang_thai };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    /**
     * Cập nhật chứng chỉ nhân viên
     */
    static async capNhatChungChiNhanVien(id, { cap_do, ngay_cap, ngay_het_han, trang_thai }) {
        const capDoNum = Number(cap_do) || 1;
        const ngayCapVal = ngay_cap ? ngay_cap : null;
        const ngayHetHanVal = ngay_het_han ? ngay_het_han : null;

        const [result] = await pool.query(
            `UPDATE chung_chi_nhan_vien
             SET cap_do = ?, ngay_cap = ?, ngay_het_han = ?, trang_thai = ?
             WHERE id = ?`,
            [capDoNum, ngayCapVal, ngayHetHanVal, trang_thai, id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Không tìm thấy thông tin chứng chỉ nhân viên để cập nhật");
        }

        return { id, cap_do: capDoNum, ngay_cap: ngayCapVal, ngay_het_han: ngayHetHanVal, trang_thai };
    }

    /**
     * Xóa / Thu hồi chứng chỉ nhân viên
     */
    static async xoaChungChiNhanVien(id) {
        const [result] = await pool.query("DELETE FROM chung_chi_nhan_vien WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            throw new Error("Không tìm thấy dữ liệu để thu hồi chứng chỉ");
        }
        return true;
    }
}

export default ChungChiService;
