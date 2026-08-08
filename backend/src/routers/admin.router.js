import { Router } from "express";
import AdminController from "../controllers/admin.controller.js";
import { xacThucToken, phanQuyen } from "../middleware/auth.middleware.js";
import { uploadExcel } from "../middleware/upload_excel.middleware.js";

const router = Router();

// Tất cả các route quản trị đều yêu cầu phải đăng nhập
router.use(xacThucToken);

// Nhật ký / Lịch sử hệ thống: cho phép ADMIN, MANAGER, LEADER_KHU_VUC, LEADER_LINE
router.get("/lich-su", phanQuyen("ADMIN", "LEADER_KHU_VUC", "LEADER_LINE", "MANAGER"), AdminController.layLichSuHeThong);

// Các route bên dưới yêu cầu ADMIN
router.get("/tai-khoan", phanQuyen("ADMIN"), AdminController.layDanhSachTaiKhoan);
router.post("/tai-khoan", phanQuyen("ADMIN"), AdminController.taoTaiKhoan);
router.post("/tai-khoan/batch-ca-lam", phanQuyen("ADMIN"), AdminController.ganCaLamHangLoat);
router.post("/tai-khoan/:id/cap-bac", phanQuyen("ADMIN"), AdminController.thayDoiCapBacTaiKhoan);
router.put("/tai-khoan/:id", phanQuyen("ADMIN"), AdminController.capNhatTaiKhoan);
router.delete("/tai-khoan/:id", phanQuyen("ADMIN"), AdminController.xoaTaiKhoan);
router.get("/nhan-vien/mau-excel", phanQuyen("ADMIN"), AdminController.taiFileMauExcel);
router.post("/nhan-vien/nhap-excel", phanQuyen("ADMIN"), uploadExcel.single("file"), AdminController.nhapExcel);

export default router;
