import pool from "../config/db.js";
import ApiError from "../utils/api_error.js";
import { ghiNhatKyHeThong } from "../utils/nhat_ky.js";

class TangCaService {
    /**
     * Helper kiểm tra phạm vi quyền quản lý của Leader (nếu có)
     */
    static async _layRanhGioiLeader(nguoiDung) {
        if (!nguoiDung || ["ADMIN", "MANAGER"].includes(nguoiDung.role)) {
            return null; // ADMIN / MANAGER có toàn quyền
        }
        const [nvRows] = await pool.query(
            "SELECT id, day_chuyen_id, ca_lam_id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1",
            [nguoiDung.id]
        );
        if (nvRows.length > 0) {
            return {
                nhan_vien_id: nvRows[0].id,
                day_chuyen_id: nvRows[0].day_chuyen_id,
                ca_lam_id: nvRows[0].ca_lam_id,
                role: nguoiDung.role
            };
        }
        return null;
    }

    /**
     * Lấy danh sách ứng viên có thể chọn tăng ca trong ngày & ca làm việc (Loại bỏ những người đã được chọn/duyệt trong ngày đó)
     * Hỗ trợ lọc theo danh sách nhiều dây chuyền (day_chuyen_ids) và phân quyền Leader
     */
    static async layDanhSachUngVienTangCa({ ngay, ca_lam_id, day_chuyen_ids, q, nguoiDung } = {}) {
        let sql = `
            SELECT nv.id, nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, nv.day_chuyen_id, nv.ca_lam_id AS ca_lam_goc_id,
                   dc.ten_day_chuyen,
                   cl.ten_ca AS ten_ca_goc
            FROM nhan_vien nv
            LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
            LEFT JOIN ca_lam_viec cl ON nv.ca_lam_id = cl.id
            WHERE nv.trang_thai = 'DANG_LAM' 
              AND nv.chuc_vu = 'NHAN_VIEN'
        `;
        const params = [];

        // Ràng buộc Phân quyền: Nếu là Leader, chỉ xem ứng viên thuộc ca làm / dây chuyền quản lý
        const leaderInfo = await TangCaService._layRanhGioiLeader(nguoiDung);
        if (leaderInfo) {
            if (leaderInfo.ca_lam_id) {
                sql += ` AND (nv.ca_lam_id = ? OR nv.ca_lam_id IS NULL)`;
                params.push(leaderInfo.ca_lam_id);
            }
            if (leaderInfo.role === "LEADER_LINE" && leaderInfo.day_chuyen_id) {
                sql += ` AND nv.day_chuyen_id = ?`;
                params.push(leaderInfo.day_chuyen_id);
            }
        }

        // Ràng buộc: LOẠI BỎ những người ĐÃ ĐƯỢC CHỌN HOẶC DUYỆT TĂNG CA trong ngày & ca làm này (KHÔNG ĐƯỢC TRÙNG)
        if (ngay && ca_lam_id) {
            sql += `
                AND nv.id NOT IN (
                    SELECT nhan_vien_id FROM dang_ky_tang_ca 
                    WHERE ngay = ? AND ca_lam_id = ? AND trang_thai IN ('CHO_DUYET', 'DA_DUYET')
                )
            `;
            params.push(ngay, ca_lam_id);
        }

        // Lọc theo nhiều dây chuyền nếu được chọn
        let dcIds = [];
        if (Array.isArray(day_chuyen_ids)) {
            dcIds = day_chuyen_ids.map(id => Number(id)).filter(id => Boolean(id));
        } else if (day_chuyen_ids) {
            dcIds = String(day_chuyen_ids).split(',').map(id => Number(id.trim())).filter(id => Boolean(id));
        }

        if (dcIds.length > 0) {
            sql += ` AND nv.day_chuyen_id IN (?)`;
            params.push(dcIds);
        }

        if (q) {
            sql += ` AND (nv.ho_ten LIKE ? OR nv.ma_nhan_vien LIKE ? OR dc.ten_day_chuyen LIKE ?)`;
            const likeQ = `%${q}%`;
            params.push(likeQ, likeQ, likeQ);
        }

        sql += " ORDER BY dc.ten_day_chuyen ASC, nv.ho_ten ASC";

        const [rows] = await pool.query(sql, params);

        // Gán kỹ năng / chứng chỉ cho từng nhân viên và tính điểm cấp độ
        for (const item of rows) {
            const [skills] = await pool.query(
                `SELECT ccnv.cap_do, cc.ten_chung_chi 
                 FROM chung_chi_nhan_vien ccnv
                 JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
                 WHERE ccnv.nhan_vien_id = ? AND ccnv.trang_thai = 'HIEU_LUC'`,
                [item.id]
            );
            item.ky_nang_list = skills;
            item.max_cap_do = skills.reduce((max, s) => Math.max(max, s.cap_do || 0), 0);
            item.so_luong_chung_chi = skills.length;
        }

        // Sắp xếp dựa vào chứng chỉ (Cấp độ cao hơn xếp trước, nhiều chứng chỉ hơn xếp trước)
        rows.sort((a, b) => {
            if (b.max_cap_do !== a.max_cap_do) return b.max_cap_do - a.max_cap_do;
            if (b.so_luong_chung_chi !== a.so_luong_chung_chi) return b.so_luong_chung_chi - a.so_luong_chung_chi;
            return a.ho_ten.localeCompare(b.ho_ten, 'vi');
        });

        return rows;
    }

    /**
     * Lấy danh sách đăng ký tăng ca theo bộ lọc và Phân quyền Leader
     */
    static async layDanhSachDangKyTangCa({ ngay, day_chuyen_id, ca_lam_id, trang_thai, q, nguoiDung } = {}) {
        let sql = `
            SELECT dk.id, dk.nhan_vien_id, dk.ca_lam_id, dk.ngay, dk.trang_thai,
                   nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, nv.so_dien_thoai, nv.day_chuyen_id, nv.ca_lam_id AS ca_lam_goc_id,
                   cl_goc.ten_ca AS ten_ca_goc,
                   dc.ten_day_chuyen,
                   cl.ten_ca, cl.gio_bat_dau, cl.gio_ket_thuc, cl.loai_ca
            FROM dang_ky_tang_ca dk
            JOIN nhan_vien nv ON dk.nhan_vien_id = nv.id
            JOIN ca_lam_viec cl ON dk.ca_lam_id = cl.id
            LEFT JOIN ca_lam_viec cl_goc ON nv.ca_lam_id = cl_goc.id
            LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
            WHERE 1=1
        `;
        const params = [];

        // Ràng buộc Phân quyền Leader
        const leaderInfo = await TangCaService._layRanhGioiLeader(nguoiDung);
        if (leaderInfo) {
            if (leaderInfo.ca_lam_id) {
                sql += ` AND (dk.ca_lam_id = ? OR nv.ca_lam_id = ?)`;
                params.push(leaderInfo.ca_lam_id, leaderInfo.ca_lam_id);
            }
            if (leaderInfo.role === "LEADER_LINE" && leaderInfo.day_chuyen_id) {
                sql += ` AND nv.day_chuyen_id = ?`;
                params.push(leaderInfo.day_chuyen_id);
            }
        }

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

        // Đính kèm thông tin chứng chỉ/kỹ năng cho từng nhân viên và tính điểm cấp độ
        for (const item of rows) {
            const [skills] = await pool.query(
                `SELECT ccnv.cap_do, cc.ten_chung_chi 
                 FROM chung_chi_nhan_vien ccnv
                 JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
                 WHERE ccnv.nhan_vien_id = ? AND ccnv.trang_thai = 'HIEU_LUC'`,
                [item.nhan_vien_id]
            );
            item.ky_nang_list = skills;
            item.max_cap_do = skills.reduce((max, s) => Math.max(max, s.cap_do || 0), 0);
            item.so_luong_chung_chi = skills.length;
        }

        // Sắp xếp ưu tiên nhân sự có chứng chỉ cấp độ cao lên đầu danh sách
        rows.sort((a, b) => {
            if (b.max_cap_do !== a.max_cap_do) return b.max_cap_do - a.max_cap_do;
            if (b.so_luong_chung_chi !== a.so_luong_chung_chi) return b.so_luong_chung_chi - a.so_luong_chung_chi;
            return a.ho_ten.localeCompare(b.ho_ten, 'vi');
        });

        return rows;
    }

    /**
     * Đăng ký tăng ca cho 1 hoặc nhiều nhân viên
     */
    static async taoDangKyTangCa({ nhan_vien_ids, ca_lam_id, ngay, trang_thai = 'CHO_DUYET', chi_tiet_day_chuyen = null, nguoi_thuc_hien = "Hệ thống", role_nguoi_thuc_hien = "ADMIN" }) {
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

            // Truy vấn thông tin bổ sung để ghi Nhật ký
            const [caRows] = await connection.query("SELECT ten_ca, gio_bat_dau, gio_ket_thuc FROM ca_lam_viec WHERE id = ?", [ca_lam_id]);
            const tenCa = caRows.length > 0 ? caRows[0].ten_ca : `Ca #${ca_lam_id}`;

            const [nvRows] = await connection.query(
                `SELECT nv.ma_nhan_vien, nv.ho_ten, dc.ten_day_chuyen
                 FROM nhan_vien nv
                 LEFT JOIN day_chuyen dc ON nv.day_chuyen_id = dc.id
                 WHERE nv.id IN (?)`,
                [nvIds]
            );

            // Lấy danh sách chứng chỉ hiệu lực của các nhân viên này
            const [ccRows] = await connection.query(
                `SELECT ccnv.nhan_vien_id, cc.ten_chung_chi, ccnv.cap_do
                 FROM chung_chi_nhan_vien ccnv
                 JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
                 WHERE ccnv.nhan_vien_id IN (?) AND ccnv.trang_thai = 'HIEU_LUC'`,
                [nvIds]
            );

            const nvSkillsMap = {};
            ccRows.forEach(c => {
                if (!nvSkillsMap[c.nhan_vien_id]) nvSkillsMap[c.nhan_vien_id] = [];
                nvSkillsMap[c.nhan_vien_id].push(`${c.ten_chung_chi} (Cấp ${c.cap_do})`);
            });

            const dsNvStr = nvRows.map(n => {
                const skills = nvSkillsMap[n.id] ? ` [Chứng chỉ: ${nvSkillsMap[n.id].join(", ")}]` : " [Chưa có CC]";
                return `${n.ho_ten} (${n.ma_nhan_vien} - ${n.ten_day_chuyen || 'Chưa gán Line'})${skills}`;
            }).join("; ");

            let chiTietLineStr = "";
            if (chi_tiet_day_chuyen && typeof chi_tiet_day_chuyen === "object") {
                const lineEntries = Object.entries(chi_tiet_day_chuyen).map(([lineName, qty]) => `${lineName}: ${qty} người`);
                if (lineEntries.length > 0) {
                    chiTietLineStr = ` | Phân bổ số lượng từng dây chuyền: (${lineEntries.join(", ")})`;
                }
            }

            await connection.commit();

            // Ghi nhật ký lịch sử hệ thống
            await ghiNhatKyHeThong({
                loai_doi_tuong: "TANG_CA",
                hanh_dong: "TAO_MOI",
                doi_tuong_id: ca_lam_id,
                ten_doi_tuong: `Tăng ca ${tenCa} (${ngay})`,
                chi_tiet: `Đã lập & duyệt danh sách tăng ca cho ${successCount} nhân viên vào ngày ${ngay}, ca ${tenCa}.${chiTietLineStr} | Người lập/Quản lý: ${nguoi_thuc_hien} | Danh sách nhân viên & chứng chỉ: ${dsNvStr}`,
                nguoi_thuc_hien,
                role_nguoi_thuc_hien
            });

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
    static async duyetDangKyTangCa({ ids, trang_thai, nguoi_thuc_hien = "Hệ thống", role_nguoi_thuc_hien = "ADMIN" }) {
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

        // Lấy thông tin các bản ghi đăng ký trước khi cập nhật để ghi log
        const [oldRows] = await pool.query(
            `SELECT dk.id, dk.ngay, nv.ho_ten, nv.ma_nhan_vien, cl.ten_ca
             FROM dang_ky_tang_ca dk
             JOIN nhan_vien nv ON dk.nhan_vien_id = nv.id
             JOIN ca_lam_viec cl ON dk.ca_lam_id = cl.id
             WHERE dk.id IN (?)`,
            [targetIds]
        );

        const [result] = await pool.query(
            "UPDATE dang_ky_tang_ca SET trang_thai = ? WHERE id IN (?)",
            [trang_thai, targetIds]
        );

        const tenTrangThaiMap = {
            'DA_DUYET': 'Đã duyệt',
            'TU_CHOI': 'Từ chối',
            'CHO_DUYET': 'Chờ duyệt'
        };

        const dsNvInfo = oldRows.map(r => `${r.ho_ten} (${r.ma_nhan_vien} - Ca ${r.ten_ca} ngày ${r.ngay})`).join("; ");

        await ghiNhatKyHeThong({
            loai_doi_tuong: "TANG_CA",
            hanh_dong: trang_thai,
            ten_doi_tuong: `Duyệt tăng ca [${tenTrangThaiMap[trang_thai] || trang_thai}]`,
            chi_tiet: `Đã chuyển trạng thái sang [${tenTrangThaiMap[trang_thai] || trang_thai}] cho ${oldRows.length} đăng ký tăng ca. Người duyệt: ${nguoi_thuc_hien}. Danh sách: ${dsNvInfo}`,
            nguoi_thuc_hien,
            role_nguoi_thuc_hien
        });

        return { affectedRows: result.affectedRows, trang_thai };
    }

    /**
     * Xóa / Hủy đăng ký tăng ca
     */
    static async xoaDangKyTangCa(id, nguoi_thuc_hien = "Hệ thống", role_nguoi_thuc_hien = "ADMIN") {
        const [oldRows] = await pool.query(
            `SELECT dk.id, dk.ngay, nv.ho_ten, nv.ma_nhan_vien, cl.ten_ca
             FROM dang_ky_tang_ca dk
             JOIN nhan_vien nv ON dk.nhan_vien_id = nv.id
             JOIN ca_lam_viec cl ON dk.ca_lam_id = cl.id
             WHERE dk.id = ? LIMIT 1`,
            [id]
        );

        const [result] = await pool.query("DELETE FROM dang_ky_tang_ca WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            throw new ApiError(404, "Không tìm thấy đơn đăng ký tăng ca để xóa");
        }

        if (oldRows.length > 0) {
            const r = oldRows[0];
            await ghiNhatKyHeThong({
                loai_doi_tuong: "TANG_CA",
                hanh_dong: "XOA",
                doi_tuong_id: id,
                ten_doi_tuong: `Xóa đăng ký tăng ca của ${r.ho_ten}`,
                chi_tiet: `Đã xóa đăng ký tăng ca của nhân viên ${r.ho_ten} (${r.ma_nhan_vien}) - Ca ${r.ten_ca}, Ngày ${r.ngay}. Người thực hiện: ${nguoi_thuc_hien}`,
                nguoi_thuc_hien,
                role_nguoi_thuc_hien
            });
        }

        return true;
    }

    /**
     * Lấy danh sách nhân sự đã được ĐÃ DUYỆT TĂNG CA sẵn sàng phân bổ (có phân quyền Leader)
     */
    static async layDanhSachNhanSuTangCaChoPhanBo({ ngay, ca_lam_id, day_chuyen_id, nguoiDung } = {}) {
        if (!ngay) {
            throw new ApiError(400, "Vui lòng chọn ngày để phân bổ tăng ca");
        }

        let sql = `
            SELECT dk.id AS dang_ky_id, dk.nhan_vien_id, dk.ca_lam_id, dk.ngay,
                   nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, nv.day_chuyen_id AS day_chuyen_goc_id, nv.ca_lam_id AS ca_lam_goc_id,
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

        const leaderInfo = await TangCaService._layRanhGioiLeader(nguoiDung);
        if (leaderInfo) {
            if (leaderInfo.ca_lam_id) {
                sql += " AND (dk.ca_lam_id = ? OR nv.ca_lam_id = ?)";
                params.push(leaderInfo.ca_lam_id, leaderInfo.ca_lam_id);
            }
            if (leaderInfo.role === "LEADER_LINE" && leaderInfo.day_chuyen_id) {
                sql += " AND nv.day_chuyen_id = ?";
                params.push(leaderInfo.day_chuyen_id);
            }
        }

        if (ca_lam_id) {
            sql += " AND (dk.ca_lam_id = ? OR nv.ca_lam_id = ?)";
            params.push(ca_lam_id, ca_lam_id);
        }

        sql += " ORDER BY nv.ho_ten ASC";

        const [rows] = await pool.query(sql, params);

        // Lấy chứng chỉ & kỹ năng tay nghề của nhân sự và tính toán sắp xếp
        for (const item of rows) {
            const [skills] = await pool.query(
                `SELECT ccnv.cap_do, cc.ten_chung_chi, cc.id AS chung_chi_id
                 FROM chung_chi_nhan_vien ccnv
                 JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
                 WHERE ccnv.nhan_vien_id = ? AND ccnv.trang_thai = 'HIEU_LUC'`,
                [item.nhan_vien_id]
            );
            item.ky_nang_list = skills;
            item.max_cap_do = skills.reduce((max, s) => Math.max(max, s.cap_do || 0), 0);
            item.so_luong_chung_chi = skills.length;
        }

        // Sắp xếp ưu tiên nhân sự sở hữu chứng chỉ & cấp độ cao lên đầu danh sách
        rows.sort((a, b) => {
            if (b.max_cap_do !== a.max_cap_do) return b.max_cap_do - a.max_cap_do;
            if (b.so_luong_chung_chi !== a.so_luong_chung_chi) return b.so_luong_chung_chi - a.so_luong_chung_chi;
            return a.ho_ten.localeCompare(b.ho_ten, 'vi');
        });

        return rows;
    }

    /**
     * Phân bổ 1 nhân sự tăng ca vào dây chuyền & công đoạn
     */
    static async phanBoNhanSuTangCa({ nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, nguoi_thuc_hien = "Hệ thống", role_nguoi_thuc_hien = "ADMIN" }) {
        if (!nhan_vien_id || !day_chuyen_id || !cong_doan_id || !ca_lam_id || !ngay) {
            throw new ApiError(400, "Thiếu thông tin phân công tăng ca");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Kiểm tra chứng chỉ kỹ năng của nhân viên nếu công đoạn có yêu cầu chứng chỉ
            const [cdRows] = await connection.query("SELECT ten_cong_doan FROM cong_doan WHERE id = ? LIMIT 1", [cong_doan_id]);
            let tenCongDoanStr = `Công đoạn #${cong_doan_id}`;
            if (cdRows.length > 0) {
                tenCongDoanStr = cdRows[0].ten_cong_doan;
                const tenChungChiYeuCau = tenCongDoanStr.replace(/\s+\d+$/, "").trim();

                const [ccRows] = await connection.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiYeuCau]);
                if (ccRows.length > 0) {
                    const chungChiId = ccRows[0].id;
                    const [ccNvRows] = await connection.query(
                        "SELECT id FROM chung_chi_nhan_vien WHERE nhan_vien_id = ? AND chung_chi_id = ? AND trang_thai = 'HIEU_LUC' LIMIT 1",
                        [nhan_vien_id, chungChiId]
                    );
                    if (ccNvRows.length === 0) {
                        throw new ApiError(400, `Lỗi: Nhân viên chưa có chứng chỉ kỹ năng phù hợp cho công đoạn "${tenCongDoanStr}" (Yêu cầu chứng chỉ: "${tenChungChiYeuCau}")`);
                    }
                }
            }

            // Lấy thông tin NV, Dây chuyền, Ca làm để ghi Nhật ký
            const [nvRows] = await connection.query("SELECT ho_ten, ma_nhan_vien FROM nhan_vien WHERE id = ?", [nhan_vien_id]);
            const [dcRows] = await connection.query("SELECT ten_day_chuyen FROM day_chuyen WHERE id = ?", [day_chuyen_id]);
            const [caRows] = await connection.query("SELECT ten_ca FROM ca_lam_viec WHERE id = ?", [ca_lam_id]);
            
            const [ccNvAll] = await connection.query(
                `SELECT cc.ten_chung_chi, ccnv.cap_do
                 FROM chung_chi_nhan_vien ccnv
                 JOIN chung_chi cc ON ccnv.chung_chi_id = cc.id
                 WHERE ccnv.nhan_vien_id = ? AND ccnv.trang_thai = 'HIEU_LUC'`,
                [nhan_vien_id]
            );

            const nvInfo = nvRows[0] || { ho_ten: `NV #${nhan_vien_id}`, ma_nhan_vien: "" };
            const dcInfo = dcRows[0] || { ten_day_chuyen: `Line #${day_chuyen_id}` };
            const caInfo = caRows[0] || { ten_ca: `Ca #${ca_lam_id}` };
            const skillsStr = ccNvAll.map(c => `${c.ten_chung_chi} (Cấp ${c.cap_do})`).join(", ") || "Chưa có chứng chỉ";

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

            // Ghi nhật ký hệ thống
            await ghiNhatKyHeThong({
                loai_doi_tuong: "PHAN_BO_TANG_CA",
                hanh_dong: "PHAN_BO",
                doi_tuong_id: nhan_vien_id,
                ten_doi_tuong: `Phân bổ tăng ca: ${nvInfo.ho_ten}`,
                chi_tiet: `Đã phân bổ nhân viên ${nvInfo.ho_ten} (${nvInfo.ma_nhan_vien}) vào Dây chuyền [${dcInfo.ten_day_chuyen}] - Công đoạn [${tenCongDoanStr}], Ngày: ${ngay}, Ca: ${caInfo.ten_ca}. Chứng chỉ sở hữu: ${skillsStr}. Người thực hiện: ${nguoi_thuc_hien}`,
                nguoi_thuc_hien,
                role_nguoi_thuc_hien
            });

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
    static async goPhanBoTangCa({ nhan_vien_id, ca_lam_id, ngay, nguoi_thuc_hien = "Hệ thống", role_nguoi_thuc_hien = "ADMIN" }) {
        if (!nhan_vien_id || !ca_lam_id || !ngay) {
            throw new ApiError(400, "Thiếu thông tin để gỡ phân công");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [nvRows] = await connection.query("SELECT ho_ten, ma_nhan_vien FROM nhan_vien WHERE id = ?", [nhan_vien_id]);
            const [caRows] = await connection.query("SELECT ten_ca FROM ca_lam_viec WHERE id = ?", [ca_lam_id]);

            const nvInfo = nvRows[0] || { ho_ten: `NV #${nhan_vien_id}`, ma_nhan_vien: "" };
            const caInfo = caRows[0] || { ten_ca: `Ca #${ca_lam_id}` };

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

            await ghiNhatKyHeThong({
                loai_doi_tuong: "PHAN_BO_TANG_CA",
                hanh_dong: "GO_PHAN_BO",
                doi_tuong_id: nhan_vien_id,
                ten_doi_tuong: `Gỡ phân bổ tăng ca: ${nvInfo.ho_ten}`,
                chi_tiet: `Đã gỡ phân bổ tăng ca của nhân viên ${nvInfo.ho_ten} (${nvInfo.ma_nhan_vien}), Ngày: ${ngay}, Ca: ${caInfo.ten_ca}. Người thực hiện: ${nguoi_thuc_hien}`,
                nguoi_thuc_hien,
                role_nguoi_thuc_hien
            });

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
    static async tuDongPhanBoTangCa({ day_chuyen_id, ca_lam_id, ngay, nguoi_thuc_hien = "Hệ thống", role_nguoi_thuc_hien = "ADMIN" }) {
        if (!day_chuyen_id || !ca_lam_id || !ngay) {
            throw new ApiError(400, "Dây chuyền, Ca làm và Ngày là bắt buộc để phân bổ tự động");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [dcRows] = await connection.query("SELECT ten_day_chuyen FROM day_chuyen WHERE id = ?", [day_chuyen_id]);
            const [caRows] = await connection.query("SELECT ten_ca FROM ca_lam_viec WHERE id = ?", [ca_lam_id]);
            const tenLineStr = dcRows[0]?.ten_day_chuyen || `Line #${day_chuyen_id}`;
            const tenCaStr = caRows[0]?.ten_ca || `Ca #${ca_lam_id}`;

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
                `SELECT dk.nhan_vien_id, nv.ho_ten, nv.ma_nhan_vien, nv.day_chuyen_id AS day_chuyen_goc_id
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
            const assignedDetails = [];

            // Phase 1: Phân bổ ưu tiên nhân sự thuộc ĐÚNG DÂY CHUYỀN GỐC & đúng chứng chỉ kỹ năng (Cấp độ cao xếp trước)
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
                        const isSameLine = Number(s.day_chuyen_goc_id) === Number(day_chuyen_id);
                        return {
                            ...s,
                            cap_do: matchedCert ? matchedCert.cap_do : 0,
                            isSameLine: isSameLine ? 1 : 0
                        };
                    })
                    .filter(c => c.cap_do > 0)
                    // Ưu tiên 1: Đúng Line gốc, Ưu tiên 2: Cấp độ chứng chỉ cao hơn
                    .sort((a, b) => (b.isSameLine - a.isSameLine) || (b.cap_do - a.cap_do));

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
                    assignedDetails.push(`${candidate.ho_ten} -> ${req.ten_cong_doan} (Cấp CC: ${candidate.cap_do})`);
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
                    assignedDetails.push(`${staff.ho_ten} -> ${req.ten_cong_doan} (Phân bổ linh hoạt)`);
                }
            }

            await connection.commit();

            await ghiNhatKyHeThong({
                loai_doi_tuong: "PHAN_BO_TANG_CA",
                hanh_dong: "TU_DONG_PHAN_BO",
                doi_tuong_id: day_chuyen_id,
                ten_doi_tuong: `Tự động phân bổ tăng ca: ${tenLineStr}`,
                chi_tiet: `Đã tự động xếp thành công ${assignedCount}/${approvedStaff.length} nhân sự tăng ca vào Dây chuyền [${tenLineStr}], Ca: ${tenCaStr}, Ngày: ${ngay} dựa trên chứng chỉ & bộ phận. Chi tiết: ${assignedDetails.join("; ")}. Người thực hiện: ${nguoi_thuc_hien}`,
                nguoi_thuc_hien,
                role_nguoi_thuc_hien
            });

            return { assignedCount, totalApproved: approvedStaff.length };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    /**
     * Lấy lịch sử và thống kê tăng ca & phân bổ tăng ca theo ngày/tháng/năm
     */
    static async layLichSuTangCa({ ngay, tu_ngay, den_ngay, thang, nam, loai_doi_tuong, hanh_dong, q, nguoiDung } = {}) {
        let sql = `
            SELECT 
                nk.id,
                nk.loai_doi_tuong,
                nk.hanh_dong,
                nk.doi_tuong_id,
                nk.ten_doi_tuong,
                nk.chi_tiet,
                nk.nguoi_thuc_hien,
                nk.role_nguoi_thuc_hien,
                nk.thoi_gian
            FROM nhat_ky_he_thong nk
            WHERE nk.loai_doi_tuong IN ('TANG_CA', 'PHAN_BO_TANG_CA')
        `;
        const params = [];

        const leaderInfo = await TangCaService._layRanhGioiLeader(nguoiDung);
        if (leaderInfo) {
            const nameStr = nguoiDung.ho_ten || nguoiDung.ten_dang_nhap || "";
            sql += " AND (nk.nguoi_thuc_hien = ? OR nk.chi_tiet LIKE ?)";
            params.push(nameStr, `%${nameStr}%`);
        }

        if (loai_doi_tuong && loai_doi_tuong !== "ALL") {
            sql += " AND nk.loai_doi_tuong = ?";
            params.push(loai_doi_tuong);
        }

        if (hanh_dong && hanh_dong !== "ALL") {
            sql += " AND nk.hanh_dong = ?";
            params.push(hanh_dong);
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
        return rows;
    }
}

export default TangCaService;

