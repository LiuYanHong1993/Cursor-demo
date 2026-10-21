/**
 * 多层加密 / 脱敏演示层（原型）
 * - 传输层：HTTPS/TLS 通道示意（本地 HTTP 时用 X-Ilook-Channel 头模拟加密通道）
 * - 存储层：敏感字段 AES-256-GCM 加密后落库
 * - 展示层：手机号 / 证件号脱敏
 */
import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY = crypto.scryptSync(
  process.env.ILOOK_SECRET || "ilook-demo-secret-v1",
  "ilook-salt",
  32
);

export function encryptField(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([iv, tag, enc]).toString("base64"),
    algorithm: ALGO,
    layers: ["storage-aes-256-gcm"],
  };
}

export function decryptField(payload) {
  const buf = Buffer.from(payload.ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function maskPhone(phone) {
  const s = String(phone || "");
  if (s.length < 7) return "***";
  return `${s.slice(0, 3)}****${s.slice(-4)}`;
}

export function maskIdCard(id) {
  const s = String(id || "");
  if (s.length < 8) return "********";
  return `${s.slice(0, 4)}${"*".repeat(Math.max(0, s.length - 8))}${s.slice(-4)}`;
}

export function channelMeta(req) {
  const tls = Boolean(req.socket?.encrypted || req.headers["x-forwarded-proto"] === "https");
  const demoSecure = req.headers["x-ilook-channel"] === "encrypted";
  return {
    transport: tls || demoSecure ? "TLS/加密通道" : "明文(本地演示可开 X-Ilook-Channel)",
    secure: tls || demoSecure,
    layers: [
      tls || demoSecure ? "L1-transport-tls" : "L1-transport-plain",
      "L2-app-payload-hmac",
      "L3-field-aes-gcm",
    ],
  };
}

export function signPayload(body) {
  const h = crypto.createHmac("sha256", KEY);
  h.update(JSON.stringify(body ?? {}));
  return h.digest("hex");
}
