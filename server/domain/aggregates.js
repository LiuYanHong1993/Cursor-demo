/**
 * 领域聚合（原型）
 *
 * 一致性约定：
 * - 聚合内强一致：TrainingSession 内步骤推进、进度、评分在同一事务边界同步提交
 * - 聚合间最终一致：会话完成后通过 IPC 总线异步同步到 LearnerProfile / ScenarioCatalog
 */
import { randomUUID } from "node:crypto";
import { encryptField, maskPhone, maskIdCard, decryptField } from "../security/crypto.js";
import { bus } from "../ipc/bus.js";

/** @typedef {'draft'|'ready'|'running'|'paused'|'completed'|'failed'} SessionStatus */

const SESSION_FLOW = ["briefing", "equipment_check", "vr_practice", "assessment", "debrief"];

export const STEP_LABELS = {
  briefing: "安全简报",
  equipment_check: "设备点检",
  vr_practice: "VR 实操",
  assessment: "考核评分",
  debrief: "复盘归档",
};

export function createStore() {
  const scenarios = [
    {
      id: "scn-bridge-inspect",
      name: "桥梁结构巡检实训",
      difficulty: "中级",
      durationMin: 45,
      envComponents: ["vr-headset", "spatial-tracking", "physics-sim"],
      aiAssist: true,
    },
    {
      id: "scn-plant-safety",
      name: "厂区危化应急演练",
      difficulty: "高级",
      durationMin: 60,
      envComponents: ["vr-headset", "haptic-glove", "gas-sensor-sim"],
      aiAssist: true,
    },
    {
      id: "scn-pipeline-weld",
      name: "管线焊接工艺训练",
      difficulty: "初级",
      durationMin: 30,
      envComponents: ["vr-headset", "tool-tracking"],
      aiAssist: false,
    },
  ];

  /** @type {Map<string, object>} */
  const learners = new Map();
  /** @type {Map<string, object>} */
  const sessions = new Map();
  /** @type {object[]} */
  const outbox = [];
  /** @type {object[]} */
  const consistencyLog = [];

  seedLearners(learners);

  // 聚合间最终一致：监听会话完成事件，异步更新学员档案
  bus.subscribe("session.completed", async (envelope) => {
    const { sessionId, learnerId, score } = envelope.payload;
    const learner = learners.get(learnerId);
    if (!learner) throw new Error("learner missing");
    // 模拟跨聚合延迟
    await sleep(120);
    learner.completedSessions += 1;
    learner.totalScore += score;
    learner.lastSyncedAt = new Date().toISOString();
    learner.syncStatus = "synced";
    consistencyLog.unshift({
      at: new Date().toISOString(),
      kind: "eventual",
      from: "TrainingSession",
      to: "LearnerProfile",
      sessionId,
      messageId: envelope.id,
      note: "跨聚合异步同步完成（最终一致）",
    });
  });

  return {
    scenarios,
    learners,
    sessions,
    outbox,
    consistencyLog,
    SESSION_FLOW,
  };
}

function seedLearners(learners) {
  const samples = [
    { name: "陈思远", phone: "13812345678", idCard: "110101199001011234", org: "工程一班" },
    { name: "林晓薇", phone: "15987654321", idCard: "310101199205158765", org: "安全二班" },
    { name: "周启明", phone: "18600001111", idCard: "440101199808088888", org: "机电三班" },
  ];
  for (const s of samples) {
    const id = randomUUID();
    const phoneEnc = encryptField(s.phone);
    const idEnc = encryptField(s.idCard);
    learners.set(id, {
      id,
      name: s.name,
      org: s.org,
      phoneMasked: maskPhone(s.phone),
      idCardMasked: maskIdCard(s.idCard),
      phoneEnc,
      idEnc,
      completedSessions: 0,
      totalScore: 0,
      syncStatus: "idle",
      lastSyncedAt: null,
    });
  }
}

/**
 * 创建实训会话聚合根 —— 聚合内状态初始化为强一致快照
 */
export function startSession(store, { scenarioId, learnerId }) {
  const scenario = store.scenarios.find((s) => s.id === scenarioId);
  const learner = store.learners.get(learnerId);
  if (!scenario) throw Object.assign(new Error("场景不存在"), { status: 404 });
  if (!learner) throw Object.assign(new Error("学员不存在"), { status: 404 });

  const id = randomUUID();
  /** @type {object} */
  const session = {
    id,
    scenarioId,
    scenarioName: scenario.name,
    learnerId,
    learnerName: learner.name,
    status: /** @type {SessionStatus} */ ("running"),
    currentStepIndex: 0,
    steps: store.SESSION_FLOW.map((key, i) => ({
      key,
      label: STEP_LABELS[key],
      status: i === 0 ? "active" : "pending",
      completedAt: null,
    })),
    score: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    consistency: "strong-within-aggregate",
  };

  // 聚合内强一致：会话 + 步骤状态同一事务边界写入
  store.sessions.set(id, session);
  learner.syncStatus = "pending-eventual";
  store.consistencyLog.unshift({
    at: new Date().toISOString(),
    kind: "strong",
    aggregate: "TrainingSession",
    sessionId: id,
    note: "会话创建与首步激活在同一事务边界提交（聚合内强一致）",
  });

  return publicSession(session);
}

/**
 * 推进步骤 —— 聚合内强一致更新
 */
export function advanceStep(store, sessionId) {
  const session = store.sessions.get(sessionId);
  if (!session) throw Object.assign(new Error("会话不存在"), { status: 404 });
  if (session.status !== "running" && session.status !== "paused") {
    throw Object.assign(new Error("会话已结束"), { status: 409 });
  }

  const idx = session.currentStepIndex;
  const step = session.steps[idx];
  if (!step) throw Object.assign(new Error("无下一步"), { status: 409 });

  // --- 事务边界开始（内存模拟）---
  const snapshot = structuredClone(session);
  try {
    step.status = "done";
    step.completedAt = new Date().toISOString();
    session.score += 18 + Math.floor(Math.random() * 5);
    if (idx + 1 < session.steps.length) {
      session.currentStepIndex = idx + 1;
      session.steps[idx + 1].status = "active";
      session.status = "running";
    } else {
      session.status = "completed";
      session.currentStepIndex = idx;
    }
    session.updatedAt = new Date().toISOString();
    store.consistencyLog.unshift({
      at: new Date().toISOString(),
      kind: "strong",
      aggregate: "TrainingSession",
      sessionId,
      note: `步骤「${step.label}」完成：进度/评分同一事务提交（聚合内强一致）`,
    });
  } catch (err) {
    // 回滚
    store.sessions.set(sessionId, snapshot);
    throw err;
  }
  // --- 事务边界结束 ---

  if (session.status === "completed") {
    // 聚合间最终一致：写入 outbox + IPC 发布
    const event = {
      type: "session.completed",
      sessionId: session.id,
      learnerId: session.learnerId,
      score: session.score,
      at: new Date().toISOString(),
    };
    store.outbox.push(event);
    const learner = store.learners.get(session.learnerId);
    if (learner) learner.syncStatus = "awaiting-ipc";
    bus.publish("session.completed", event, { retries: 2, ackTimeoutMs: 600 });
    store.consistencyLog.unshift({
      at: new Date().toISOString(),
      kind: "eventual-pending",
      from: "TrainingSession",
      to: "LearnerProfile",
      sessionId,
      note: "会话完成事件已投递 IPC，等待学员档案聚合最终一致同步",
    });
  }

  return publicSession(session);
}

export function listLearners(store) {
  return [...store.learners.values()].map((l) => ({
    id: l.id,
    name: l.name,
    org: l.org,
    phoneMasked: l.phoneMasked,
    idCardMasked: l.idCardMasked,
    phoneCipherPreview: l.phoneEnc.ciphertext.slice(0, 24) + "…",
    encryption: l.phoneEnc.algorithm,
    completedSessions: l.completedSessions,
    totalScore: l.totalScore,
    syncStatus: l.syncStatus,
    lastSyncedAt: l.lastSyncedAt,
  }));
}

export function revealLearnerSecret(store, learnerId) {
  const learner = store.learners.get(learnerId);
  if (!learner) throw Object.assign(new Error("学员不存在"), { status: 404 });
  return {
    id: learner.id,
    name: learner.name,
    phoneDecrypted: decryptField(learner.phoneEnc),
    idCardDecrypted: decryptField(learner.idEnc),
    warning: "仅管理端审计演示；生产环境需权限与审计日志",
  };
}

export function publicSession(session) {
  return {
    ...session,
    flowLabels: session.steps.map((s) => s.label),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
