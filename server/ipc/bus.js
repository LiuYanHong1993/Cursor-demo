/**
 * 组件间高可靠进程间通信（IPC）模拟层
 * - 进程内消息总线，带确认 ACK / 重试 / 死信
 * - 用于聚合间最终一致同步
 */
import { EventEmitter } from "node:events";

class ReliableBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this.history = [];
    this.pending = new Map();
    this.deadLetters = [];
    this.seq = 0;
  }

  /**
   * @param {string} topic
   * @param {object} payload
   * @param {{ retries?: number, ackTimeoutMs?: number }} [opts]
   */
  publish(topic, payload, opts = {}) {
    const retries = opts.retries ?? 2;
    const ackTimeoutMs = opts.ackTimeoutMs ?? 800;
    const id = `msg-${++this.seq}-${Date.now()}`;
    const envelope = {
      id,
      topic,
      payload,
      publishedAt: new Date().toISOString(),
      attempts: 0,
      status: "pending",
    };
    this.pending.set(id, envelope);
    this.history.unshift({ ...envelope });
    if (this.history.length > 80) this.history.length = 80;
    this.#dispatch(envelope, retries, ackTimeoutMs);
    return envelope;
  }

  ack(id) {
    const env = this.pending.get(id);
    if (!env) return false;
    env.status = "acked";
    this.pending.delete(id);
    this.#patchHistory(id, { status: "acked", ackedAt: new Date().toISOString() });
    this.emit("acked", env);
    return true;
  }

  subscribe(topic, handler) {
    const listener = (envelope) => {
      if (envelope.topic !== topic) return;
      Promise.resolve(handler(envelope))
        .then(() => this.ack(envelope.id))
        .catch((err) => {
          envelope.lastError = String(err?.message || err);
          this.#patchHistory(envelope.id, { lastError: envelope.lastError });
        });
    };
    this.on("message", listener);
    return () => this.off("message", listener);
  }

  snapshot() {
    return {
      pending: [...this.pending.values()],
      recent: this.history.slice(0, 30),
      deadLetters: [...this.deadLetters],
    };
  }

  #dispatch(envelope, retries, ackTimeoutMs) {
    envelope.attempts += 1;
    envelope.status = "delivered";
    this.#patchHistory(envelope.id, {
      attempts: envelope.attempts,
      status: envelope.status,
    });
    this.emit("message", envelope);

    setTimeout(() => {
      if (!this.pending.has(envelope.id)) return;
      if (envelope.attempts <= retries) {
        this.#dispatch(envelope, retries, ackTimeoutMs);
      } else {
        envelope.status = "dead";
        this.pending.delete(envelope.id);
        this.deadLetters.unshift({ ...envelope, deadAt: new Date().toISOString() });
        if (this.deadLetters.length > 20) this.deadLetters.length = 20;
        this.#patchHistory(envelope.id, { status: "dead" });
        this.emit("dead", envelope);
      }
    }, ackTimeoutMs);
  }

  #patchHistory(id, patch) {
    const row = this.history.find((h) => h.id === id);
    if (row) Object.assign(row, patch);
  }
}

export const bus = new ReliableBus();
