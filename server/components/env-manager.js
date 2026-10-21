/**
 * 组件化环境管理
 * 各运行时组件通过 IPC 总线注册健康状态，演示高可靠进程间通信
 */
import { bus } from "../ipc/bus.js";

const COMPONENTS = [
  { id: "gateway", name: "接入网关", role: "edge" },
  { id: "session-engine", name: "实训会话引擎", role: "domain" },
  { id: "ai-coach", name: "AI 教练推理", role: "ai", category: "人工智能软件" },
  { id: "vr-runtime", name: "VR 运行时桥接", role: "runtime" },
  { id: "privacy-vault", name: "隐私保险箱", role: "security" },
  { id: "progress-projector", name: "进度投影读模型", role: "readmodel" },
];

export function createEnvManager() {
  /** @type {Map<string, object>} */
  const registry = new Map();

  for (const c of COMPONENTS) {
    registry.set(c.id, {
      ...c,
      status: "starting",
      lastHeartbeat: null,
      ipcTopic: `component.${c.id}.heartbeat`,
    });
  }

  // 各组件订阅自身心跳并 ACK
  for (const c of COMPONENTS) {
    bus.subscribe(`component.${c.id}.heartbeat`, async () => {
      await Promise.resolve();
    });
  }

  function heartbeatAll() {
    const now = new Date().toISOString();
    for (const c of registry.values()) {
      c.status = "healthy";
      c.lastHeartbeat = now;
      bus.publish(c.ipcTopic, { componentId: c.id, at: now }, { retries: 1, ackTimeoutMs: 400 });
    }
  }

  heartbeatAll();
  const timer = setInterval(heartbeatAll, 8000);
  if (typeof timer.unref === "function") timer.unref();

  return {
    list() {
      return [...registry.values()];
    },
    classify() {
      return {
        softwareCategory: "人工智能软件",
        rationale: "内置 AI 教练推理组件，对实训动作给出辅助评分与纠偏建议",
        aiComponent: registry.get("ai-coach"),
      };
    },
    toggle(id) {
      const c = registry.get(id);
      if (!c) throw Object.assign(new Error("组件不存在"), { status: 404 });
      c.status = c.status === "healthy" ? "degraded" : "healthy";
      c.lastHeartbeat = new Date().toISOString();
      bus.publish(`component.${c.id}.status`, { componentId: id, status: c.status });
      return c;
    },
  };
}
