/**
 * ilook 虚拟现实工程技术实训软件 V1.0 — 本地原型服务
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStore, startSession, advanceStep, listLearners, revealLearnerSecret, publicSession } from "./domain/aggregates.js";
import { createEnvManager } from "./components/env-manager.js";
import { bus } from "./ipc/bus.js";
import { channelMeta, signPayload } from "./security/crypto.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 3780);
const HOST = process.env.HOST || "127.0.0.1";

const store = createStore();
const env = createEnvManager();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body, req) {
  const channel = channelMeta(req);
  const payload = {
    ok: status < 400,
    channel,
    signature: signPayload(body),
    data: body,
  };
  const raw = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Ilook-Channel": channel.secure ? "encrypted" : "plain",
    "X-Ilook-Software": "ilook-vr-training/1.0",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Ilook-Channel",
  });
  res.end(raw);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(Object.assign(new Error("JSON 无效"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

async function handleApi(req, res, url) {
  const method = req.method || "GET";

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Ilook-Channel",
    });
    return res.end();
  }

  try {
    if (method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, {
        name: "ilook 虚拟现实工程技术实训软件",
        version: "V1.0",
        category: "人工智能软件",
        uptimeSec: Math.floor(process.uptime()),
      }, req);
    }

    if (method === "GET" && url.pathname === "/api/meta") {
      return sendJson(res, 200, {
        product: "ilook 虚拟现实工程技术实训软件（简称：ilook）V1.0",
        purpose: "为用户提供虚拟现实工程技术实训服务",
        principles: {
          withinAggregate: "强一致性",
          acrossAggregates: "最终一致性",
        },
        tech: [
          "人工智能软件分类",
          "组件化环境管理",
          "组件间高可靠进程间通信（IPC）",
          "多层加密传输与设备侧个人信息保护",
        ],
      }, req);
    }

    if (method === "GET" && url.pathname === "/api/scenarios") {
      return sendJson(res, 200, { scenarios: store.scenarios }, req);
    }

    if (method === "GET" && url.pathname === "/api/learners") {
      return sendJson(res, 200, { learners: listLearners(store) }, req);
    }

    if (method === "POST" && url.pathname.startsWith("/api/learners/") && url.pathname.endsWith("/reveal")) {
      const id = url.pathname.split("/")[3];
      return sendJson(res, 200, revealLearnerSecret(store, id), req);
    }

    if (method === "GET" && url.pathname === "/api/sessions") {
      const sessions = [...store.sessions.values()].map(publicSession).reverse();
      return sendJson(res, 200, { sessions }, req);
    }

    if (method === "POST" && url.pathname === "/api/sessions") {
      const body = await readBody(req);
      const session = startSession(store, {
        scenarioId: body.scenarioId,
        learnerId: body.learnerId,
      });
      return sendJson(res, 201, { session }, req);
    }

    if (method === "POST" && /^\/api\/sessions\/[^/]+\/advance$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3];
      const session = advanceStep(store, id);
      return sendJson(res, 200, { session }, req);
    }

    if (method === "GET" && url.pathname === "/api/consistency") {
      return sendJson(
        res,
        200,
        {
          log: store.consistencyLog.slice(0, 40),
          outbox: store.outbox.slice(-10),
        },
        req
      );
    }

    if (method === "GET" && url.pathname === "/api/ipc") {
      return sendJson(res, 200, bus.snapshot(), req);
    }

    if (method === "GET" && url.pathname === "/api/components") {
      return sendJson(
        res,
        200,
        {
          classification: env.classify(),
          components: env.list(),
        },
        req
      );
    }

    if (method === "POST" && /^\/api\/components\/[^/]+\/toggle$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3];
      return sendJson(res, 200, { component: env.toggle(id) }, req);
    }

    if (method === "POST" && url.pathname === "/api/ai/coach") {
      const body = await readBody(req);
      const tip = coachTip(body.stepKey || "vr_practice");
      return sendJson(res, 200, tip, req);
    }

    sendJson(res, 404, { error: "API 不存在" }, req);
  } catch (err) {
    const status = err.status || 500;
    sendJson(res, status, { error: err.message || String(err) }, req);
  }
}

function coachTip(stepKey) {
  const tips = {
    briefing: "AI 教练：请确认学员已完成安全须知签署，重点强调坠落防护。",
    equipment_check: "AI 教练：头显追踪漂移 > 2cm 时建议重新标定基站。",
    vr_practice: "AI 教练：检测到焊枪倾角偏离最佳区间，建议微调 8°–12°。",
    assessment: "AI 教练：根据动作轨迹相似度给出预估分 82，可人工复核。",
    debrief: "AI 教练：本场高频失误为「未锁定安全绳」，已写入个人纠偏清单。",
  };
  return {
    category: "人工智能软件",
    stepKey,
    advice: tips[stepKey] || tips.vr_practice,
    confidence: 0.86,
  };
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath);
  if (rel === "/") rel = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC, rel));
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`\n  ilook V1.0 原型已启动`);
  console.log(`  本地访问: http://${HOST}:${PORT}/`);
  console.log(`  健康检查: http://${HOST}:${PORT}/api/health\n`);
});
