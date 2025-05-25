// 測試用路由
// routes/me.js
import express from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";

const router = express.Router();

// 測試用：驗證登入狀態與資料庫是否有寫入
router.get("/", verifyFirebase, async (req, res) => {
	res.json({
		message: "Firebase token 驗證成功",
		userId: req.userId,
		profile: req.firebaseUser,
	});
});

export default router;
