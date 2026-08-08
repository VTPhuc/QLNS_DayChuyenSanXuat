import pool from "../config/db.js";
import ApiError from "../utils/api_error.js";

/**
 * Service quản lý nghiệp vụ Dây chuyền sản xuất
 */
class DayChuyenService {
    static async layDanhSachDayChuyen(nguoiDung) {
        let query = `
            SELECT dc.id, dc.ten_day_chuyen, dc.khu_vuc_id, dc.leader_id, dc.trang_thai,
                   kv.ten_khu_vuc,
                   nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader,
                   (SELECT COALESCE(SUM(so_luong_can), 0) FROM yeu_cau_nhan_su WHERE day_chuyen_id = dc.id) AS total_yeu_cau,
                   (SELECT COUNT(*) FROM phan_cong_nhan_su WHERE day_chuyen_id = dc.id AND ngay = CURDATE()) AS total_hien_co
            FROM day_chuyen dc
            LEFT JOIN khu_vuc kv ON dc.khu_vuc_id = kv.id
            LEFT JOIN nhan_vien nv ON dc.leader_id = nv.id
        `;
        const params = [];

        if (nguoiDung) {
            if (nguoiDung.role === "LEADER_LINE") {
                const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [nguoiDung.id]);
                if (nvRows.length > 0) {
                    query += " WHERE dc.leader_id = ?";
                    params.push(nvRows[0].id);
                } else {
                    return [];
                }
            } else if (nguoiDung.role === "LEADER_KHU_VUC") {
                const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ?", [nguoiDung.id]);
                if (nvRows.length > 0) {
                    const nvId = nvRows[0].id;
                    const [kvRows] = await pool.query("SELECT id FROM khu_vuc WHERE leader_id = ?", [nvId]);
                    if (kvRows.length > 0) {
                        const kvIds = kvRows.map(k => k.id);
                        query += " WHERE dc.khu_vuc_id IN (?)";
                        params.push(kvIds);
                    } else {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        }

        query += " ORDER BY dc.id DESC";
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async timDayChuyenTheoId(id) {
        const [rows] = await pool.query(
            `SELECT dc.id, dc.ten_day_chuyen, dc.khu_vuc_id, dc.leader_id, dc.trang_thai,
                    kv.ten_khu_vuc,
                    nv.ho_ten AS ten_leader, nv.ma_nhan_vien AS ma_leader
             FROM day_chuyen dc
             LEFT JOIN khu_vuc kv ON dc.khu_vuc_id = kv.id
             LEFT JOIN nhan_vien nv ON dc.leader_id = nv.id
             WHERE dc.id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Kiểm tra quyền thao tác trên một dây chuyền theo phạm vi quản lý:
     * - ADMIN: toàn quyền trên mọi dây chuyền.
     * - LEADER_KHU_VUC: chỉ dây chuyền thuộc khu vực mình phụ trách.
     * - LEADER_LINE: chỉ dây chuyền do chính mình làm leader (nếu choPhepLeaderLine = true).
     * Ném ApiError 403 nếu không đủ quyền.
     */
    static async _kiemTraQuyenDayChuyen(dayChuyenId, nguoiDung, choPhepLeaderLine) {
        // Không có nguoiDung => gọi nội bộ (server tin cậy); ADMIN toàn quyền
        if (!nguoiDung || nguoiDung.role === "ADMIN") {
            return;
        }

        const dayChuyen = await DayChuyenService.timDayChuyenTheoId(dayChuyenId);
        if (!dayChuyen) {
            throw new ApiError(404, "Không tìm thấy dây chuyền");
        }

        const [nvRows] = await pool.query("SELECT id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1", [nguoiDung.id]);
        if (nvRows.length === 0) {
            throw new ApiError(403, "Tài khoản chưa được liên kết với nhân viên");
        }
        const nvId = nvRows[0].id;

        if (nguoiDung.role === "LEADER_KHU_VUC") {
            const [kvRows] = await pool.query(
                "SELECT id FROM khu_vuc WHERE id = ? AND leader_id = ? LIMIT 1",
                [dayChuyen.khu_vuc_id, nvId]
            );
            if (kvRows.length === 0) {
                throw new ApiError(403, "Bạn không có quyền thao tác trên dây chuyền thuộc khu vực khác!");
            }
            return;
        }

        if (nguoiDung.role === "LEADER_LINE") {
            if (choPhepLeaderLine && dayChuyen.leader_id === nvId) {
                return;
            }
            throw new ApiError(403, "Bạn không có quyền thao tác trên dây chuyền này!");
        }

        throw new ApiError(403, "Bạn không có quyền thực hiện thao tác này");
    }

    static _chuanHoaTenBoPhan(loai) {
        const map = {
            "lap rap": "Lắp ráp",
            "lắp ráp": "Lắp ráp",
            "cam tay": "Cắm tay",
            "cắm tay": "Cắm tay",
            "van hanh may": "Vận hành máy",
            "vận hành máy": "Vận hành máy",
            "may han": "Máy hàn",
            "máy hàn": "Máy hàn",
            "sau may han": "Sau máy hàn",
            "sau máy hàn": "Sau máy hàn",
            "van hanh aoi": "Vận hành AOI",
            "vận hành aoi": "Vận hành AOI",
            "qc": "QC"
        };
        return map[loai.toLowerCase().trim()] || loai;
    }

    static _layTenChungChiTuCongDoan(tenCongDoan) {
        return tenCongDoan.replace(/\s+\d+$/, "").trim();
    }

    static _isCaTangCa(caLam) {
        if (!caLam) return false;
        if (caLam.loai_ca === 'TANG_CA') return true;
        if (caLam.loai_ca === 'THUONG') return false;

        const tenCa = (caLam.ten_ca || "").toLowerCase();
        if (tenCa.includes("tăng ca") || tenCa.includes("tang ca") || tenCa.includes("ot")) {
            return true;
        }
        const gioBatDau = caLam.gio_bat_dau;
        if (gioBatDau) {
            // trước 5h hoặc 17h
            if (gioBatDau >= "17:00:00" || (gioBatDau >= "05:00:00" && gioBatDau < "08:00:00")) {
                return true;
            }
        }
        return false;
    }

    static async taoDayChuyen({ ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan }) {
        if (!ten_day_chuyen || !khu_vuc_id) {
            throw new ApiError(400, "Tên dây chuyền và Khu vực không được để trống");
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [trungDayChuyen] = await connection.query(
                "SELECT id FROM day_chuyen WHERE ten_day_chuyen = ? AND khu_vuc_id = ? LIMIT 1",
                [ten_day_chuyen, khu_vuc_id]
            );
            if (trungDayChuyen.length > 0) {
                throw new ApiError(409, "Tên dây chuyền đã tồn tại trong khu vực này");
            }

            const [kqDayChuyen] = await connection.query(
                "INSERT INTO day_chuyen (ten_day_chuyen, khu_vuc_id, leader_id, trang_thai) VALUES (?, ?, ?, ?)",
                [ten_day_chuyen, khu_vuc_id, leader_id || null, trang_thai || "HOAT_DONG"]
            );
            const dayChuyenId = kqDayChuyen.insertId;

            if (leader_id) {
                await connection.query(
                    "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ngay >= CURDATE()",
                    [leader_id]
                );
            }

            if (bo_phan && Array.isArray(bo_phan) && bo_phan.length > 0) {
                let index = 1;
                for (const bp of bo_phan) {
                    const tenBoPhanMoi = `${ten_day_chuyen} ${index}`;
                    index++;
                    const soLuongCan = Number(bp.so_luong_can) || 1;
                    const soLuongMin = Number(bp.so_luong_min) || soLuongCan;
                    const soLuongMax = Number(bp.so_luong_max) || soLuongCan;

                    const [kqCongDoan] = await connection.query(
                        "INSERT INTO cong_doan (ten_cong_doan, mo_ta) VALUES (?, ?)",
                        [tenBoPhanMoi, `Bộ phận ${tenBoPhanMoi} thuộc dây chuyền ${ten_day_chuyen}`]
                    );
                    const congDoanId = kqCongDoan.insertId;

                    await connection.query(
                        "INSERT INTO yeu_cau_nhan_su (day_chuyen_id, cong_doan_id, so_luong_can, so_luong_min, so_luong_max) VALUES (?, ?, ?, ?, ?)",
                        [dayChuyenId, congDoanId, soLuongCan, soLuongMin, soLuongMax]
                    );
                }
            }

            await connection.commit();
            return { id: dayChuyenId, ten_day_chuyen, khu_vuc_id, leader_id, trang_thai };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async capNhatDayChuyen(id, { ten_day_chuyen, khu_vuc_id, leader_id, trang_thai, bo_phan }, nguoiDung) {
        if (!ten_day_chuyen || !khu_vuc_id) {
            throw new ApiError(400, "Tên dây chuyền và Khu vực không được để trống");
        }

        const dayChuyen = await DayChuyenService.timDayChuyenTheoId(id);
        if (!dayChuyen) {
            throw new ApiError(404, "Không tìm thấy dây chuyền");
        }

        // LEADER_LINE được phép chỉnh công đoạn/định biên line của mình (choPhepLeaderLine = true)
        await DayChuyenService._kiemTraQuyenDayChuyen(id, nguoiDung, true);

        // LEADER_LINE chỉ được sửa cấu hình công đoạn/định biên, không được đổi
        // khu vực, leader hay trạng thái của dây chuyền.
        if (nguoiDung && nguoiDung.role === "LEADER_LINE") {
            khu_vuc_id = dayChuyen.khu_vuc_id;
            leader_id = dayChuyen.leader_id;
            trang_thai = dayChuyen.trang_thai;
        }

        // LEADER_KHU_VUC không được chuyển dây chuyền sang khu vực khác (ngoài phạm vi quản lý).
        // Khóa khu_vuc_id về giá trị hiện tại để tránh điều chuyển line ra/vào khu vực không thuộc quyền.
        if (nguoiDung && nguoiDung.role === "LEADER_KHU_VUC") {
            khu_vuc_id = dayChuyen.khu_vuc_id;
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [trungDayChuyen] = await connection.query(
                "SELECT id FROM day_chuyen WHERE ten_day_chuyen = ? AND khu_vuc_id = ? AND id != ? LIMIT 1",
                [ten_day_chuyen, khu_vuc_id, id]
            );
            if (trungDayChuyen.length > 0) {
                throw new ApiError(409, "Tên dây chuyền đã tồn tại trong khu vực này");
            }

            await connection.query(
                "UPDATE day_chuyen SET ten_day_chuyen = ?, khu_vuc_id = ?, leader_id = ?, trang_thai = ? WHERE id = ?",
                [ten_day_chuyen, khu_vuc_id, leader_id || null, trang_thai || "HOAT_DONG", id]
            );

            if (leader_id) {
                await connection.query(
                    "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ngay >= CURDATE()",
                    [leader_id]
                );
            }

            if (bo_phan && Array.isArray(bo_phan)) {
                const [rowsYc] = await connection.query(
                    "SELECT cong_doan_id FROM yeu_cau_nhan_su WHERE day_chuyen_id = ?",
                    [id]
                );
                const listCongDoanIdsHienTai = rowsYc.map(r => r.cong_doan_id);

                const listCongDoanIdsGuiLen = bo_phan
                    .filter(bp => bp.cong_doan_id)
                    .map(bp => Number(bp.cong_doan_id));

                const listIdsXoa = listCongDoanIdsHienTai.filter(idHienTai => !listCongDoanIdsGuiLen.includes(idHienTai));
                if (listIdsXoa.length > 0) {
                    await connection.query(
                        "DELETE FROM yeu_cau_nhan_su WHERE day_chuyen_id = ? AND cong_doan_id IN (?)",
                        [id, listIdsXoa]
                    );
                    try {
                        await connection.query("DELETE FROM cong_doan WHERE id IN (?)", [listIdsXoa]);
                    } catch (e) {
                        console.log("Không thể xóa một số công đoạn khỏi bảng cong_doan:", e.message);
                    }
                }

                let index = 1;
                for (const bp of bo_phan) {
                    const soLuongCan = Number(bp.so_luong_can) || 1;
                    const soLuongMin = Number(bp.so_luong_min) || soLuongCan;
                    const soLuongMax = Number(bp.so_luong_max) || soLuongCan;
                    const tenBoPhanMoi = `${ten_day_chuyen} ${index}`;
                    index++;
                    
                    if (bp.cong_doan_id) {
                        await connection.query(
                            "UPDATE cong_doan SET ten_cong_doan = ? WHERE id = ?",
                            [tenBoPhanMoi, bp.cong_doan_id]
                        );
                        await connection.query(
                            "UPDATE yeu_cau_nhan_su SET so_luong_can = ?, so_luong_min = ?, so_luong_max = ? WHERE day_chuyen_id = ? AND cong_doan_id = ?",
                            [soLuongCan, soLuongMin, soLuongMax, id, bp.cong_doan_id]
                        );
                    } else {
                        const [kqCongDoan] = await connection.query(
                            "INSERT INTO cong_doan (ten_cong_doan, mo_ta) VALUES (?, ?)",
                            [tenBoPhanMoi, `Bộ phận ${tenBoPhanMoi} thuộc dây chuyền ${ten_day_chuyen}`]
                        );
                        const newCongDoanId = kqCongDoan.insertId;

                        await connection.query(
                            "INSERT INTO yeu_cau_nhan_su (day_chuyen_id, cong_doan_id, so_luong_can, so_luong_min, so_luong_max) VALUES (?, ?, ?, ?, ?)",
                            [id, newCongDoanId, soLuongCan, soLuongMin, soLuongMax]
                        );
                    }
                }
            }

            await connection.commit();
            return { id, ten_day_chuyen, khu_vuc_id, leader_id, trang_thai };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async xoaDayChuyen(id) {
        const dayChuyen = await DayChuyenService.timDayChuyenTheoId(id);
        if (!dayChuyen) {
            throw new ApiError(404, "Không tìm thấy dây chuyền");
        }

        const [nhanVien] = await pool.query("SELECT id FROM nhan_vien WHERE day_chuyen_id = ? LIMIT 1", [id]);
        if (nhanVien.length > 0) {
            throw new ApiError(400, "Không thể xóa dây chuyền đang có nhân viên vận hành");
        }

        const [yauCau] = await pool.query("SELECT cong_doan_id FROM yeu_cau_nhan_su WHERE day_chuyen_id = ?", [id]);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query("DELETE FROM yeu_cau_nhan_su WHERE day_chuyen_id = ?", [id]);

            if (yauCau.length > 0) {
                const listIds = yauCau.map(y => y.cong_doan_id);
                await connection.query("DELETE FROM cong_doan WHERE id IN (?)", [listIds]);
            }

            await connection.query("DELETE FROM day_chuyen WHERE id = ?", [id]);

            await connection.commit();
            return true;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async layDanhSachLeaderLine() {
        const [rows] = await pool.query(
            `SELECT id, ho_ten, ma_nhan_vien 
             FROM nhan_vien 
             WHERE chuc_vu = 'LEADER_LINE' AND trang_thai = 'DANG_LAM'`
        );
        return rows;
    }

    static async layChiTietDayChuyen(id, ngayYeuCau, caLamIdYeuCau, nguoiDung) {
        const ngay = ngayYeuCau || new Date().toISOString().split("T")[0];

        const dayChuyen = await DayChuyenService.timDayChuyenTheoId(id);
        if (!dayChuyen) {
            throw new ApiError(404, "Không tìm thấy dây chuyền");
        }

        // Lấy danh sách ca làm việc để chọn hoặc mặc định
        const [caLamList] = await pool.query("SELECT * FROM ca_lam_viec ORDER BY ten_ca ASC");
        if (caLamList.length === 0) {
            throw new ApiError(500, "Hệ thống chưa cấu hình ca làm việc nào!");
        }

        // Xác định ca làm việc của Leader (nếu không phải Admin/Manager)
        let caLamIdCuaToi = null;
        if (nguoiDung && !["ADMIN", "MANAGER"].includes(nguoiDung.role)) {
            const [nvMe] = await pool.query("SELECT ca_lam_id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1", [nguoiDung.id]);
            if (nvMe.length > 0 && nvMe[0].ca_lam_id) {
                caLamIdCuaToi = nvMe[0].ca_lam_id;
            }
        }

        let caLamId = caLamIdYeuCau;

        // Nếu là Leader, bắt buộc khóa ca về ca của chính mình
        if (caLamIdCuaToi) {
            caLamId = caLamIdCuaToi;
        } else {
            // Admin/Manager: cho phép 'ALL' hoặc id ca cụ thể
            if (!caLamId) {
                caLamId = "ALL";
            }
        }

        let caLamHienTai = null;
        if (caLamId !== "ALL") {
            caLamHienTai = caLamList.find(c => c.id === Number(caLamId)) || caLamList[0];
        }

        const [boPhans] = await pool.query(
            `SELECT cd.id AS cong_doan_id, cd.ten_cong_doan, yc.so_luong_can, yc.so_luong_min, yc.so_luong_max
             FROM yeu_cau_nhan_su yc
             JOIN cong_doan cd ON yc.cong_doan_id = cd.id
             WHERE yc.day_chuyen_id = ?
             ORDER BY cd.ten_cong_doan ASC`,
            [id]
        );

        const chiTietBoPhan = [];
        for (const bp of boPhans) {
            let sqlNhanSu = `
                SELECT pc.id AS phan_cong_id, 
                       nv.id AS nhan_vien_id, 
                       nv.ho_ten, 
                       nv.ma_nhan_vien, 
                       nv.gioi_tinh, 
                       nv.so_dien_thoai, 
                       pc.trang_thai AS phan_cong_trang_thai,
                       pc.ca_lam_id,
                       cl.ten_ca AS ten_ca_phan_cong,
                       nv.ca_lam_id AS ca_lam_id_goc,
                       nv_cl.ten_ca AS ten_ca_goc
                FROM phan_cong_nhan_su pc
                JOIN nhan_vien nv ON pc.nhan_vien_id = nv.id
                LEFT JOIN ca_lam_viec cl ON pc.ca_lam_id = cl.id
                LEFT JOIN ca_lam_viec nv_cl ON nv.ca_lam_id = nv_cl.id
                WHERE pc.day_chuyen_id = ? AND pc.cong_doan_id = ? AND pc.ngay = ?
            `;
            const paramsNhanSu = [id, bp.cong_doan_id, ngay];

            if (caLamId !== "ALL") {
                const targetCaId = caLamHienTai ? caLamHienTai.id : Number(caLamId);
                sqlNhanSu += ` AND (pc.ca_lam_id = ? OR nv.ca_lam_id = ?)`;
                paramsNhanSu.push(targetCaId, targetCaId);
            }

            const [nhanSuDaGan] = await pool.query(sqlNhanSu, paramsNhanSu);

            // Chỉ đếm những người có trạng thái hoạt động (không phải 'NGHI')
            const soLuongDaGan = nhanSuDaGan.filter(ns => ns.phan_cong_trang_thai !== 'NGHI').length;
            const soLuongMin = bp.so_luong_min !== null ? bp.so_luong_min : bp.so_luong_can;
            const soLuongMax = bp.so_luong_max !== null ? bp.so_luong_max : bp.so_luong_can;
            
            let trangThai = "DU";
            let thieuNguoi = 0;
            let duNguoi = 0;

            if (soLuongDaGan < soLuongMin) {
                trangThai = "THIEU";
                thieuNguoi = Math.max(soLuongMin - soLuongDaGan, 0);
            } else if (soLuongDaGan > soLuongMax) {
                trangThai = "DU_THUA";
                duNguoi = Math.max(soLuongDaGan - soLuongMax, 0);
            }

            chiTietBoPhan.push({
                cong_doan_id: bp.cong_doan_id,
                ten_bo_phan: bp.ten_cong_doan,
                so_luong_can: bp.so_luong_can,
                so_luong_min: soLuongMin,
                so_luong_max: soLuongMax,
                so_luong_da_gan: soLuongDaGan,
                trang_thai: trangThai,
                so_luong_thieu: thieuNguoi,
                so_luong_du: duNguoi,
                nhan_vien: nhanSuDaGan
            });
        }

        return {
            day_chuyen: dayChuyen,
            ten_day_chuyen: dayChuyen ? dayChuyen.ten_day_chuyen : "",
            ngay: ngay,
            ca_lam_hien_tai: caLamHienTai,
            danh_sach_ca_lam: caLamList,
            ca_lam_id_cua_toi: caLamIdCuaToi,
            bo_phan: chiTietBoPhan,
            yeu_cau_nhan_su: chiTietBoPhan.map(bp => ({
                cong_doan_id: bp.cong_doan_id,
                ten_cong_doan: bp.ten_bo_phan,
                so_luong_can: bp.so_luong_can,
                so_luong_min: bp.so_luong_min,
                so_luong_max: bp.so_luong_max,
                so_luong_da_gan: bp.so_luong_da_gan
            }))
        };
    }

    static async layUngVienChoBoPhan({ congDoanId, ngay, caLamId, nguoiDung }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

        const [cdRows] = await pool.query("SELECT ten_cong_doan FROM cong_doan WHERE id = ? LIMIT 1", [congDoanId]);
        if (cdRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy bộ phận này");
        }

        const tenBoPhan = cdRows[0].ten_cong_doan;
        const tenChungChiRequired = DayChuyenService._layTenChungChiTuCongDoan(tenBoPhan);

        // Lấy thông tin ca làm hiện tại để check xem có phải ca OT hay không
        let caLam = null;
        if (caLamId && caLamId !== "ALL") {
            const [clRows] = await pool.query("SELECT * FROM ca_lam_viec WHERE id = ? LIMIT 1", [caLamId]);
            if (clRows.length > 0) caLam = clRows[0];
        }

        const isOvertime = caLam ? DayChuyenService._isCaTangCa(caLam) : false;

        // Lấy thông tin hồ sơ nhân sự của người đang đăng nhập (Leader)
        let leaderNv = null;
        if (nguoiDung && ["LEADER_KHU_VUC", "LEADER_LINE"].includes(nguoiDung.role)) {
            const [rows] = await pool.query(
                "SELECT id, ca_lam_id, day_chuyen_id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1",
                [nguoiDung.id]
            );
            if (rows.length > 0) leaderNv = rows[0];
        }

        // Xây dựng câu SQL chung cho ứng viên
        let sql = `
            SELECT DISTINCT nv.id, nv.ho_ten, nv.ma_nhan_vien, ccnv.cap_do, nv.ca_lam_id, cl.ten_ca
            FROM nhan_vien nv
            LEFT JOIN chung_chi_nhan_vien ccnv ON nv.id = ccnv.nhan_vien_id AND ccnv.trang_thai = 'HIEU_LUC'
            LEFT JOIN day_chuyen dc_nv ON nv.day_chuyen_id = dc_nv.id
            LEFT JOIN ca_lam_viec cl ON nv.ca_lam_id = cl.id
            WHERE nv.trang_thai = 'DANG_LAM' 
              AND nv.chuc_vu = 'NHAN_VIEN'
              AND nv.id NOT IN (SELECT leader_id FROM day_chuyen WHERE leader_id IS NOT NULL)
        `;
        const params = [];

        // Nếu công đoạn yêu cầu chứng chỉ kỹ năng
        const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiRequired]);
        if (ccRows.length > 0) {
            sql += ` AND ccnv.chung_chi_id = ?`;
            params.push(ccRows[0].id);
        }

        // Lọc theo Ca làm việc
        if (isOvertime) {
            // Tăng ca: Chỉ hiển thị những nhân viên có đăng ký tăng ca đã duyệt cho ca này trong ngày hôm đó
            sql += `
                AND nv.id IN (
                    SELECT nhan_vien_id FROM dang_ky_tang_ca 
                    WHERE ca_lam_id = ? AND ngay = ? AND trang_thai = 'DA_DUYET'
                )
            `;
            params.push(caLamId, ngayDinhDang);
        } else {
            const role = nguoiDung?.role || "NHAN_VIEN";
            const laQuyenCao = ["ADMIN", "MANAGER"].includes(role);
            
            if (laQuyenCao) {
                // ADMIN/MANAGER: xem được nhân viên của TẤT CẢ các ca, phân biệt qua nhãn ten_ca
            } else if (leaderNv && leaderNv.ca_lam_id) {
                // Leader chỉ nhìn thấy nhân viên thuộc ca của chính Leader (cùng ca với mình)
                sql += ` AND nv.ca_lam_id = ?`;
                params.push(leaderNv.ca_lam_id);
            }
        }

        // Lọc theo khu vực quản lý hoặc dây chuyền quản lý
        if (nguoiDung) {
            if (nguoiDung.role === "LEADER_KHU_VUC" && leaderNv) {
                // Leader khu vực chỉ xem được nhân viên của KHU VỰC MÌNH quản lý (hoặc nhân sự tự do chưa gán line)
                const [kvRows] = await pool.query("SELECT id FROM khu_vuc WHERE leader_id = ?", [leaderNv.id]);
                if (kvRows.length > 0) {
                    const kvIds = kvRows.map(k => k.id);
                    sql += ` AND (dc_nv.khu_vuc_id IN (?) OR nv.day_chuyen_id IS NULL)`;
                    params.push(kvIds);
                } else {
                    sql += ` AND 1=0`; // Không quản lý khu vực nào thì không thấy ai
                }
            } else if (nguoiDung.role === "LEADER_LINE" && leaderNv) {
                // Leader line chỉ xem được nhân viên thuộc LINE CỦA MÌNH quản lý
                if (leaderNv.day_chuyen_id) {
                    sql += ` AND nv.day_chuyen_id = ?`;
                    params.push(leaderNv.day_chuyen_id);
                } else {
                    sql += ` AND 1=0`; // Chưa quản lý line nào thì không thấy ai
                }
            }
        }

        // Loại bỏ những nhân viên đã bị phân công làm việc ở dây chuyền/ca làm khác trong hôm đó (tránh trùng lịch)
        if (caLamId && caLamId !== "ALL") {
            sql += `
                AND nv.id NOT IN (
                    SELECT nhan_vien_id FROM phan_cong_nhan_su 
                    WHERE ngay = ? AND ca_lam_id = ? AND trang_thai != 'NGHI'
                )
            `;
            params.push(ngayDinhDang, caLamId);
        } else {
            sql += `
                AND nv.id NOT IN (
                    SELECT nhan_vien_id FROM phan_cong_nhan_su 
                    WHERE ngay = ? AND trang_thai != 'NGHI'
                )
            `;
            params.push(ngayDinhDang);
        }

        const [candidates] = await pool.query(sql, params);
        return candidates;
    }

    static async phanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, nguoiDung }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

        // Chỉ ADMIN hoặc LEADER_KHU_VUC (đúng khu vực) mới được phân công nhân sự
        await DayChuyenService._kiemTraQuyenDayChuyen(day_chuyen_id, nguoiDung, false);

        let leaderNv = null;
        if (nguoiDung && ["LEADER_KHU_VUC", "LEADER_LINE"].includes(nguoiDung.role)) {
            const [rows] = await pool.query("SELECT id, ca_lam_id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1", [nguoiDung.id]);
            if (rows.length > 0) leaderNv = rows[0];
        }

        // Lấy thông tin nhân viên được chọn gán
        const [nvCheckRows] = await pool.query("SELECT chuc_vu, ca_lam_id, day_chuyen_id FROM nhan_vien WHERE id = ? LIMIT 1", [nhan_vien_id]);
        if (nvCheckRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy nhân viên!");
        }
        const nv = nvCheckRows[0];
        if (nv.chuc_vu === "LEADER_LINE" || nv.chuc_vu === "LEADER_KHU_VUC" || nv.chuc_vu === "ADMIN") {
            throw new ApiError(400, `Lỗi: Không thể phân công người có chức vụ ${nv.chuc_vu} làm nhân viên công đoạn!`);
        }

        let caLamId = ca_lam_id;
        if (leaderNv && leaderNv.ca_lam_id) {
            caLamId = leaderNv.ca_lam_id; // Khóa về ca của Leader
        } else if (!caLamId || caLamId === "ALL") {
            // Admin gán ở chế độ "ALL": dùng ca cố định của chính nhân viên được chọn gán
            caLamId = nv.ca_lam_id;
        }

        if (!caLamId || caLamId === "ALL") {
            const [caLamList] = await pool.query("SELECT id FROM ca_lam_viec LIMIT 1");
            if (caLamList.length > 0) {
                caLamId = caLamList[0].id;
            } else {
                const [kqCa] = await pool.query(
                    "INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc) VALUES ('Ca Hanh Chinh', '08:00:00', '17:00:00')"
                );
                caLamId = kqCa.insertId;
            }
        }

        const [caLamRows] = await pool.query("SELECT * FROM ca_lam_viec WHERE id = ? LIMIT 1", [caLamId]);
        if (caLamRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy ca làm việc này!");
        }
        const caLam = caLamRows[0];
        const isOvertime = DayChuyenService._isCaTangCa(caLam);

        // Nếu là Leader, bắt buộc nhân viên được chọn phải thuộc đúng ca của Leader
        if (leaderNv && leaderNv.ca_lam_id) {
            if (nv.ca_lam_id !== leaderNv.ca_lam_id) {
                throw new ApiError(403, "Lỗi phân quyền: Leader khu vực chỉ được phép phân công nhân viên thuộc ca làm việc của mình!");
            }
        }

        // Kiểm tra xem nhân viên này có đang là Leader của bất kỳ dây chuyền nào không
        const [dcCheckRows] = await pool.query("SELECT id FROM day_chuyen WHERE leader_id = ? LIMIT 1", [nhan_vien_id]);
        if (dcCheckRows.length > 0) {
            throw new ApiError(400, "Lỗi: Nhân viên này đang được phân công làm Leader dây chuyền, không thể gán làm nhân viên công đoạn!");
        }

        // Nếu là ca thường, kiểm tra xem nhân viên có thuộc ca cố định này không (Quyền ADMIN / MANAGER được bỏ qua ràng buộc ca)
        const role = nguoiDung?.role || "NHAN_VIEN";
        const laQuyenCao = ["ADMIN", "MANAGER"].includes(role);
        if (!isOvertime && nv.ca_lam_id !== caLamId && !laQuyenCao) {
            throw new ApiError(400, "Lỗi: Nhân viên này có Ca làm cố định khác với ca đang gán!");
        }

        if (isOvertime) {
            const [dangKy] = await pool.query(
                "SELECT id FROM dang_ky_tang_ca WHERE nhan_vien_id = ? AND ca_lam_id = ? AND ngay = ? AND trang_thai = 'DA_DUYET' LIMIT 1",
                [nhan_vien_id, caLamId, ngayDinhDang]
            );
            if (dangKy.length === 0) {
                throw new ApiError(400, "Nhân viên này chưa đăng ký tăng ca hoặc chưa được duyệt tăng ca cho ca làm này trong ngày!");
            }
        }

        // Kiểm tra chứng chỉ kỹ năng phù hợp cho công đoạn
        const [cdRows] = await pool.query("SELECT ten_cong_doan FROM cong_doan WHERE id = ? LIMIT 1", [cong_doan_id]);
        if (cdRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy công đoạn này!");
        }
        const tenCongDoan = cdRows[0].ten_cong_doan;
        const tenChungChiYeuCau = DayChuyenService._layTenChungChiTuCongDoan(tenCongDoan);

        const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiYeuCau]);
        if (ccRows.length > 0) {
            const chungChiId = ccRows[0].id;
            const [ccNvRows] = await pool.query(
                "SELECT id FROM chung_chi_nhan_vien WHERE nhan_vien_id = ? AND chung_chi_id = ? AND trang_thai = 'HIEU_LUC' LIMIT 1",
                [nhan_vien_id, chungChiId]
            );
            if (ccNvRows.length === 0) {
                throw new ApiError(400, `Lỗi: Nhân viên không có chứng chỉ kỹ năng phù hợp cho công đoạn "${tenCongDoan}" (Yêu cầu chứng chỉ: "${tenChungChiYeuCau}")!`);
            }
        }

        const [trungPhanCong] = await pool.query(
            "SELECT id FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ngay = ? AND ca_lam_id = ? AND trang_thai != 'NGHI'",
            [nhan_vien_id, ngayDinhDang, caLamId]
        );

        if (trungPhanCong.length > 0) {
            throw new ApiError(400, "Nhân viên này đã được phân công làm việc ở một bộ phận/dây chuyền khác trong ca làm này!");
        }

        const [hienCo] = await pool.query(
            "SELECT COUNT(*) AS count FROM phan_cong_nhan_su WHERE day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ? AND ca_lam_id = ?",
            [day_chuyen_id, cong_doan_id, ngayDinhDang, caLamId]
        );
        const currentCount = hienCo[0].count;

        const [yeuCau] = await pool.query(
            "SELECT so_luong_max, so_luong_can FROM yeu_cau_nhan_su WHERE day_chuyen_id = ? AND cong_doan_id = ? LIMIT 1",
            [day_chuyen_id, cong_doan_id]
        );

        if (yeuCau.length > 0) {
            const soLuongMax = yeuCau[0].so_luong_max !== null ? yeuCau[0].so_luong_max : yeuCau[0].so_luong_can;
            if (currentCount >= soLuongMax) {
                throw new ApiError(400, `Bộ phận này đã đạt số lượng nhân viên tối đa cho phép (${soLuongMax} người)! Không thể gán thêm.`);
            }
        }

        await pool.query(
            `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
             VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
            [nhan_vien_id, day_chuyen_id, cong_doan_id, caLamId, ngayDinhDang]
        );

        await pool.query(
            `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
             VALUES (?, ?, ?, ?, ?, 'GAN')`,
            [nhan_vien_id, day_chuyen_id, cong_doan_id, caLamId, ngayDinhDang]
        );

        // Nếu gán vào dây chuyền khác với dây chuyền cố định, ghi nhận lịch sử điều động
        if (nv.day_chuyen_id !== Number(day_chuyen_id)) {
            await pool.query(
                `INSERT INTO lich_su_dieu_dong (nhan_vien_id, tu_day_chuyen_id, den_day_chuyen_id, cong_doan_moi_id, ly_do)
                 VALUES (?, ?, ?, ?, ?)`,
                [nhan_vien_id, nv.day_chuyen_id, day_chuyen_id, cong_doan_id, 'Điều động làm việc ngày (Hôm nay)']
            );
        }

        return { success: true, message: "Phân công nhân sự thành công" };
    }

    static async thayDoiNhanSu({ nhan_vien_cu_id, nhan_vien_moi_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, nguoiDung }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

        // Kiểm tra quyền thao tác trên dây chuyền
        await DayChuyenService._kiemTraQuyenDayChuyen(day_chuyen_id, nguoiDung, false);

        let leaderNv = null;
        if (nguoiDung && ["LEADER_KHU_VUC", "LEADER_LINE"].includes(nguoiDung.role)) {
            const [rows] = await pool.query("SELECT id, ca_lam_id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1", [nguoiDung.id]);
            if (rows.length > 0) leaderNv = rows[0];
        }

        const [nvMoiRows] = await pool.query("SELECT id, ho_ten, chuc_vu, ca_lam_id, day_chuyen_id, trang_thai FROM nhan_vien WHERE id = ? LIMIT 1", [nhan_vien_moi_id]);
        if (nvMoiRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy nhân viên mới để thay thế!");
        }
        const nvMoi = nvMoiRows[0];

        if (nvMoi.trang_thai !== 'DANG_LAM' || nvMoi.chuc_vu !== 'NHAN_VIEN') {
            throw new ApiError(400, "Lỗi: Nhân viên thay thế phải đang làm việc và có chức vụ là Nhân viên!");
        }

        // Bắt buộc Leader khu vực chỉ thay đổi nhân viên thuộc ca của mình
        if (leaderNv && leaderNv.ca_lam_id) {
            if (nvMoi.ca_lam_id !== leaderNv.ca_lam_id) {
                throw new ApiError(403, "Lỗi phân quyền: Leader khu vực chỉ được phép thay đổi nhân viên thuộc ca làm việc của mình!");
            }
            const [nvCuRows] = await pool.query("SELECT ca_lam_id FROM nhan_vien WHERE id = ? LIMIT 1", [nhan_vien_cu_id]);
            if (nvCuRows.length > 0 && nvCuRows[0].ca_lam_id !== leaderNv.ca_lam_id) {
                throw new ApiError(403, "Lỗi phân quyền: Leader khu vực chỉ được phép thay đổi nhân viên thuộc ca làm việc của mình!");
            }
        }

        // Kiểm tra chứng chỉ kỹ năng phù hợp
        const [cdRows] = await pool.query("SELECT ten_cong_doan FROM cong_doan WHERE id = ? LIMIT 1", [cong_doan_id]);
        if (cdRows.length > 0) {
            const tenCongDoan = cdRows[0].ten_cong_doan;
            const tenChungChiYeuCau = DayChuyenService._layTenChungChiTuCongDoan(tenCongDoan);
            const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiYeuCau]);
            if (ccRows.length > 0) {
                const chungChiId = ccRows[0].id;
                const [ccNvRows] = await pool.query(
                    "SELECT id FROM chung_chi_nhan_vien WHERE nhan_vien_id = ? AND chung_chi_id = ? AND trang_thai = 'HIEU_LUC' LIMIT 1",
                    [nhan_vien_moi_id, chungChiId]
                );
                if (ccNvRows.length === 0) {
                    throw new ApiError(400, `Lỗi: Nhân viên thay thế không có chứng chỉ kỹ năng phù hợp cho công đoạn "${tenCongDoan}"!`);
                }
            }
        }

        let caLamIdDung = ca_lam_id;
        if (leaderNv && leaderNv.ca_lam_id) caLamIdDung = leaderNv.ca_lam_id;
        if (!caLamIdDung || caLamIdDung === "ALL") caLamIdDung = nvMoi.ca_lam_id;

        if (caLamIdDung) {
            const [trungPhanCong] = await pool.query(
                "SELECT id FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND ngay = ? AND ca_lam_id = ? AND trang_thai != 'NGHI'",
                [nhan_vien_moi_id, ngayDinhDang, caLamIdDung]
            );
            if (trungPhanCong.length > 0) {
                throw new ApiError(400, "Nhân viên thay thế đã được phân công ở một bộ phận/dây chuyền khác trong ca này!");
            }
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Gỡ nhân viên cũ
            await connection.query(
                "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ?",
                [nhan_vien_cu_id, day_chuyen_id, cong_doan_id, ngayDinhDang]
            );
            if (caLamIdDung) {
                await connection.query(
                    `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                     VALUES (?, ?, ?, ?, ?, 'GO')`,
                    [nhan_vien_cu_id, day_chuyen_id, cong_doan_id, caLamIdDung, ngayDinhDang]
                );
            }

            // 2. Gán nhân viên mới
            await connection.query(
                `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
                 VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
                [nhan_vien_moi_id, day_chuyen_id, cong_doan_id, caLamIdDung, ngayDinhDang]
            );
            if (caLamIdDung) {
                await connection.query(
                    `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                     VALUES (?, ?, ?, ?, ?, 'GAN')`,
                    [nhan_vien_moi_id, day_chuyen_id, cong_doan_id, caLamIdDung, ngayDinhDang]
                );
            }

            if (nvMoi.day_chuyen_id !== Number(day_chuyen_id)) {
                await connection.query(
                    `INSERT INTO lich_su_dieu_dong (nhan_vien_id, tu_day_chuyen_id, den_day_chuyen_id, cong_doan_moi_id, ly_do)
                     VALUES (?, ?, ?, ?, ?)`,
                    [nhan_vien_moi_id, nvMoi.day_chuyen_id, day_chuyen_id, cong_doan_id, 'Thay đổi/Thay thế nhân sự trên line']
                );
            }

            await connection.commit();
            return { success: true, message: "Đã thay đổi nhân viên thành công!" };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async goPhanCongNhanSu({ nhan_vien_id, day_chuyen_id, cong_doan_id, ngay, nguoiDung }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

        await DayChuyenService._kiemTraQuyenDayChuyen(day_chuyen_id, nguoiDung, false);

        let leaderNv = null;
        if (nguoiDung && ["LEADER_KHU_VUC", "LEADER_LINE"].includes(nguoiDung.role)) {
            const [rows] = await pool.query("SELECT id, ca_lam_id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1", [nguoiDung.id]);
            if (rows.length > 0) leaderNv = rows[0];
        }

        if (leaderNv && leaderNv.ca_lam_id) {
            const [nvCuRows] = await pool.query("SELECT ca_lam_id FROM nhan_vien WHERE id = ? LIMIT 1", [nhan_vien_id]);
            if (nvCuRows.length > 0 && nvCuRows[0].ca_lam_id !== leaderNv.ca_lam_id) {
                throw new ApiError(403, "Lỗi phân quyền: Leader khu vực chỉ được phép gỡ nhân viên thuộc ca làm việc của mình!");
            }
        }

        const [rows] = await pool.query(
            "SELECT ca_lam_id FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ? LIMIT 1",
            [nhan_vien_id, day_chuyen_id, cong_doan_id, ngayDinhDang]
        );
        let caLamId = null;
        if (rows.length > 0) {
            caLamId = rows[0].ca_lam_id;
        }

        await pool.query(
            "DELETE FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ?",
            [nhan_vien_id, day_chuyen_id, cong_doan_id, ngayDinhDang]
        );

        if (caLamId) {
            await pool.query(
                `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                 VALUES (?, ?, ?, ?, ?, 'GO')`,
                [nhan_vien_id, day_chuyen_id, cong_doan_id, caLamId, ngayDinhDang]
            );
        }

        return { success: true, message: "Đã gỡ nhân sự khỏi bộ phận" };
    }

    static async capNhatTrangThaiPhanCong({ nhan_vien_id, day_chuyen_id, cong_doan_id, ngay, trang_thai, nguoiDung }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];
        if (!['DANG_LAM', 'NGHI'].includes(trang_thai)) {
            throw new ApiError(400, "Trạng thái phân công không hợp lệ");
        }

        await DayChuyenService._kiemTraQuyenDayChuyen(day_chuyen_id, nguoiDung, false);

        let leaderNv = null;
        if (nguoiDung && ["LEADER_KHU_VUC", "LEADER_LINE"].includes(nguoiDung.role)) {
            const [rows] = await pool.query("SELECT id, ca_lam_id FROM nhan_vien WHERE tai_khoan_id = ? LIMIT 1", [nguoiDung.id]);
            if (rows.length > 0) leaderNv = rows[0];
        }

        if (leaderNv && leaderNv.ca_lam_id) {
            const [nvCuRows] = await pool.query("SELECT ca_lam_id FROM nhan_vien WHERE id = ? LIMIT 1", [nhan_vien_id]);
            if (nvCuRows.length > 0 && nvCuRows[0].ca_lam_id !== leaderNv.ca_lam_id) {
                throw new ApiError(403, "Lỗi phân quyền: Leader khu vực chỉ được phép cập nhật trạng thái nhân viên thuộc ca của mình!");
            }
        }

        const [rows] = await pool.query(
            "SELECT ca_lam_id FROM phan_cong_nhan_su WHERE nhan_vien_id = ? AND day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ? LIMIT 1",
            [nhan_vien_id, day_chuyen_id, cong_doan_id, ngayDinhDang]
        );
        let caLamId = null;
        if (rows.length > 0) {
            caLamId = rows[0].ca_lam_id;
        }

        await pool.query(
            "UPDATE phan_cong_nhan_su SET trang_thai = ? WHERE nhan_vien_id = ? AND day_chuyen_id = ? AND cong_doan_id = ? AND ngay = ?",
            [trang_thai, nhan_vien_id, day_chuyen_id, cong_doan_id, ngayDinhDang]
        );

        if (caLamId) {
            const hanhDong = trang_thai === 'NGHI' ? 'NGHI' : 'DI_LAM_LAI';
            await pool.query(
                `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [nhan_vien_id, day_chuyen_id, cong_doan_id, caLamId, ngayDinhDang, hanhDong]
            );
        }

        return { 
            success: true, 
            message: `Đã cập nhật trạng thái nhân sự thành ${trang_thai === 'DANG_LAM' ? 'Đi làm' : 'Vắng mặt/Nghỉ'}` 
        };
    }

    static async tuDongGanNhanSu({ day_chuyen_id, ngay, ca_lam_id, nguoiDung }) {
        const ngayDinhDang = ngay || new Date().toISOString().split("T")[0];

        await DayChuyenService._kiemTraQuyenDayChuyen(day_chuyen_id, nguoiDung, false);

        let caLamId = ca_lam_id;
        if (!caLamId) {
            const [caLamList] = await pool.query("SELECT id FROM ca_lam_viec LIMIT 1");
            if (caLamList.length > 0) {
                caLamId = caLamList[0].id;
            } else {
                const [kqCa] = await pool.query(
                    "INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc) VALUES ('Ca Hanh Chinh', '08:00:00', '17:00:00')"
                );
                caLamId = kqCa.insertId;
            }
        }

        const [caLamRows] = await pool.query("SELECT * FROM ca_lam_viec WHERE id = ? LIMIT 1", [caLamId]);
        if (caLamRows.length === 0) {
            throw new ApiError(404, "Không tìm thấy ca làm việc này!");
        }
        const caLam = caLamRows[0];
        const isOvertime = DayChuyenService._isCaTangCa(caLam);

        const chiTiet = await DayChuyenService.layChiTietDayChuyen(day_chuyen_id, ngayDinhDang, caLamId, nguoiDung);
        const boPhanThieu = chiTiet.bo_phan.filter(bp => bp.so_luong_da_gan < bp.so_luong_min);

        if (boPhanThieu.length === 0) {
            return { success: true, message: "Dây chuyền đã đủ nhân sự tối thiểu, không cần tự động gán.", danhSachGan: [] };
        }

        let nhanVienRanh;
        if (isOvertime) {
            const [rows] = await pool.query(
                `SELECT nv.id, nv.ho_ten, nv.ma_nhan_vien 
                 FROM nhan_vien nv
                 JOIN dang_ky_tang_ca dk ON nv.id = dk.nhan_vien_id
                 WHERE nv.trang_thai = 'DANG_LAM' 
                   AND nv.chuc_vu = 'NHAN_VIEN'
                   AND nv.id NOT IN (SELECT leader_id FROM day_chuyen WHERE leader_id IS NOT NULL)
                   AND dk.ca_lam_id = ?
                   AND dk.ngay = ?
                   AND dk.trang_thai = 'DA_DUYET'
                   AND nv.id NOT IN (
                       SELECT nhan_vien_id FROM phan_cong_nhan_su WHERE ngay = ? AND ca_lam_id = ?
                   )`,
                [caLamId, ngayDinhDang, ngayDinhDang, caLamId]
            );
            nhanVienRanh = rows;
        } else {
            const [rows] = await pool.query(
                `SELECT nv.id, nv.ho_ten, nv.ma_nhan_vien 
                 FROM nhan_vien nv
                 WHERE nv.trang_thai = 'DANG_LAM' 
                   AND nv.chuc_vu = 'NHAN_VIEN'
                   AND nv.ca_lam_id = ?
                   AND nv.id NOT IN (SELECT leader_id FROM day_chuyen WHERE leader_id IS NOT NULL)
                   AND nv.id NOT IN (
                       SELECT nhan_vien_id FROM phan_cong_nhan_su WHERE ngay = ? AND ca_lam_id = ?
                   )`,
                [caLamId, ngayDinhDang, caLamId]
            );
            nhanVienRanh = rows;
        }

        if (nhanVienRanh.length === 0) {
            throw new ApiError(400, "Không còn nhân sự nào trống để tự động gán!");
        }

        let dsNhanVienTrong = [...nhanVienRanh];
        const danhSachGanThanhCong = [];

        for (const bp of boPhanThieu) {
            let thieu = bp.so_luong_min - bp.so_luong_da_gan;
            if (thieu <= 0) continue;

            const tenChungChiRequired = DayChuyenService._layTenChungChiTuCongDoan(bp.ten_bo_phan);
            const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiRequired]);
            
            if (ccRows.length > 0) {
                const chungChiId = ccRows[0].id;
                const [usersCoChungChi] = await pool.query(
                    `SELECT nhan_vien_id FROM chung_chi_nhan_vien 
                     WHERE chung_chi_id = ? AND trang_thai = 'HIEU_LUC'`,
                    [chungChiId]
                );
                const userIdsCoChungChi = usersCoChungChi.map(u => u.nhan_vien_id);

                const candidates = dsNhanVienTrong.filter(nv => userIdsCoChungChi.includes(nv.id));

                for (const cand of candidates) {
                    if (thieu <= 0) break;
                    await pool.query(
                        `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
                         VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
                        [cand.id, day_chuyen_id, bp.cong_doan_id, caLamId, ngayDinhDang]
                    );
                    await pool.query(
                        `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                         VALUES (?, ?, ?, ?, ?, 'GAN')`,
                        [cand.id, day_chuyen_id, bp.cong_doan_id, caLamId, ngayDinhDang]
                    );
                    danhSachGanThanhCong.push({
                        nhan_vien_id: cand.id,
                        ma_nhan_vien: cand.ma_nhan_vien,
                        ho_ten: cand.ho_ten,
                        ten_cong_doan: bp.ten_bo_phan,
                        co_chung_chi: true
                    });
                    dsNhanVienTrong = dsNhanVienTrong.filter(nv => nv.id !== cand.id);
                    thieu--;
                }
            }
            bp.so_luong_thieu_sau_v1 = thieu;
        }

        for (const bp of boPhanThieu) {
            let thieu = bp.so_luong_thieu_sau_v1 !== undefined ? bp.so_luong_thieu_sau_v1 : (bp.so_luong_min - bp.so_luong_da_gan);
            if (thieu <= 0) continue;

            const tenChungChiRequired = DayChuyenService._layTenChungChiTuCongDoan(bp.ten_bo_phan);
            const [ccRows] = await pool.query("SELECT id FROM chung_chi WHERE ten_chung_chi = ? LIMIT 1", [tenChungChiRequired]);

            // Chỉ cho phép gán người không có chứng chỉ nếu công đoạn này thực sự không yêu cầu chứng chỉ nào trong DB
            if (ccRows.length === 0) {
                while (thieu > 0 && dsNhanVienTrong.length > 0) {
                    const cand = dsNhanVienTrong[0];
                    await pool.query(
                        `INSERT INTO phan_cong_nhan_su (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, trang_thai)
                         VALUES (?, ?, ?, ?, ?, 'DANG_LAM')`,
                        [cand.id, day_chuyen_id, bp.cong_doan_id, caLamId, ngayDinhDang]
                    );
                    await pool.query(
                        `INSERT INTO nhat_ky_phan_cong (nhan_vien_id, day_chuyen_id, cong_doan_id, ca_lam_id, ngay, hanh_dong)
                         VALUES (?, ?, ?, ?, ?, 'GAN')`,
                        [cand.id, day_chuyen_id, bp.cong_doan_id, caLamId, ngayDinhDang]
                    );
                    danhSachGanThanhCong.push({
                        nhan_vien_id: cand.id,
                        ma_nhan_vien: cand.ma_nhan_vien,
                        ho_ten: cand.ho_ten,
                        ten_cong_doan: bp.ten_bo_phan,
                        co_chung_chi: false
                    });
                    dsNhanVienTrong.shift();
                    thieu--;
                }
            }
        }

        return {
            success: true,
            message: `Đã tự động gán thành công ${danhSachGanThanhCong.length} nhân viên.`,
            danhSachGan: danhSachGanThanhCong
        };
    }
}

export default DayChuyenService;
