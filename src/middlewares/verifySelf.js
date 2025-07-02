import admin from "../config/firebase.js";


export async function verifySelf(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }
  
  const idToken = authHeader.split(" ")[1];
  
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    // 將 firebase user 資訊加入 request
    req.userId = decoded.uid;
    req.user = decoded;
    next();
  } catch (err) {
    console.error("驗證失敗:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}