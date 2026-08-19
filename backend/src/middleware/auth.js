import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, verified }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Blocks unverified students from actions like creating listings or requests.
// Admins bypass this check.
export function requireVerified(req, res, next) {
  if (req.user?.role === "admin" || req.user?.verified) {
    return next();
  }
  return res.status(403).json({
    error: "Your student ID has not been verified yet. Please wait for admin approval.",
  });
}
