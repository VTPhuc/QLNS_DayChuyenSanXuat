import pool from "../config/db.js";
import ApiError from "../utils/api_error.js";

class TangCaService {
    /**
     * Lấy danh sách đăng ký tăng ca theo bộ lọc
     */
    static async layDanhSachDangKyTangCa({ ngay, day_chuyen_id, ca_lam_id, trang_thai, q } = {}) {
        let sql = `
            SELECT dk.id, dk.nhan_vien_id, dk.ca_lam_id, dk.ngay, dk.trang_thai,
<<<<<<< HEAD
                   nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, nv.so_dien_thoai, nv.day_chuyen_id, nv.ca_lam_id AS nv_ca_lam_id,
=======
                   nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, nv.so_dien_thoai, nv.day_chuyen_id, nv.ca_lam_id AS ca_lam_goc_id,
                   cl_goc.ten_ca AS ten_ca_goc,
>>>>>>> upstream/main
                   dc.ten_day_chuyen,
                   cl.ten_ca, cl.gio_bat_dau, cl.gio_ket_thuc, cl.loai_ca,
                   cl_nv.ten_ca AS ten_ca_goc
            FROM dang_ky_tang_ca dk
            JOIN nhan_vien nv ON dk.nhan_vien_id = nv.id
            JOIN ca_lam_viec cl ON dk.ca_lam_id = cl.id
<<<<<<< HEAD
            LEFT JOIN ca_lam_viec cl_nv ON nv.ca_lam_id = cl_nv.id
=======
            LEFT JOIN ca_lam_viec cl_goc ON nv.ca_lam_id = cl_goc.id
>>>>>>> upstream/main
            LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
            WHERE 1=1
        `;
        const params = [];

        if (ngay) {
            sql += " AND dk.ngay = ?";
            params.push(ngay);
        }

        if (day_chuyen_id) {
            sql += " AND nv.day_chuyen_id = ?";
            params.push(day_chuyen_id);
        }

        if (ca_lam_id) {
            sql += " AND (dk.ca_lam_id = ? OR nv.ca_lam_id = ?)";
            params.push(ca_lam_id, ca_lam_id);
        }

        if (trang_thai) {
            sql += " AND dk.trang_thai = ?";
            params.push(trang_thai);
        }

        if (q) {
            sql += " AND (nv.ho_ten LIKE ? OR nv.ma_nhan_vien LIKE ? OR dc.ten_day_chuyen LIKE ?)";
            const likeQ = `%${q}%`;
            params.push(likeQ, likeQ, likeQ);
        }

        sql += " ORDER BY dk.ngay DESC, dk.id DESC";

        const [rows] = await pool.query(sql, params);

        // Đính kèm thông tin chứng chỉ/kỹ năng cho từng nhân viên
        for (const item of rows) {
            const [skills] = await pool.query(
                `SELECT ccnv.cap_do, cc.ten_chung_chi 
                 FROM chung_chi_nhan_vien ccnv
                 JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
                 WHERE ccnv.nhan_vien_id = ? AND ccnv.trang_thai = 'HIEU_LUC'`,
                [item.nhan_vien_id]
            );
            item.ky_nang_list = skills;
        }

        return rows;
    }

    /**
     * Đăng ký tăng ca cho 1 hoặc nhiều nhân viên
     */
    static async taoDangKyTangCa({ nhan_vien_ids, ca_lam_id, ngay, trang_thai = 'CHO_DUYET' }) {
        if (!ca_lam_id || !ngay) {
            throw new ApiError(400, "Ca làm việc và Ngày là bắt buộc");
        }

        let nvIds = [];
        if (Array.isArray(nhan_vien_ids)) {
            nvIds = nhan_vien_ids.map(id => Number(id)).filter(id => Boolean(id));
        } else if (nhan_vien_ids) {
            nvIds = [Number(nhan_vien_ids)];
        }

        if (nvIds.length === 0) {
            throw new ApiError(400, "Vui lòng chọn ít nhất một nhân viên để đăng ký tăng ca");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let successCount = 0;
            for (const nvId of nvIds) {
                // Kiểm tra xem nhân viên đã đăng ký ca tăng ca này ngày này chưa
                const [existing] = await connection.query(
                    "SELECT id FROM dang_ky_tang_ca WHERE nhan_vien_id = ? AND ca_lam_id = ? AND ngay = ? LIMIT 1",
                    [nvId, ca_lam_id, ngay]
                );

                if (existing.length > 0) {
                    await connection.query(
                        "UPDATE dang_ky_tang_ca SET trang_thai = ? WHERE id = ?",
                        [trang_thai, existing[0].id]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO dang_ky_tang_ca (nhan_vien_id, ca_lam_id, ngay, trang_thai)
                         VALUES (?, ?, ?, ?)`,
                        [nvId, ca_lam_id, ngay, trang_thai]
                    );
                }
                successCount++;
            }

            await connection.commit();
            return { successCount, total: nvIds.length };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    /**
     * Duyệt hoặc từ chối các đơn đăng ký tăng ca
     */
    static async duyetDangKyTangCa({ ids, trang_thai }) {
        if (!['DA_DUYET', 'TU_CHOI', 'CHO_DUYET'].includes(trang_thai)) {
            throw new ApiError(400, "Trạng thái không hợp lệ");
        }

        let targetIds = [];
        if (Array.isArray(ids)) {
            targetIds = ids.map(id => Number(id));
        } else if (ids) {
            targetIds = [Number(ids)];
        }

        if (targetIds.length === 0) {
            throw new ApiError(400, "Vui lòng chọn đăng ký tăng ca cần xử lý");
        }

        const [result] = await pool.query(
            "UPDATE dang_ky_tang_ca SET trang_thai = ? WHERE id IN (?)",
            [trang_thai, targetIds]
        );

        return { affectedRows: result.affectedRows, trang_thai };
    }

    /**
     * Xóa / Hủy đăng ký tăng ca
     */
    static async xoaDangKyTangCa(id) {
        const [result] = await pool.query("DELETE FROM dang_ky_tang_ca WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            throw new ApiError(404, "Không tìm thấy đơn đăng ký tăng ca để xóa");
        }
        return true;
    }

    /**
     * Lấy danh sách nhân sự đã được ĐÃ DUYỆT TĂNG CA sẵn sàng phân bổ
     */
    static async layDanhSachNhanSuTangCaChoPhanBo({ ngay, ca_lam_id, day_chuyen_id } = {}) {
        if (!ngay) {
            throw new ApiError(400, "Vui lòng chọn ngày để phân bổ tăng ca");
        }

        let sql = `
            SELECT dk.id AS dang_ky_id, dk.nhan_vien_id, dk.ca_lam_id, dk.ngay,
<<<<<<< HEAD
                   nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, nv.day_chuyen_id AS day_chuyen_goc_id, nv.ca_lam_id AS nv_ca_lam_id,
=======
                   nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, nv.day_chuyen_id AS day_chuyen_goc_id, nv.ca_lam_id AS ca_lam_goc_id,
>>>>>>> upstream/main
                   dc_goc.ten_day_chuyen AS ten_day_chuyen_goc,
                   cl_goc.ten_ca AS ten_ca_goc,
                   cl.ten_ca, cl.gio_bat_dau, cl.gio_ket_thuc,
                   pc.id AS phan_cong_id, pc.day_chuyen_id AS phan_cong_day_chuyen_id, pc.cong_doan_id,
                   dc_pc.ten_day_chuyen AS ten_day_chuyen_phan_cong,
                   cd.ten_cong_doan
            FROM dang_ky_tang_ca dk
            JOIN nhan_vien nv ON dk.nhan_vien_id = nv.id
            JOIN ca_lam_viec cl ON dk.ca_lam_id = cl.id
            LEFT JOIN ca_lam_viec cl_goc ON nv.ca_lam_id = cl_goc.id
            LEFT JOIN day_chuyen dc_goc ON nv.day_chuyen_id = dc_goc.id
            LEFT JOIN phan_cong_nhan_su pc ON (pc.nhan_vien_id = nv.id AND pc.ca_lam_id = dk.ca_lam_id AND pc.ngay = dk.ngay)
            LEFT JOIN day_chuyen dc_pc ON pc.day_chuyen_id = dc_pc.id
            LEFT JOIN cong_doan cd ON pc.cong_doan_id = cd.id
            WHERE dk.trang_thai = 'DA_DUYET' AND dk.ngay = ?
        `;
        const params = [ngay];

        if (ca_lam_id) {
            sql += " AND (dk.ca_lam_id = ? OR nv.ca_lam_id = ?)";
            params.push(ca_lam_id, ca_lam_id);
        }

        sql += " ORDER BY nv.ho_ten ASC";

        const [rows] = await pool.query(sql, params);

        // Lấy chứng chỉ & kỹ năng tay nghề của nhân sự
        for (const item of rows) {
            const [skills] = await pool.query(
                `SELECT ccnv.cap_do, cc.ten_chung_chi, cc.id AS chung_chi_id
                 FROM chung_chi_nhan_vien ccnv
                 JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
                 WHERE ccnv.nhan_vien_id = ? AND ccnv.trang_thai = 'HIEU_LUC'`,
                [item.nhan_vien_id]
            );
            item.ky_nang_list = skills;
        }

        return rows;
    }

    /**
     * Phân bổ 1 nhân sự tăng ca vào dây chuyền & công đoạn
     */
    static async phanBoNhanSuTangCa({ nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay }) {
        if (!nhan_vien_id || !day_chuyen_id || !cong_doan_id || !ca_lam_id || !ngay) {
            throw new ApiError(400, "Thiếu thông tin phân công tăng ca");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Kiểm tra chứng chỉ kỹ năng của nhân viên nếu công đoạn có yêu cầu chứng chỉ
            const [cdRows] = await connection.query("SELECT ten_cong_doan FROM cong_doan WHERE id = ? LIMIT 1", [cong_doan_id]);
            if (cdRows.length > 0) {
                const tenCongDoan = cdRows[0].ten_cong_doan;
                const tenChungChiYeuCau = tenCongDoan.replace(/\s+\d+$/, "").trim();

                const [ccRows] = await connection.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiYeuCau]);
                if (ccRows.length > 0) {
                    const chungChiId = ccRows[0].id;
                    const [ccNvRows] = await connection.query(
                        "SELECT id FROM chung_chi_nhan_vien WHERE nhan_vien_id = ? AND chung_chi_id = ? AND trang_thai = 'HIEU_LUC' LIMIT 1",
                        [nhan_vien_id, chungChiId]
                    );
                    if (ccNvRows.length === 0) {
                        throw new ApiError(400, `Lỗi: Nhân viên chưa có chứng chỉ kỹ năng phù hợp cho công đoạn "${tenCongDoan}" (Yêu cầu chứng chỉ: "${tenChungChiYeuCau}")`);
                    }
                }
            }

            // Kiểm tra phân công hiện tại
            const [existing] = await connection.query(
                "SELECT id FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ca_lam_id = ? AND ngay = ? LIMIT 1",
                [nhan_vien_id, ca_lam_id, ngay]
            );

            if (existing.length > 0) {
                await connection.query(
                    `UPDATE phan_cong_nhan_su 
                     SET day_chuyen_id = ?, cong_doan_id = ?, trang_thai = 'DANG_LAM' 
                     WHERE id = ?`,
                    [day_chuyen_id, cong_doan_id, existing[0].id]
                );
            } else {
                await connection.query(
                    `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
                     VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
                    [nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay]
                );
            }

            // Ghi nhat_ky_phan_cong
            await connection.query(
                `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                 VALUES (?, ?, ?, ?, ?, 'GAN')`,
                [nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay]
            );

            await connection.commit();
            return { success: true, nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    /**
     * Gỡ phân bổ nhân sự tăng ca
     */
    static async goPhanBoTangCa({ nhan_vien_id, ca_lam_id, ngay }) {
        if (!nhan_vien_id || !ca_lam_id || !ngay) {
            throw new ApiError(400, "Thiếu thông tin để gỡ phân công");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [pc] = await connection.query(
                "SELECT day_chuyen_id, cong_doan_id FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ca_lam_id = ? AND ngay = ? LIMIT 1",
                [nhan_vien_id, ca_lam_id, ngay]
            );

            if (pc.length > 0) {
                await connection.query(
                    "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ca_lam_id = ? AND ngay = ?",
                    [nhan_vien_id, ca_lam_id, ngay]
                );

                await connection.query(
                    `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                     VALUES (?, ?, ?, ?, ?, 'GO')`,
                    [nhan_vien_id, pc[0].day_chuyen_id, pc[0].cong_doan_id, ca_lam_id, ngay]
                );
            }

            await connection.commit();
            return { success: true };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    /**
     * Tự động phân bổ nhân sự đã duyệt tăng ca vào dây chuyền theo tay nghề & cấp độ chứng chỉ
     */
    static async tuDongPhanBoTangCa({ day_chuyen_id, ca_lam_id, ngay }) {
        if (!day_chuyen_id || !ca_lam_id || !ngay) {
            throw new ApiError(400, "Dây chuyền, Ca làm và Ngày là bắt buộc để phân bổ tự động");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Lấy định biên nhu cầu nhân sự của dây chuyền
            const [requirements] = await connection.query(
                `SELECT yc.cong_doan_id, yc.so_luong_can, cd.ten_cong_doan
                 FROM yeu_cau_nhan_su yc
                 JOIN cong_doan cd ON yc.cong_doan_id = cd.id
                 WHERE yc.day_chuyen_id = ?`,
                [day_chuyen_id]
            );

            if (requirements.length === 0) {
                throw new ApiError(400, "Dây chuyền chưa thiết lập định biên nhu cầu công đoạn");
            }

            // 2. Lấy danh sách nhân viên đã được DUYỆT TĂNG CA vào ca đó, chưa được phân bổ
            const [approvedStaff] = await connection.query(
                `SELECT dk.nhan_vien_id, nv.ho_ten, nv.ma_nhan_vien
                 FROM dang_ky_tang_ca dk
                 JOIN nhan_vien nv ON dk.nhan_vien_id = nv.id
                 LEFT JOIN phan_cong_nhan_su pc ON (pc.nhan_vien_id = nv.id AND pc.ca_lam_id = dk.ca_lam_id AND pc.ngay = dk.ngay)
                 WHERE dk.trang_thai = 'DA_DUYET' AND dk.ngay = ? AND dk.ca_lam_id = ? AND pc.id IS NULL`,
                [ngay, ca_lam_id]
            );

            if (approvedStaff.length === 0) {
                throw new ApiError(400, "Không có nhân sự đã duyệt tăng ca nào đang chờ phân bổ");
            }

            // Lấy danh sách chứng chỉ hiệu lực của các nhân viên này
            const staffIds = approvedStaff.map(s => s.nhan_vien_id);
            const [certificates] = await connection.query(
                `SELECT ccnv.nhan_vien_id, ccnv.cap_do, cc.ten_chung_chi, cc.id AS chung_chi_id
                 FROM chung_chi_nhan_vien ccnv
                 JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
                 WHERE ccnv.nhan_vien_id IN (?) AND ccnv.trang_thai = 'HIEU_LUC'`,
                [staffIds]
            );

            const staffSkillMap = {};
            for (const s of approvedStaff) {
                staffSkillMap[s.nhan_vien_id] = certificates.filter(c => c.nhan_vien_id === s.nhan_vien_id);
            }

            const assignedSet = new Set();
            let assignedCount = 0;

            // Phase 1: Phân bổ ưu tiên theo đúng chứng chỉ kỹ năng (Nhân sự có chứng chỉ cấp độ cao xếp trước)
            for (const req of requirements) {
                const [currentAssigned] = await connection.query(
                    `SELECT COUNT(*) AS total 
                     FROM phan_cong_nhan_su 
                     WHERE day_chuyen_id = ? AND cong_doan_id = ? AND ca_lam_id = ? AND ngay = ?`,
                    [day_chuyen_id, req.cong_doan_id, ca_lam_id, ngay]
                );
                let current = currentAssigned[0].total;
                let needed = req.so_luong_can - current;

                if (needed <= 0) continue;

                const tenChungChiYeuCau = req.ten_cong_doan.replace(/\s+\d+$/, "").trim();

                const candidates = approvedStaff
                    .filter(s => !assignedSet.has(s.nhan_vien_id))
                    .map(s => {
                        const matchedCert = (staffSkillMap[s.nhan_vien_id] || []).find(
                            c => c.ten_chung_chi.toLowerCase() === tenChungChiYeuCau.toLowerCase()
                        );
                        return {
                            ...s,
                            cap_do: matchedCert ? matchedCert.cap_do : 0
                        };
                    })
                    .filter(c => c.cap_do > 0)
                    .sort((a, b) => b.cap_do - a.cap_do);

                for (const candidate of candidates) {
                    if (needed <= 0) break;

                    await connection.query(
                        `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
                         VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
                        [candidate.nhan_vien_id, day_chuyen_id, req.cong_doan_id, ca_lam_id, ngay]
                    );

                    await connection.query(
                        `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                         VALUES (?, ?, ?, ?, ?, 'GAN')`,
                        [candidate.nhan_vien_id, day_chuyen_id, req.cong_doan_id, ca_lam_id, ngay]
                    );

                    assignedSet.add(candidate.nhan_vien_id);
                    assignedCount++;
                    needed--;
                }
            }

            // Phase 2: Phân bổ các công đoạn còn thiếu người bằng nhân sự chưa được phân công
            for (const req of requirements) {
                const [currentAssigned] = await connection.query(
                    `SELECT COUNT(*) AS total 
                     FROM phan_cong_nhan_su 
                     WHERE day_chuyen_id = ? AND cong_doan_id = ? AND ca_lam_id = ? AND ngay = ?`,
                    [day_chuyen_id, req.cong_doan_id, ca_lam_id, ngay]
                );
                let current = currentAssigned[0].total;
                let needed = req.so_luong_can - current;

                if (needed <= 0) continue;

                const remainingStaff = approvedStaff.filter(s => !assignedSet.has(s.nhan_vien_id));

                for (const staff of remainingStaff) {
                    if (needed <= 0) break;

                    await connection.query(
                        `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
                         VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
                        [staff.nhan_vien_id, day_chuyen_id, req.cong_doan_id, ca_lam_id, ngay]
                    );

                    await connection.query(
                        `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                         VALUES (?, ?, ?, ?, ?, 'GAN')`,
                        [staff.nhan_vien_id, day_chuyen_id, req.cong_doan_id, ca_lam_id, ngay]
                    );

                    assignedSet.add(staff.nhan_vien_id);
                    assignedCount++;
                    needed--;
                }
            }

            await connection.commit();
            return { assignedCount, totalApproved: approvedStaff.length };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

export default TangCaService;
