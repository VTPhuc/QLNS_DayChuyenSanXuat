import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../api.js";

export default function QuanLyTangCa() {
    const { nguoiDung } = useAuth();
<<<<<<< HEAD
<<<<<<< HEAD
    const laAdmin = nguoiDung && nguoiDung.role === "ADMIN";
=======
    const laAdmin = nguoiDung && (nguoiDung.role === "ADMIN" || nguoiDung.role === "MANAGER");
=======
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e
    const laLeaderOnly = nguoiDung && (nguoiDung.role === "LEADER_LINE" || nguoiDung.role === "LEADER_KHU_VUC");
>>>>>>> upstream/main
    const laLeader = nguoiDung && ["ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"].includes(nguoiDung.role);
<<<<<<< HEAD
    const userCaLamId = nguoiDung?.ca_lam_id ? String(nguoiDung.ca_lam_id) : "";
=======
    const laAdmin = nguoiDung && (nguoiDung.role === "ADMIN" || nguoiDung.role === "MANAGER");
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e

    const todayStr = new Date().toISOString().split("T")[0];

    // Main navigation tab
    const [tabChinh, setTabChinh] = useState("DANH_SACH"); // "DANH_SACH" | "LICH_SU"

    // Main Filters (Tab Danh sách)
    const [ngayLoc, setNgayLoc] = useState(todayStr);
    const [dayChuyenLoc, setDayChuyenLoc] = useState("");
    const [caLamLoc, setCaLamLoc] = useState(!laAdmin && userCaLamId ? userCaLamId : "");
    const [trangThaiLoc, setTrangThaiLoc] = useState("");
    const [tuKhoa, setTuKhoa] = useState("");

    // Data lists
    const [danhSachTangCa, setDanhSachTangCa] = useState([]);
    const [danhSachDayChuyen, setDanhSachDayChuyen] = useState([]);
    const [danhSachCaLam, setDanhSachCaLam] = useState([]);

    const [dangTai, setDangTai] = useState(false);
    const [loi, setLoi] = useState("");
    const [thongBao, setThongBao] = useState("");

    // Checkbox selections for batch actions
    const [selectedIds, setSelectedIds] = useState([]);

    // Modal Lập danh sách Tăng ca
    const [hienModalLapTangCa, setHienModalLapTangCa] = useState(false);
    const [stepModal, setStepModal] = useState("CHON_DU_LIEU"); // "CHON_DU_LIEU" | "XAC_NHAN"

    // Phương thức lập danh sách: "TAT_CA" (Chế độ chọn chung) | "LINE" (Chế độ chọn theo từng Dây chuyền)
    const [phuongThucLap, setPhuongThucLap] = useState("TAT_CA");

    // State form Lập danh sách tăng ca
    const [ngayLap, setNgayLap] = useState(todayStr);
    const [caLamLapId, setCaLamLapId] = useState("");
    const [soLuongCanTangCa, setSoLuongCanTangCa] = useState(5); // Dùng cho phương thức "TAT_CA"

    // Dùng cho phương thức "LINE"
    const [selectedDayChuyenIds, setSelectedDayChuyenIds] = useState([]); // Chọn nhiều dây chuyền cùng lúc
    const [soLuongPerLine, setSoLuongPerLine] = useState({}); // { [lineId]: number }
    const [soLuongDefaultLine, setSoLuongDefaultLine] = useState(5);

    const [danhSachUngVien, setDanhSachUngVien] = useState([]);
    const [selectedUngVienIds, setSelectedUngVienIds] = useState([]);
    const [dangTaiUngVien, setDangTaiUngVien] = useState(false);
    const [tuKhoaUngVien, setTuKhoaUngVien] = useState("");

    // State Thống kê Lịch sử (Tab Lịch sử)
    const [danhSachLichSu, setDanhSachLichSu] = useState([]);
    const [dangTaiLichSu, setDangTaiLichSu] = useState(false);
    const [loiLichSu, setLoiLichSu] = useState("");
    const [tuNgayLichSu, setTuNgayLichSu] = useState("");
    const [denNgayLichSu, setDenNgayLichSu] = useState("");
    const [thangLichSu, setThangLichSu] = useState("");
    const [namLichSu, setNamLichSu] = useState(new Date().getFullYear().toString());
    const [hanhDongLichSu, setHanhDongLichSu] = useState("ALL");
    const [tuKhoaLichSu, setTuKhoaLichSu] = useState("");

    // Load static lookups (dây chuyền, ca làm)
    const taiLookupData = useCallback(async () => {
        try {
            const [resDc, resCa] = await Promise.all([
                api("/day-chuyen"),
                api("/ca-lam")
            ]);
            if (resDc.success) setDanhSachDayChuyen(resDc.data || []);
            if (resCa.success) {
                const caList = resCa.data || [];
                setDanhSachCaLam(caList);
                if (laLeaderOnly && nguoiDung?.ca_lam_id) {
                    setCaLamLoc(String(nguoiDung.ca_lam_id));
                    setCaLamLapId(String(nguoiDung.ca_lam_id));
                } else if (caList.length > 0) {
                    setCaLamLapId(String(caList[0].id));
                }
            }
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu Lookup:", err);
        }
    }, [laLeaderOnly, nguoiDung]);

    // Load danh sách đăng ký tăng ca
    const taiDanhSachTangCa = useCallback(async () => {
        setDangTai(true);
        setLoi("");
        try {
            let url = `/tang-ca/dang-ky?`;
            if (ngayLoc) url += `&ngay=${ngayLoc}`;
            if (dayChuyenLoc) url += `&day_chuyen_id=${dayChuyenLoc}`;
            if (caLamLoc) url += `&ca_lam_id=${caLamLoc}`;
            if (trangThaiLoc) url += `&trang_thai=${trangThaiLoc}`;
            if (tuKhoa) url += `&q=${encodeURIComponent(tuKhoa)}`;

            const res = await api(url);
            if (res.success) {
                let data = res.data || [];
                setDanhSachTangCa(data);
                setSelectedIds([]);
            }
        } catch (err) {
            setLoi(err.message || "Lỗi khi tải danh sách tăng ca");
        } finally {
            setDangTai(false);
        }
    }, [ngayLoc, dayChuyenLoc, caLamLoc, trangThaiLoc, tuKhoa]);

    // Load Lịch sử Tăng ca
    const taiLichSuTangCa = useCallback(async () => {
        setDangTaiLichSu(true);
        setLoiLichSu("");
        try {
            let url = `/tang-ca/lich-su?loai_doi_tuong=TANG_CA`;
            if (tuNgayLichSu) url += `&tu_ngay=${tuNgayLichSu}`;
            if (denNgayLichSu) url += `&den_ngay=${denNgayLichSu}`;
            if (thangLichSu) url += `&thang=${thangLichSu}`;
            if (namLichSu) url += `&nam=${namLichSu}`;
            if (hanhDongLichSu && hanhDongLichSu !== "ALL") url += `&hanh_dong=${hanhDongLichSu}`;
            if (tuKhoaLichSu) url += `&q=${encodeURIComponent(tuKhoaLichSu)}`;

            const res = await api(url);
            if (res.success) {
                setDanhSachLichSu(res.data || []);
            }
        } catch (err) {
            setLoiLichSu(err.message || "Lỗi khi tải lịch sử tăng ca");
        } finally {
            setDangTaiLichSu(false);
        }
    }, [tuNgayLichSu, denNgayLichSu, thangLichSu, namLichSu, hanhDongLichSu, tuKhoaLichSu]);

    useEffect(() => {
        taiLookupData();
    }, [taiLookupData]);

    useEffect(() => {
        if (tabChinh === "DANH_SACH") {
            taiDanhSachTangCa();
        } else if (tabChinh === "LICH_SU") {
            taiLichSuTangCa();
        }
    }, [tabChinh, taiDanhSachTangCa, taiLichSuTangCa]);

    useEffect(() => {
        if (!laAdmin && userCaLamId) {
            setCaLamLoc(userCaLamId);
        }
    }, [laAdmin, userCaLamId]);

    useEffect(() => {
        if (thongBao) {
            const timer = setTimeout(() => setThongBao(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [thongBao]);

    // Tải danh sách ứng viên không bị trùng (chưa được chọn/duyệt trong ngày hôm đó)
    const taiDanhSachUngVien = useCallback(async () => {
        if (!ngayLap || !caLamLapId) return;
        setDangTaiUngVien(true);
        try {
            let url = `/tang-ca/ung-vien?ngay=${ngayLap}&ca_lam_id=${caLamLapId}`;
            if (phuongThucLap === "LINE" && selectedDayChuyenIds.length > 0) {
                url += `&day_chuyen_ids=${selectedDayChuyenIds.join(",")}`;
            }

            const res = await api(url);
            if (res.success) {
                setDanhSachUngVien(res.data || []);
            }
        } catch (err) {
            console.error("Lỗi khi tải ứng viên tăng ca:", err);
        } finally {
            setDangTaiUngVien(false);
        }
    }, [ngayLap, caLamLapId, phuongThucLap, selectedDayChuyenIds]);

    useEffect(() => {
        if (hienModalLapTangCa) {
            taiDanhSachUngVien();
        }
    }, [hienModalLapTangCa, taiDanhSachUngVien]);

    // Mở Modal Lập danh sách tăng ca
    const hienModalLapTangCaForm = () => {
        setNgayLap(ngayLoc || todayStr);
        const defaultCa = laLeaderOnly && nguoiDung?.ca_lam_id ? String(nguoiDung.ca_lam_id) : (danhSachCaLam.length > 0 ? String(danhSachCaLam[0].id) : "");
        setCaLamLapId(defaultCa);

        setPhuongThucLap("TAT_CA"); // Mặc định chế độ chọn chung
        setSoLuongCanTangCa(5);

        const initialLines = laLeaderOnly && nguoiDung?.day_chuyen_id ? [Number(nguoiDung.day_chuyen_id)] : danhSachDayChuyen.slice(0, 2).map(d => d.id);
        setSelectedDayChuyenIds(initialLines);

        const initQtyObj = {};
        initialLines.forEach(id => {
            initQtyObj[id] = 5;
        });
        setSoLuongPerLine(initQtyObj);
        setSoLuongDefaultLine(5);

        setSelectedUngVienIds([]);
        setTuKhoaUngVien("");
        setStepModal("CHON_DU_LIEU");
        setHienModalLapTangCa(true);
    };

    // Toggle chọn dây chuyền & khởi tạo số lượng tăng ca cho dây chuyền đó
    const toggleDayChuyenSelection = (dcId) => {
        const numId = Number(dcId);
        if (selectedDayChuyenIds.includes(numId)) {
            setSelectedDayChuyenIds(selectedDayChuyenIds.filter(id => id !== numId));
            const newMap = { ...soLuongPerLine };
            delete newMap[numId];
            setSoLuongPerLine(newMap);
        } else {
            setSelectedDayChuyenIds([...selectedDayChuyenIds, numId]);
            setSoLuongPerLine({
                ...soLuongPerLine,
                [numId]: Number(soLuongDefaultLine) || 5
            });
        }
    };

    // Thay đổi số lượng tăng ca riêng cho từng dây chuyền
    const capNhatSoLuongLine = (dcId, val) => {
        const numVal = Math.max(1, parseInt(val, 10) || 1);
        setSoLuongPerLine({
            ...soLuongPerLine,
            [dcId]: numVal
        });
    };

    // Áp dụng số lượng nhanh cho tất cả dây chuyền đã chọn
    const xuLyApDungHangLoatSoLuong = (val) => {
        const numVal = Math.max(1, parseInt(val, 10) || 1);
        setSoLuongDefaultLine(numVal);
        const newMap = {};
        selectedDayChuyenIds.forEach(id => {
            newMap[id] = numVal;
        });
        setSoLuongPerLine(newMap);
    };

    // Tính tổng chỉ tiêu tăng ca cần lập dựa vào phương thức lập
    const tongChiTieuTangCa = phuongThucLap === "LINE"
        ? (selectedDayChuyenIds.length > 0 ? selectedDayChuyenIds.reduce((sum, id) => sum + (Number(soLuongPerLine[id]) || 0), 0) : 5)
        : (Number(soLuongCanTangCa) || 5);

    // Toggle chọn ứng viên tăng ca
    const toggleUngVienSelection = (nvId) => {
        const numId = Number(nvId);
        if (selectedUngVienIds.includes(numId)) {
            setSelectedUngVienIds(selectedUngVienIds.filter(id => id !== numId));
        } else {
            setSelectedUngVienIds([...selectedUngVienIds, numId]);
        }
    };

    // Tự động chọn top N ứng viên ở chế độ chọn chung (chế độ cũ)
    const xuLyAutoPickChung = () => {
        const count = Number(soLuongCanTangCa) || 0;
        const topIds = danhSachUngVien.slice(0, count).map(n => n.id);
        setSelectedUngVienIds(topIds);
    };

    // Tự động phân bổ chọn top N nhân viên chuẩn theo số lượng của từng dây chuyền (chế độ mới)
    const xuLyAutoPickTheoLine = () => {
        const pickedIds = [];
        const usedSet = new Set();

        if (selectedDayChuyenIds.length > 0) {
            for (const dcId of selectedDayChuyenIds) {
                const targetQty = Number(soLuongPerLine[dcId]) || 0;
                const candidatesForLine = danhSachUngVien.filter(
                    n => Number(n.day_chuyen_id) === Number(dcId) && !usedSet.has(n.id)
                );
                const pickedForLine = candidatesForLine.slice(0, targetQty);
                pickedForLine.forEach(c => {
                    pickedIds.push(c.id);
                    usedSet.add(c.id);
                });
            }
        }

        if (pickedIds.length < tongChiTieuTangCa) {
            const neededRemaining = tongChiTieuTangCa - pickedIds.length;
            const extraCandidates = danhSachUngVien.filter(n => !usedSet.has(n.id)).slice(0, neededRemaining);
            extraCandidates.forEach(c => pickedIds.push(c.id));
        }

        setSelectedUngVienIds(pickedIds);
    };

    // Nhấn OK -> Chuyển sang Modal xác nhận Đồng ý / Hủy
    const xuLyNhanOkModal = () => {
        if (selectedUngVienIds.length === 0) {
            setLoi("Vui lòng chọn ít nhất 1 nhân viên để lập danh sách tăng ca!");
            return;
        }
        setLoi("");
        setStepModal("XAC_NHAN");
    };

    // Xác nhận "Đồng ý" -> Gửi request lập danh sách tăng ca
    const xuLyXacNhanDongY = async () => {
        setLoi("");
        try {
            const chiTietLineObj = {};
            if (phuongThucLap === "LINE") {
                selectedDayChuyenIds.forEach(id => {
                    const dcObj = danhSachDayChuyen.find(d => Number(d.id) === Number(id));
                    const name = dcObj ? dcObj.ten_day_chuyen : `Line #${id}`;
                    chiTietLineObj[name] = Number(soLuongPerLine[id]) || 0;
                });
            }

            const res = await api("/tang-ca/dang-ky", {
                method: "POST",
                body: JSON.stringify({
                    nhan_vien_ids: selectedUngVienIds,
                    ca_lam_id: caLamLapId,
                    ngay: ngayLap,
                    trang_thai: "DA_DUYET",
                    chi_tiet_day_chuyen: phuongThucLap === "LINE" ? chiTietLineObj : null
                })
            });

            setThongBao(res.message || `Đã lập và duyệt tăng ca thành công cho ${selectedUngVienIds.length} nhân viên!`);
            setHienModalLapTangCa(false);
            if (tabChinh === "DANH_SACH") taiDanhSachTangCa();
            if (tabChinh === "LICH_SU") taiLichSuTangCa();
        } catch (err) {
            setLoi(err.message || "Lỗi khi lưu danh sách tăng ca");
        }
    };

    // Checkbox selections for table
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(danhSachTangCa.map((item) => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((x) => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Duyệt / Từ chối đơn đăng ký
    const xuLyDuyet = async (ids, trangThaiMoi) => {
        setLoi("");
        try {
            const res = await api("/tang-ca/duyet", {
                method: "POST",
                body: JSON.stringify({ ids, trang_thai: trangThaiMoi })
            });
            setThongBao(res.message || "Đã cập nhật trạng thái tăng ca");
            taiDanhSachTangCa();
        } catch (err) {
            setLoi(err.message || "Lỗi khi duyệt tăng ca");
        }
    };

    const xuLyXoa = async (id, tenNv) => {
        if (!window.confirm(`Hủy đăng ký tăng ca của nhân viên "${tenNv}"?`)) return;
        setLoi("");
        try {
            const res = await api(`/tang-ca/dang-ky/${id}`, { method: "DELETE" });
            setThongBao(res.message || "Đã xóa đăng ký tăng ca");
            taiDanhSachTangCa();
        } catch (err) {
            setLoi(err.message || "Lỗi khi xóa đăng ký tăng ca");
        }
    };

<<<<<<< HEAD
    // Open Modal Đăng ký tăng ca
    const hienModalDangKyForm = () => {
<<<<<<< HEAD
        const caLamDefault = (!laAdmin && userCaLamId)
            ? userCaLamId
            : (caLamLoc || (danhSachCaLam.length > 0 ? String(danhSachCaLam[0].id) : ""));
=======
        setTuKhoaModal("");
        const defaultCaLamId = laLeaderOnly && nguoiDung?.ca_lam_id ? nguoiDung.ca_lam_id : (danhSachCaLam.length > 0 ? danhSachCaLam[0].id : "");
        const defaultDayChuyenId = laLeaderOnly && nguoiDung?.day_chuyen_id ? nguoiDung.day_chuyen_id : (danhSachDayChuyen.length > 0 ? danhSachDayChuyen[0].id : "");

>>>>>>> upstream/main
        setFormDangKy({
            cheDo: "CAN_HANH",
            day_chuyen_id: defaultDayChuyenId,
            nhan_vien_ids: [],
<<<<<<< HEAD
            ca_lam_id: caLamDefault,
=======
            ca_lam_id: defaultCaLamId,
>>>>>>> upstream/main
            ngay: ngayLoc || todayStr,
            trang_thai: "DA_DUYET"
        });
        setHienModalDangKy(true);
    };

    const xuLyNhanVienSelection = (id) => {
        const numId = Number(id);
        if (formDangKy.nhan_vien_ids.includes(numId)) {
            setFormDangKy({
                ...formDangKy,
                nhan_vien_ids: formDangKy.nhan_vien_ids.filter((x) => x !== numId)
            });
        } else {
            setFormDangKy({
                ...formDangKy,
                nhan_vien_ids: [...formDangKy.nhan_vien_ids, numId]
            });
        }
    };

    const xuLyChonTatCaSubLine = (dcId) => {
        const nvThuocLine = danhSachNhanVien
            .filter((nv) => String(nv.day_chuyen_id) === String(dcId))
            .map((nv) => nv.id);
        setFormDangKy({
            ...formDangKy,
            nhan_vien_ids: Array.from(new Set([...formDangKy.nhan_vien_ids, ...nvThuocLine]))
        });
    };

    const xuLyLuuDangKy = async (e) => {
        e.preventDefault();
        setLoi("");
        try {
            let targetNvIds = formDangKy.nhan_vien_ids;
            if (formDangKy.cheDo === "CHUYEN" && formDangKy.day_chuyen_id) {
                targetNvIds = danhSachNhanVien
                    .filter((nv) => String(nv.day_chuyen_id) === String(formDangKy.day_chuyen_id))
                    .map((nv) => nv.id);
            }

            if (targetNvIds.length === 0) {
                setLoi("Vui lòng chọn ít nhất 1 nhân viên để đăng ký tăng ca");
                return;
            }

            const res = await api("/tang-ca/dang-ky", {
                method: "POST",
                body: JSON.stringify({
                    nhan_vien_ids: targetNvIds,
                    ca_lam_id: formDangKy.ca_lam_id,
                    ngay: formDangKy.ngay,
                    trang_thai: formDangKy.trang_thai
                })
            });

            setThongBao(res.message || "Đăng ký tăng ca thành công");
            setHienModalDangKy(false);
            taiDanhSachTangCa();
        } catch (err) {
            setLoi(err.message || "Lỗi khi đăng ký tăng ca");
        }
    };

=======
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e
    // Badges & Render Helpers
    const renderTrangThai = (tt) => {
        switch (tt) {
            case "DA_DUYET":
                return <span className="trang-thai-badge active">✅ ĐÃ DUYỆT</span>;
            case "TU_CHOI":
                return <span className="trang-thai-badge locked">❌ TỪ CHỐI</span>;
            case "CHO_DUYET":
            default:
                return (
                    <span className="trang-thai-badge" style={{ background: "#fef3c7", color: "#d97706" }}>
                        ⏳ CHỜ DUYỆT
                    </span>
                );
        }
    };

    const renderHanhDongLichSuBadge = (hd) => {
        switch (hd) {
            case "TAO_MOI":
                return <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>➕ THÊM MỚI</span>;
            case "DA_DUYET":
                return <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>✅ ĐÃ DUYỆT</span>;
            case "TU_CHOI":
                return <span style={{ background: "#fef2f2", color: "#b91c1c", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>❌ TỪ CHỐI</span>;
            case "XOA":
                return <span style={{ background: "#f3f4f6", color: "#4b5563", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>🗑️ XÓA</span>;
            default:
                return <span style={{ background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>{hd}</span>;
        }
    };

    // Stats (Tab Danh sách)
    const choDuyetCount = danhSachTangCa.filter((x) => x.trang_thai === "CHO_DUYET").length;
    const daDuyetCount = danhSachTangCa.filter((x) => x.trang_thai === "DA_DUYET").length;
    const tuChoiCount = danhSachTangCa.filter((x) => x.trang_thai === "TU_CHOI").length;

    // Filtered candidates in modal
    const filteredCandidates = danhSachUngVien.filter(nv => {
        if (!tuKhoaUngVien.trim()) return true;
        const kw = tuKhoaUngVien.toLowerCase();
        return nv.ho_ten?.toLowerCase().includes(kw) || nv.ma_nhan_vien?.toLowerCase().includes(kw);
    });

    const caLamLapSelectedObj = danhSachCaLam.find(c => String(c.id) === String(caLamLapId));

    return (
        <div className="noi-dung-admin">
            {/* Thanh Tiêu đề & Điều hướng Tab chính */}
            <div className="admin-header-bar" style={{ marginBottom: "16px" }}>
                <div className="tieu-de-khoi">
                    <h2>📝 Quản lý & Lập danh sách Tăng ca (OT Management)</h2>
                    <p>Hỗ trợ chọn tăng ca theo <strong>Tất cả danh sách</strong> hoặc <strong>Chi tiết từng Dây chuyền</strong> kết hợp phân quyền Leader</p>
                </div>
                {laLeader && (
                    <div className="nhom-nut-admin">
                        <button className="nut-chinh nut-them-moi" onClick={hienModalLapTangCaForm}>
                            ⚡ Lập danh sách Tăng ca
                        </button>
                    </div>
                )}
            </div>

            {/* Thông báo phạm vi Phân quyền Leader */}
            {laLeaderOnly && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 14px", borderRadius: "var(--radius)", marginBottom: "16px", fontSize: "13px", color: "#b45309" }}>
                    🔒 <strong>Quyền hạn Leader:</strong> Hệ thống tự động giới hạn xem nhân viên, ca làm & nhật ký lịch sử phân công thuộc phạm vi ca/dây chuyền của bạn.
                </div>
            )}

            {/* Navigation Tabs */}
            <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
                <button
                    onClick={() => setTabChinh("DANH_SACH")}
                    style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: tabChinh === "DANH_SACH" ? "3px solid #2563eb" : "3px solid transparent",
                        color: tabChinh === "DANH_SACH" ? "#1e40af" : "#64748b"
                    }}
                >
                    📋 Danh sách Tăng ca hiện tại
                </button>
                <button
                    onClick={() => setTabChinh("LICH_SU")}
                    style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: tabChinh === "LICH_SU" ? "3px solid #2563eb" : "3px solid transparent",
                        color: tabChinh === "LICH_SU" ? "#1e40af" : "#64748b"
                    }}
                >
                    📜 Thống kê & Lịch sử Tăng ca ({danhSachLichSu.length})
                </button>
            </div>

            {thongBao && <div className="thong-bao-thanh-cong">✅ {thongBao}</div>}
            {loi && <div className="thong-bao-loi">⚠️ {loi}</div>}

<<<<<<< HEAD
            {/* Thanh lọc dữ liệu */}
            <div
                style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                    background: "#fff",
                    padding: "14px 16px",
                    borderRadius: "var(--radius)",
                    border: "1px solid #e2e5ea",
                    alignItems: "center"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>📅 Ngày:</label>
                    <input
                        type="date"
                        value={ngayLoc}
                        onChange={(e) => setNgayLoc(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                    />
                </div>

                <select
                    value={dayChuyenLoc}
                    onChange={(e) => setDayChuyenLoc(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                >
                    {!laLeaderOnly && <option value="">-- Tất cả dây chuyền --</option>}
                    {danhSachDayChuyen
                        .filter(dc => !laLeaderOnly || !nguoiDung?.day_chuyen_id || String(dc.id) === String(nguoiDung.day_chuyen_id))
                        .map((dc) => (
                            <option key={dc.id} value={dc.id}>
                                {dc.ten_day_chuyen}
                            </option>
                        ))}
                </select>

                <select
                    value={caLamLoc}
                    disabled={laLeaderOnly && Boolean(nguoiDung?.ca_lam_id)}
                    onChange={(e) => setCaLamLoc(e.target.value)}
<<<<<<< HEAD
                    disabled={!laAdmin && Boolean(userCaLamId)}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "var(--radius)",
                        background: (!laAdmin && userCaLamId) ? "#f1f5f9" : "#fff",
                        cursor: (!laAdmin && userCaLamId) ? "not-allowed" : "pointer"
                    }}
                    title={!laAdmin && userCaLamId ? "Ca làm việc cố định của bạn (Không thể đổi)" : "Chọn ca làm việc"}
                >
                    <option value="">{laAdmin ? "-- Tất cả ca làm --" : "-- Ca làm của bạn --"}</option>
=======
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: laLeaderOnly && nguoiDung?.ca_lam_id ? "#f1f5f9" : "#fff" }}
                >
                    {!laLeaderOnly && <option value="">-- Tất cả ca làm --</option>}
>>>>>>> upstream/main
                    {danhSachCaLam.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                            {cl.ten_ca} ({cl.gio_bat_dau?.substring(0, 5)} - {cl.gio_ket_thuc?.substring(0, 5)})
                        </option>
                    ))}
                </select>

                <select
                    value={trangThaiLoc}
                    onChange={(e) => setTrangThaiLoc(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                >
                    <option value="">-- Tất cả trạng thái --</option>
                    <option value="CHO_DUYET">Chờ duyệt</option>
                    <option value="DA_DUYET">Đã duyệt</option>
                    <option value="TU_CHOI">Từ chối</option>
                </select>

                <input
                    type="text"
                    placeholder="🔍 Tim mã/họ tên NV..."
                    value={tuKhoa}
                    onChange={(e) => setTuKhoa(e.target.value)}
                    style={{ flex: "1 1 180px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                />

                {laLeader && selectedIds.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                        <button
                            className="nut-hanh-dong"
                            style={{ background: "var(--green)", color: "#fff" }}
                            onClick={() => xuLyDuyet(selectedIds, "DA_DUYET")}
                        >
                            ✅ Duyệt ({selectedIds.length})
                        </button>
                        <button
                            className="nut-hanh-dong"
                            style={{ background: "var(--red)", color: "#fff" }}
                            onClick={() => xuLyDuyet(selectedIds, "TU_CHOI")}
                        >
                            ❌ Từ chối ({selectedIds.length})
                        </button>
=======
            {/* TAB 1: DANH SÁCH TĂNG CA HÀNG NGÀY */}
            {tabChinh === "DANH_SACH" && (
                <>
                    {/* Thống kê chỉ số nhanh */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                        <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Chờ duyệt</span>
                            <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "#d97706" }}>{choDuyetCount}</h3>
                        </div>
                        <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Đã phê duyệt</span>
                            <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--green)" }}>{daDuyetCount}</h3>
                        </div>
                        <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Từ chối</span>
                            <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--red)" }}>{tuChoiCount}</h3>
                        </div>
                        <div className="the-thong-tin" style={{ marginBottom: 0, padding: "16px 20px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Tổng số lượt</span>
                            <h3 style={{ fontSize: "28px", margin: "4px 0 0", color: "var(--charcoal)" }}>{danhSachTangCa.length}</h3>
                        </div>
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e
                    </div>

                    {/* Thanh lọc dữ liệu */}
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            marginBottom: "16px",
                            flexWrap: "wrap",
                            background: "#fff",
                            padding: "14px 16px",
                            borderRadius: "var(--radius)",
                            border: "1px solid #e2e5ea",
                            alignItems: "center"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>📅 Ngày:</label>
                            <input
                                type="date"
                                value={ngayLoc}
                                onChange={(e) => setNgayLoc(e.target.value)}
                                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>

                        <select
                            value={dayChuyenLoc}
                            onChange={(e) => setDayChuyenLoc(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                        >
                            <option value="">-- Tất cả dây chuyền --</option>
                            {danhSachDayChuyen.map((dc) => (
                                <option key={dc.id} value={dc.id}>
                                    {dc.ten_day_chuyen}
                                </option>
                            ))}
                        </select>

                        <select
                            value={caLamLoc}
                            disabled={laLeaderOnly && Boolean(nguoiDung?.ca_lam_id)}
                            onChange={(e) => setCaLamLoc(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: laLeaderOnly && nguoiDung?.ca_lam_id ? "#f1f5f9" : "#fff" }}
                        >
                            {!laLeaderOnly && <option value="">-- Tất cả ca làm --</option>}
                            {danhSachCaLam.map((cl) => (
                                <option key={cl.id} value={cl.id}>
                                    {cl.ten_ca} ({cl.gio_bat_dau?.substring(0, 5)} - {cl.gio_ket_thuc?.substring(0, 5)})
                                </option>
                            ))}
                        </select>

                        <select
                            value={trangThaiLoc}
                            onChange={(e) => setTrangThaiLoc(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                        >
                            <option value="">-- Tất cả trạng thái --</option>
                            <option value="CHO_DUYET">Chờ duyệt</option>
                            <option value="DA_DUYET">Đã duyệt</option>
                            <option value="TU_CHOI">Từ chối</option>
                        </select>

                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <input
                                type="text"
                                placeholder="🔍 Tìm theo Tên, Mã NV hoặc Dây chuyền..."
                                value={tuKhoa}
                                onChange={(e) => setTuKhoa(e.target.value)}
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>

                        {selectedIds.length > 0 && laLeader && (
                            <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                                <button
                                    className="nut-chinh"
                                    style={{ background: "#16a34a", padding: "6px 14px", fontSize: "13px" }}
                                    onClick={() => xuLyDuyet(selectedIds, "DA_DUYET")}
                                >
                                    ✅ Duyệt hàng loạt ({selectedIds.length})
                                </button>
                                <button
                                    className="nut-phu"
                                    style={{ background: "#dc2626", color: "#fff", padding: "6px 14px", fontSize: "13px", border: "none" }}
                                    onClick={() => xuLyDuyet(selectedIds, "TU_CHOI")}
                                >
                                    ❌ Từ chối ({selectedIds.length})
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bảng danh sách đăng ký tăng ca */}
                    <div className="khong-gian-bang">
                        {dangTai ? (
                            <div className="trang-thai-rong">Đang tải danh sách đăng ký tăng ca...</div>
                        ) : (
                            <table className="bang-du-lieu">
                                <thead>
                                    <tr>
                                        {laLeader && (
                                            <th style={{ width: "40px", textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={danhSachTangCa.length > 0 && selectedIds.length === danhSachTangCa.length}
                                                />
                                            </th>
                                        )}
                                        <th style={{ width: "50px", textAlign: "center" }}>STT</th>
                                        <th>Mã NV</th>
                                        <th>Họ và tên</th>
                                        <th>Dây chuyền</th>
                                        <th>Ca làm tăng ca</th>
                                        <th>Ngày đăng ký</th>
                                        <th>Chứng chỉ & Kỹ năng</th>
                                        <th style={{ width: "120px" }}>Trạng thái</th>
                                        {laLeader && <th style={{ width: "150px", textAlign: "center" }}>Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {danhSachTangCa.length === 0 ? (
                                        <tr>
                                            <td colSpan={laLeader ? 10 : 8} className="trang-thai-rong">
                                                Không tìm thấy bản ghi đăng ký tăng ca nào phù hợp với bộ lọc
                                            </td>
                                        </tr>
                                    ) : (
                                        danhSachTangCa.map((item, index) => (
                                            <tr key={item.id}>
                                                {laLeader && (
                                                    <td style={{ textAlign: "center" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(item.id)}
                                                            onChange={() => handleSelectOne(item.id)}
                                                        />
                                                    </td>
                                                )}
                                                <td style={{ textAlign: "center" }}>{index + 1}</td>
                                                <td>
                                                    <strong className="ma-nhan-vien">{item.ma_nhan_vien}</strong>
                                                </td>
                                                <td>
                                                    <strong>{item.ho_ten}</strong>
                                                </td>
                                                <td>{item.ten_day_chuyen || <span className="text-unspecified">Chưa gán</span>}</td>
                                                <td>
                                                    <strong style={{ color: "#0284c7" }}>{item.ten_ca}</strong>
                                                    {item.gio_bat_dau && (
                                                        <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
                                                            ({item.gio_bat_dau?.substring(0, 5)} - {item.gio_ket_thuc?.substring(0, 5)})
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <strong>{new Date(item.ngay).toLocaleDateString("vi-VN")}</strong>
                                                </td>
                                                <td>
                                                    {item.ky_nang_list && item.ky_nang_list.length > 0 ? (
                                                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                            {item.ky_nang_list.map((kn, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    style={{
                                                                        fontSize: "11px",
                                                                        background: "#e0f2fe",
                                                                        color: "#0369a1",
                                                                        padding: "2px 6px",
                                                                        borderRadius: "4px",
                                                                        fontWeight: "600"
                                                                    }}
                                                                >
                                                                    🎓 {kn.ten_chung_chi} (Cấp {kn.cap_do})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-unspecified">Chưa có chứng chỉ</span>
                                                    )}
                                                </td>
                                                <td>{renderTrangThai(item.trang_thai)}</td>
                                                {laLeader && (
                                                    <td style={{ textAlign: "center" }}>
                                                        <div className="nhom-nut-hanh-dong">
                                                            {item.trang_thai !== "DA_DUYET" && (
                                                                <button
                                                                    className="nut-hanh-dong"
                                                                    style={{ background: "#dcfce7", color: "#15803d", borderColor: "#86efac" }}
                                                                    onClick={() => xuLyDuyet([item.id], "DA_DUYET")}
                                                                    title="Phê duyệt tăng ca"
                                                                >
                                                                    Duyệt
                                                                </button>
                                                            )}
                                                            {item.trang_thai !== "TU_CHOI" && (
                                                                <button
                                                                    className="nut-hanh-dong"
                                                                    style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fca5a5" }}
                                                                    onClick={() => xuLyDuyet([item.id], "TU_CHOI")}
                                                                    title="Từ chối tăng ca"
                                                                >
                                                                    Từ chối
                                                                </button>
                                                            )}
                                                            <button
                                                                className="nut-hanh-dong nut-xoa"
                                                                onClick={() => xuLyXoa(item.id, item.ho_ten)}
                                                                title="Xóa đơn"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* TAB 2: THỐNG KÊ LỊCH SỬ THÊM/SỬA/XÓA TĂNG CA theo Ngày Tháng Năm */}
            {tabChinh === "LICH_SU" && (
                <>
                    {/* Thanh Lọc Nhật Ký Lịch Sử */}
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            marginBottom: "16px",
                            flexWrap: "wrap",
                            background: "#fff",
                            padding: "14px 16px",
                            borderRadius: "var(--radius)",
                            border: "1px solid #e2e5ea",
                            alignItems: "center"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>📅 Từ ngày:</label>
                            <input
                                type="date"
                                value={tuNgayLichSu}
                                onChange={(e) => setTuNgayLichSu(e.target.value)}
                                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>📅 Đến ngày:</label>
                            <input
                                type="date"
                                value={denNgayLichSu}
                                onChange={(e) => setDenNgayLichSu(e.target.value)}
                                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>Tháng:</label>
                            <select
                                value={thangLichSu}
                                onChange={(e) => setThangLichSu(e.target.value)}
                                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                            >
                                <option value="">-- Cả năm --</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold" }}>Năm:</label>
                            <input
                                type="number"
                                value={namLichSu}
                                onChange={(e) => setNamLichSu(e.target.value)}
                                style={{ width: "80px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>

                        <select
                            value={hanhDongLichSu}
                            onChange={(e) => setHanhDongLichSu(e.target.value)}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff" }}
                        >
                            <option value="ALL">-- Tất cả hành động --</option>
                            <option value="TAO_MOI">Thêm mới / Lập danh sách</option>
                            <option value="DA_DUYET">Duyệt tăng ca</option>
                            <option value="TU_CHOI">Từ chối tăng ca</option>
                            <option value="XOA">Xóa tăng ca</option>
                        </select>

                        <div style={{ flex: 1, minWidth: "180px" }}>
                            <input
                                type="text"
                                placeholder="🔍 Tìm theo Người lập, NV hoặc Chứng chỉ..."
                                value={tuKhoaLichSu}
                                onChange={(e) => setTuKhoaLichSu(e.target.value)}
                                style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                            />
                        </div>
                    </div>

                    {/* Bảng Nhật ký Lịch sử Tăng ca */}
                    <div className="khong-gian-bang">
                        {dangTaiLichSu ? (
                            <div className="trang-thai-rong">Đang tải nhật ký lịch sử tăng ca...</div>
                        ) : loiLichSu ? (
                            <div className="thong-bao-loi">{loiLichSu}</div>
                        ) : (
                            <table className="bang-du-lieu">
                                <thead>
                                    <tr>
                                        <th style={{ width: "50px", textAlign: "center" }}>STT</th>
                                        <th style={{ width: "160px" }}>Thời gian</th>
                                        <th style={{ width: "180px" }}>Người thực hiện / Quản lý</th>
                                        <th style={{ width: "120px" }}>Hành động</th>
                                        <th style={{ width: "200px" }}>Tên đối tượng</th>
                                        <th>Chi tiết (Chứng chỉ, Dây chuyền, Ca làm, NV...)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {danhSachLichSu.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="trang-thai-rong">
                                                Chưa có lịch sử tăng ca nào phù hợp với bộ lọc ngày tháng năm này
                                            </td>
                                        </tr>
                                    ) : (
                                        danhSachLichSu.map((item, index) => (
                                            <tr key={item.id}>
                                                <td style={{ textAlign: "center" }}>{index + 1}</td>
                                                <td>
                                                    <strong style={{ fontSize: "12px", color: "var(--charcoal)" }}>
                                                        {new Date(item.thoi_gian).toLocaleString("vi-VN")}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <strong>{item.nguoi_thuc_hien || "Hệ thống"}</strong>
                                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
                                                        ({item.role_nguoi_thuc_hien || "ADMIN"})
                                                    </span>
                                                </td>
                                                <td>{renderHanhDongLichSuBadge(item.hanh_dong)}</td>
                                                <td>
                                                    <strong style={{ color: "#0369a1", fontSize: "13px" }}>{item.ten_doi_tuong}</strong>
                                                </td>
                                                <td style={{ fontSize: "12.5px", lineHeight: "1.5", color: "#334155" }}>
                                                    {item.chi_tiet}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* MODAL LẬP DANH SÁCH TĂNG CA (CHO PHÉP CHỌN CẢ 2 PHƯƠNG THỨC: TẤT CẢ DANH SÁCH HOẶC THEO DÂY CHUYỀN) */}
            {hienModalLapTangCa && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: stepModal === "XAC_NHAN" ? "560px" : "860px" }}>
                        <div className="modal-header">
                            <h3>⚡ {stepModal === "XAC_NHAN" ? "Xác nhận Lập danh sách Tăng ca" : "Lập danh sách Tăng ca"}</h3>
                            <button className="nut-dong-modal" onClick={() => setHienModalLapTangCa(false)}>
                                &times;
                            </button>
                        </div>

                        {stepModal === "CHON_DU_LIEU" ? (
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                                {/* BỘ CHUYỂN ĐỔI CHẾ ĐỘ LẬP DANH SÁCH (CHỌN CHUNG VS THEO DÂY CHUYỀN) */}
                                <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", padding: "12px 16px", borderRadius: "var(--radius)" }}>
                                    <label style={{ fontSize: "13px", fontWeight: "bold", color: "#1e3a8a", display: "block", marginBottom: "8px" }}>
                                        🎯 Chọn Chế độ Lập danh sách Tăng ca:
                                    </label>
                                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: phuongThucLap === "TAT_CA" ? "bold" : "normal", color: phuongThucLap === "TAT_CA" ? "#1e40af" : "#334155" }}>
                                            <input
                                                type="radio"
                                                name="phuongThucLap"
                                                value="TAT_CA"
                                                checked={phuongThucLap === "TAT_CA"}
                                                onChange={() => setPhuongThucLap("TAT_CA")}
                                            />
                                            🌐 Lập theo Tất cả danh sách nhân viên khả dụng (Chế độ mặc định)
                                        </label>

                                        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: phuongThucLap === "LINE" ? "bold" : "normal", color: phuongThucLap === "LINE" ? "#1e40af" : "#334155" }}>
                                            <input
                                                type="radio"
                                                name="phuongThucLap"
                                                value="LINE"
                                                checked={phuongThucLap === "LINE"}
                                                onChange={() => setPhuongThucLap("LINE")}
                                            />
                                            ⛓️ Lập chi tiết theo từng Dây chuyền sản xuất
                                        </label>
                                    </div>
                                </div>

                                {/* Cấu hình cơ bản: Ngày, Ca làm, Số lượng cần */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "var(--radius)", border: "1px solid #cbd5e1" }}>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>📅 Ngày tăng ca (*):</label>
                                        <input
                                            type="date"
                                            required
                                            value={ngayLap}
                                            onChange={(e) => setNgayLap(e.target.value)}
                                            style={{ marginTop: "4px" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>⏰ Chọn ca tăng ca (*):</label>
                                        <select
                                            required
<<<<<<< HEAD
                                            disabled={!laAdmin && Boolean(userCaLamId)}
                                            value={formDangKy.ca_lam_id}
<<<<<<< HEAD
                                            onChange={(e) => setFormDangKy({ ...formDangKy, ca_lam_id: e.target.value, nhan_vien_ids: [] })}
                                            style={{
                                                background: (!laAdmin && userCaLamId) ? "#f1f5f9" : "#fff",
                                                cursor: (!laAdmin && userCaLamId) ? "not-allowed" : "pointer"
                                            }}
=======
                                            disabled={laLeaderOnly && Boolean(nguoiDung?.ca_lam_id)}
                                            onChange={(e) => setFormDangKy({ ...formDangKy, ca_lam_id: e.target.value })}
                                            style={{ background: laLeaderOnly && nguoiDung?.ca_lam_id ? "#f1f5f9" : "#fff" }}
>>>>>>> upstream/main
=======
                                            value={caLamLapId}
                                            disabled={laLeaderOnly && Boolean(nguoiDung?.ca_lam_id)}
                                            onChange={(e) => setCaLamLapId(e.target.value)}
                                            style={{ marginTop: "4px", background: laLeaderOnly && nguoiDung?.ca_lam_id ? "#f1f5f9" : "#fff" }}
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e
                                        >
                                            {danhSachCaLam.map((cl) => (
                                                <option key={cl.id} value={cl.id}>
                                                    {cl.ten_ca} ({cl.gio_bat_dau?.substring(0, 5)} - {cl.gio_ket_thuc?.substring(0, 5)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {phuongThucLap === "TAT_CA" ? (
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>🔢 Số lượng nhân viên cần (*):</label>
                                            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="200"
                                                    value={soLuongCanTangCa}
                                                    onChange={(e) => setSoLuongCanTangCa(e.target.value)}
                                                    style={{ width: "90px" }}
                                                />
                                                <button
                                                    type="button"
                                                    style={{ fontSize: "11px", background: "var(--steel)", color: "#fff", border: "none", borderRadius: "var(--radius)", padding: "0 8px", cursor: "pointer", fontWeight: "bold" }}
                                                    onClick={xuLyAutoPickChung}
                                                    title="Chọn nhanh top N nhân viên khả dụng"
                                                >
                                                    ⚡ Auto pick {soLuongCanTangCa}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>📊 Tổng số chỉ tiêu từ các Line:</label>
                                            <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#2563eb" }}>{tongChiTieuTangCa}</span>
                                                <span style={{ fontSize: "12px", color: "#64748b" }}>nhân sự</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* CHẾ ĐỘ 2: BẢNG CHỌN DÂY CHUYỀN & NHẬP SỐ LƯỢNG RIÊNG CHO TỪNG DÂY CHUYỀN */}
                                {phuongThucLap === "LINE" && (
                                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "var(--radius)", padding: "12px", background: "#fff" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                                            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#1e293b" }}>
                                                ⛓️ Nhập số lượng tăng ca riêng cho từng Dây chuyền:
                                            </label>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontSize: "12px", color: "#64748b" }}>Gán nhanh tất cả:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={soLuongDefaultLine}
                                                    onChange={(e) => xuLyApDungHangLoatSoLuong(e.target.value)}
                                                    style={{ width: "60px", padding: "3px 6px", fontSize: "12px", textAlign: "center" }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={xuLyAutoPickTheoLine}
                                                    style={{ fontSize: "11px", background: "var(--amber-dark)", color: "#1c2128", border: "none", borderRadius: "var(--radius)", padding: "5px 10px", cursor: "pointer", fontWeight: "bold" }}
                                                >
                                                    🤖 Auto-pick theo các Line
                                                </button>
                                            </div>
                                        </div>

<<<<<<< HEAD
                                {formDangKy.cheDo === "CHUYEN" ? (
                                    <div className="nhom-o-nhap">
                                        <label>Chọn Dây chuyền sản xuất (*):</label>
                                        <select
                                            value={formDangKy.day_chuyen_id}
                                            onChange={(e) => setFormDangKy({ ...formDangKy, day_chuyen_id: e.target.value })}
                                        >
                                            {danhSachDayChuyen
                                                .filter(dc => !laLeaderOnly || !nguoiDung?.day_chuyen_id || String(dc.id) === String(nguoiDung.day_chuyen_id))
                                                .map((dc) => (
                                                    <option key={dc.id} value={dc.id}>
                                                        {dc.ten_day_chuyen} (Duyệt toàn bộ nhân sự trong chuyền)
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="nhom-o-nhap">
<<<<<<< HEAD
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                            <label style={{ margin: 0 }}>Danh sách nhân viên (Đã chọn: {formDangKy.nhan_vien_ids.length}):</label>
                                            {formDangKy.day_chuyen_id && (
                                                <button
                                                    type="button"
                                                    style={{ fontSize: "12px", background: "none", border: "none", color: "var(--amber-dark)", cursor: "pointer", textDecoration: "underline" }}
                                                    onClick={() => xuLyChonTatCaSubLine(formDangKy.day_chuyen_id)}
                                                >
                                                    + Chọn nhanh line này
                                                </button>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                maxHeight: "180px",
                                                overflowY: "auto",
                                                border: "1px solid #d3d7de",
                                                borderRadius: "var(--radius)",
                                                padding: "8px 12px",
                                                background: "#fff"
                                            }}
                                        >
                                            {(() => {
                                                const nhanVienTheoCa = danhSachNhanVien.filter((nv) => {
                                                    if (!formDangKy.ca_lam_id) return true;
                                                    return String(nv.ca_lam_id) === String(formDangKy.ca_lam_id);
                                                });

                                                if (nhanVienTheoCa.length === 0) {
                                                    return (
                                                        <div style={{ padding: "12px", color: "var(--text-muted)", textAlign: "center", fontSize: "13px" }}>
                                                            ⚠️ Không có nhân viên nào thuộc ca làm được chọn
                                                        </div>
                                                    );
                                                }

                                                return nhanVienTheoCa.map((nv) => (
                                                    <label
                                                        key={nv.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            padding: "4px 0",
                                                            borderBottom: "1px solid #f1f5f9",
                                                            cursor: "pointer",
                                                            fontSize: "13px"
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formDangKy.nhan_vien_ids.includes(nv.id)}
                                                            onChange={() => xuLyNhanVienSelection(nv.id)}
                                                        />
                                                        <span>
                                                            <strong>{nv.ho_ten}</strong> ({nv.ma_nhan_vien || "NV"}) - {nv.ten_day_chuyen || "Tự do"}
                                                        </span>
                                                    </label>
                                                ));
                                            })()}
                                        </div>
=======
                                        {(() => {
                                            const laAdminUser = nguoiDung && (nguoiDung.role === "ADMIN" || nguoiDung.role === "MANAGER");
                                            const activeTargetCa = laLeaderOnly && nguoiDung?.ca_lam_id ? nguoiDung.ca_lam_id : formDangKy.ca_lam_id;

                                            // Lọc danh sách nhân viên trong modal
                                            let listNvFiltered = danhSachNhanVien;

                                            if (laLeaderOnly) {
                                                // Đối với Leader: CHỈ hiện nhân viên thuộc ca của Leader (VÀ thuộc chuyền nếu có)
                                                listNvFiltered = danhSachNhanVien.filter((nv) => {
                                                    const matchCa = !activeTargetCa || String(nv.ca_lam_id) === String(activeTargetCa);
                                                    const matchLine = !nguoiDung?.day_chuyen_id || String(nv.day_chuyen_id) === String(nguoiDung.day_chuyen_id);
                                                    return matchCa && matchLine; // AND: bắt buộc đúng ca
                                                });
                                            } else if (laAdminUser && formDangKy.ca_lam_id) {
                                                // Đối với Admin: hiển thị danh sách nhân viên thuộc ca được chọn
                                                listNvFiltered = danhSachNhanVien.filter(
                                                    (nv) => String(nv.ca_lam_id) === String(formDangKy.ca_lam_id)
                                                );
                                            }

                                            // Nếu lọc theo từ khóa trong modal (nếu có)
                                            if (tuKhoaModal) {
                                                const kw = tuKhoaModal.toLowerCase();
                                                listNvFiltered = listNvFiltered.filter(
                                                    (nv) => nv.ho_ten?.toLowerCase().includes(kw) || nv.ma_nhan_vien?.toLowerCase().includes(kw)
                                                );
                                            }

                                            const currentCa = danhSachCaLam.find(c => String(c.id) === String(formDangKy.ca_lam_id));
                                            const allChecked = listNvFiltered.length > 0 && listNvFiltered.every((nv) => formDangKy.nhan_vien_ids.includes(nv.id));

                                            return (
                                                <>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                        <label style={{ margin: 0, fontWeight: "bold" }}>
                                                            Danh sách Nhân viên {currentCa ? `(${currentCa.ten_ca})` : ""}:{" "}
                                                            <span style={{ fontSize: "12px", background: "#e2e8f0", color: "#0f172a", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                                                                Đã chọn: {formDangKy.nhan_vien_ids.length}
                                                            </span>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            style={{ fontSize: "12px", background: "none", border: "none", color: "var(--amber-dark)", cursor: "pointer", textDecoration: "underline", fontWeight: "bold" }}
                                                            onClick={() => {
                                                                const ids = listNvFiltered.map(n => n.id);
                                                                if (allChecked) {
                                                                    setFormDangKy({
                                                                        ...formDangKy,
                                                                        nhan_vien_ids: formDangKy.nhan_vien_ids.filter(id => !ids.includes(id))
                                                                    });
                                                                } else {
                                                                    setFormDangKy({
                                                                        ...formDangKy,
                                                                        nhan_vien_ids: Array.from(new Set([...formDangKy.nhan_vien_ids, ...ids]))
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            {allChecked ? "❌ Bỏ chọn ca này" : "✅ Chọn tất cả ca này"}
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        placeholder="🔍 Tìm nhân viên theo tên/mã..."
                                                        value={tuKhoaModal}
                                                        onChange={(e) => setTuKhoaModal(e.target.value)}
                                                        style={{ width: "100%", padding: "6px 10px", fontSize: "12px", marginBottom: "8px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                                                    />

                                                    {laAdminUser && (
                                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                                                            ℹ️ <i>(Admin đang xem nhân viên thuộc {currentCa ? currentCa.ten_ca : "ca đã chọn"})</i>
                                                        </div>
                                                    )}
                                                    {laLeaderOnly && (
                                                        <div style={{ fontSize: "11px", color: "#b45309", marginBottom: "6px", fontWeight: "600" }}>
                                                            🔒 <i>(Leader chỉ được chọn nhân viên thuộc ca/dây chuyền của mình)</i>
                                                        </div>
                                                    )}
=======
                                        {/* Danh sách Dây chuyền kèm ô Nhập số lượng */}
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px", maxHeight: "150px", overflowY: "auto", padding: "4px" }}>
                                            {danhSachDayChuyen.map((dc) => {
                                                const isSelected = selectedDayChuyenIds.includes(dc.id);
                                                const qty = soLuongPerLine[dc.id] || 5;
                                                const pickedInLine = selectedUngVienIds.filter(id => {
                                                    const nv = danhSachUngVien.find(n => n.id === id);
                                                    return nv && Number(nv.day_chuyen_id) === Number(dc.id);
                                                }).length;
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e

                                                return (
                                                    <div
                                                        key={dc.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            padding: "6px 10px",
                                                            borderRadius: "var(--radius)",
                                                            border: `1px solid ${isSelected ? "#2563eb" : "#e2e8f0"}`,
                                                            background: isSelected ? "#eff6ff" : "#f8fafc"
                                                        }}
                                                    >
                                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: isSelected ? "bold" : "normal" }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleDayChuyenSelection(dc.id)}
                                                            />
                                                            {dc.ten_day_chuyen}
                                                        </label>

                                                        {isSelected && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                <span style={{ fontSize: "11px", color: "#0369a1" }}>
                                                                    ({pickedInLine}/{qty})
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="100"
                                                                    value={qty}
                                                                    onChange={(e) => capNhatSoLuongLine(dc.id, e.target.value)}
                                                                    style={{ width: "55px", padding: "2px 6px", fontSize: "12px", textAlign: "center", border: "1px solid #93c5fd", borderRadius: "4px" }}
                                                                />
                                                                <span style={{ fontSize: "11px", color: "#64748b" }}>người</span>
                                                            </div>
                                                        )}
                                                    </div>
<<<<<<< HEAD
                                                </>
                                            );
                                        })()}
>>>>>>> upstream/main
=======
                                                );
                                            })}
                                        </div>
>>>>>>> 09a1d3233510164eca448250095ffdfc7be14d2e
                                    </div>
                                )}

                                {/* Danh sách Ứng viên sẵn sàng (Đã lọc trùng lặp) */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>
                                            👥 Danh sách Nhân viên khả dụng (Đã loại bỏ trùng ca trong ngày):{" "}
                                            <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", marginLeft: "6px" }}>
                                                Đã chọn: {selectedUngVienIds.length} / {tongChiTieuTangCa} người
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="🔍 Tìm nhân viên..."
                                            value={tuKhoaUngVien}
                                            onChange={(e) => setTuKhoaUngVien(e.target.value)}
                                            style={{ padding: "4px 8px", fontSize: "12px", width: "160px", border: "1px solid #cbd5e1", borderRadius: "var(--radius)" }}
                                        />
                                    </div>

                                    {dangTaiUngVien ? (
                                        <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Đang kiểm tra dữ liệu ứng viên không trùng...</div>
                                    ) : (
                                        <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", background: "#fff", padding: "8px" }}>
                                            {filteredCandidates.length === 0 ? (
                                                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                                                    Không tìm thấy nhân viên khả dụng (Tất cả nhân sự đã được chọn tăng ca cho ca/ngày này hoặc không khớp dây chuyền).
                                                </div>
                                            ) : (
                                                filteredCandidates.map((nv) => {
                                                    const isChecked = selectedUngVienIds.includes(nv.id);
                                                    return (
                                                        <div
                                                            key={nv.id}
                                                            onClick={() => toggleUngVienSelection(nv.id)}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                padding: "8px 10px",
                                                                borderBottom: "1px solid #f1f5f9",
                                                                background: isChecked ? "#eff6ff" : "#fff",
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => {}}
                                                                />
                                                                <div>
                                                                    <strong style={{ fontSize: "13px", color: "var(--charcoal)" }}>{nv.ho_ten}</strong>
                                                                    <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginLeft: "6px" }}>
                                                                        ({nv.ma_nhan_vien})
                                                                    </span>
                                                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                                        Dây chuyền gốc: <strong>{nv.ten_day_chuyen || "Tự do"}</strong> | Ca làm cố định: {nv.ten_ca_goc || "Chưa gán"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                                {nv.ky_nang_list && nv.ky_nang_list.length > 0 ? (
                                                                    nv.ky_nang_list.map((kn, idx) => (
                                                                        <span key={idx} style={{ fontSize: "10px", background: "#e0f2fe", color: "#0369a1", padding: "1px 5px", borderRadius: "4px" }}>
                                                                            🎓 {kn.ten_chung_chi} (C{kn.cap_do})
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>LĐ Phổ thông</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer" style={{ marginTop: "8px" }}>
                                    <button type="button" className="nut-phu" onClick={() => setHienModalLapTangCa(false)}>
                                        Hủy
                                    </button>
                                    <button type="button" className="nut-chinh" onClick={xuLyNhanOkModal}>
                                        OK (Tiếp tục)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* STEP XÁC NHẬN (CONFIRMATION DIALOG: ĐỒNG Ý / HỦY) */
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "var(--radius)", padding: "16px" }}>
                                    <h4 style={{ margin: "0 0 10px", color: "#1e3a8a", fontSize: "15px" }}>
                                        📋 Thông báo Xác nhận Lập danh sách Tăng ca
                                    </h4>
                                    <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#1e293b" }}>
                                        Bạn có chắc chắn muốn lập và duyệt danh sách tăng ca cho <strong>{selectedUngVienIds.length} nhân viên</strong> với thông tin sau không?
                                    </p>
                                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                                        <li><strong>Ngày tăng ca:</strong> {new Date(ngayLap).toLocaleDateString("vi-VN")}</li>
                                        <li><strong>Ca tăng ca:</strong> {caLamLapSelectedObj ? `${caLamLapSelectedObj.ten_ca} (${caLamLapSelectedObj.gio_bat_dau?.substring(0,5)} - ${caLamLapSelectedObj.gio_ket_thuc?.substring(0,5)})` : caLamLapId}</li>
                                        <li><strong>Người lập / Quản lý:</strong> {nguoiDung?.ho_ten || nguoiDung?.ten_dang_nhap || "Quản lý"} ({nguoiDung?.role})</li>
                                        <li><strong>Chế độ lập:</strong> {phuongThucLap === "LINE" ? "Chi tiết theo từng Dây chuyền" : "Theo tất cả danh sách nhân viên"}</li>
                                        {phuongThucLap === "LINE" && (
                                            <li><strong>Chỉ tiêu từng Line:</strong> {
                                                selectedDayChuyenIds.map(id => {
                                                    const dc = danhSachDayChuyen.find(d => d.id === id);
                                                    return `${dc ? dc.ten_day_chuyen : id}: ${soLuongPerLine[id] || 0} người`;
                                                }).join(", ")
                                            }</li>
                                        )}
                                        <li><strong>Tổng đã chọn:</strong> {selectedUngVienIds.length} / {tongChiTieuTangCa} nhân viên</li>
                                    </ul>
                                </div>

                                <div>
                                    <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>Danh sách nhân viên & chứng chỉ được chọn:</strong>
                                    <div style={{ maxHeight: "160px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "var(--radius)", padding: "8px", background: "#fff" }}>
                                        {danhSachUngVien
                                            .filter(n => selectedUngVienIds.includes(n.id))
                                            .map((nv, idx) => (
                                                <div key={nv.id} style={{ fontSize: "12px", padding: "4px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                                                    <span>{idx + 1}. <strong>{nv.ho_ten}</strong> ({nv.ma_nhan_vien}) - Dây chuyền: {nv.ten_day_chuyen || "Tự do"}</span>
                                                    <span style={{ color: "#0369a1" }}>
                                                        {nv.ky_nang_list && nv.ky_nang_list.length > 0 ? nv.ky_nang_list.map(k => `${k.ten_chung_chi} (C${k.cap_do})`).join(", ") : "Chưa có CC"}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ marginTop: "12px" }}>
                                    <button type="button" className="nut-phu" onClick={() => setStepModal("CHON_DU_LIEU")}>
                                        ❌ Hủy / Sửa lại
                                    </button>
                                    <button
                                        type="button"
                                        className="nut-chinh"
                                        style={{ background: "var(--green)", color: "#fff" }}
                                        onClick={xuLyXacNhanDongY}
                                    >
                                        ✅ Đồng ý & Lưu nhật ký
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
