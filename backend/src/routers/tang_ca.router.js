import { Router } from "express";
import TangCaController from "../controllers/tang_ca.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";

const router = Router();

router.use(xacThucToken);

// ================= QUẢN LÝ ĐĂNG KÝ TĂNG CA =================
router.get("/ung-vien", TangCaController.layDanhSachUngVienTangCa);
router.get("/dang-ky", TangCaController.layDanhSachDangKyTangCa);
router.post("/dang-ky", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"), TangCaController.taoDangKyTangCa);
router.post("/duyet", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"), TangCaController.duyetDangKyTangCa);
router.delete("/dang-ky/:id", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE"), TangCaController.xoaDangKyTangCa);

// ================= PHÂN BỔ NHÂN SỰ KHI TĂNG CA =================
router.get("/nhan-su-cho-phan-bo", TangCaController.layDanhSachNhanSuTangCaChoPhanBo);
router.post("/phan-bo", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"), TangCaController.phanBoNhanSuTangCa);
router.post("/go-phan-bo", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"), TangCaController.goPhanBoTangCa);
router.post("/auto-allocate", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"), TangCaController.tuDongPhanBoTangCa);

// ================= THỐNG KÊ LỊCH SỬ TĂNG CA & PHÂN BỔ =================
router.get("/lich-su", TangCaController.layLichSuTangCa);

export default router;
