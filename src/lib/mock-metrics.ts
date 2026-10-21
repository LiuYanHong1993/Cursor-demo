function jitter(base: number, spread: number) {
  return Math.max(0, +(base + (Math.random() - 0.5) * spread).toFixed(2));
}

function series(points = 24, base = 40, spread = 20) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    t: new Date(now - (points - i) * 60_000).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    value: jitter(base + Math.sin(i / 3) * (spread / 2), spread / 2),
  }));
}

export function getHostMetrics() {
  return {
    refreshedAt: new Date().toISOString(),
    cpu: {
      usage: jitter(42, 18),
      cores: 8,
      series: series(24, 45, 25),
    },
    memory: {
      usedGb: jitter(11.2, 1.5),
      totalGb: 32,
      usage: jitter(35, 10),
      series: series(24, 36, 8),
    },
    disk: {
      usedGb: jitter(186, 4),
      totalGb: 500,
      freeGb: jitter(314, 4),
      series: series(24, 37, 2),
    },
  };
}

export function getSqlMetrics() {
  const sqls = [
    "SELECT * FROM users WHERE status = ?",
    "SELECT COUNT(*) FROM access_logs WHERE created_at > ?",
    "UPDATE sample_items SET status = ? WHERE id = ?",
    "INSERT INTO access_logs (username, action, path) VALUES (?, ?, ?)",
    "SELECT o.*, u.username FROM orgs o LEFT JOIN users u ON u.org_id = o.id",
  ];
  return {
    refreshedAt: new Date().toISOString(),
    rows: sqls.map((sql, i) => ({
      id: i + 1,
      sql,
      execCount: Math.floor(jitter(800 - i * 90, 120)),
      execTimeMs: jitter(12 + i * 3, 8),
      slowestMs: jitter(80 + i * 20, 40),
      txCount: Math.floor(jitter(40 - i * 3, 10)),
      errorCount: Math.floor(jitter(i === 2 ? 3 : 0.4, 2)),
      updateRows: Math.floor(jitter(i === 2 ? 120 : 0, 20)),
      readRows: Math.floor(jitter(2000 - i * 200, 300)),
      running: Math.floor(jitter(i < 2 ? 2 : 0.2, 2)),
      maxConcurrency: Math.floor(jitter(8 - i, 3)),
    })),
    distributions: {
      execTime: [
        { bucket: "<10ms", count: 520 },
        { bucket: "10-50ms", count: 310 },
        { bucket: "50-200ms", count: 95 },
        { bucket: ">200ms", count: 18 },
      ],
      execRsTime: [
        { bucket: "<20ms", count: 480 },
        { bucket: "20-100ms", count: 340 },
        { bucket: ">100ms", count: 123 },
      ],
      readRows: [
        { bucket: "0-10", count: 600 },
        { bucket: "11-100", count: 250 },
        { bucket: ">100", count: 93 },
      ],
      updateRows: [
        { bucket: "0", count: 820 },
        { bucket: "1-10", count: 95 },
        { bucket: ">10", count: 28 },
      ],
    },
  };
}

export function getSqlFirewallMetrics() {
  return {
    refreshedAt: new Date().toISOString(),
    defense: {
      checkCount: Math.floor(jitter(12540, 200)),
      hardCheckCount: Math.floor(jitter(320, 40)),
      illegalCount: Math.floor(jitter(18, 6)),
      blacklistHit: Math.floor(jitter(7, 3)),
      blacklistLen: 42,
      whitelistHit: Math.floor(jitter(11800, 200)),
      whitelistLen: 86,
      syntaxError: Math.floor(jitter(11, 4)),
    },
    tables: [
      { name: "users", Select: 4200, SelectInto: 0, Insert: 35, Update: 88, Delete: 2, Truncate: 0, Create: 0, Alter: 0, Drop: 0, Replace: 0, deletedRows: 2 },
      { name: "access_logs", Select: 3100, SelectInto: 12, Insert: 890, Update: 0, Delete: 40, Truncate: 0, Create: 0, Alter: 0, Drop: 0, Replace: 0, deletedRows: 40 },
      { name: "orgs", Select: 1800, SelectInto: 0, Insert: 3, Update: 5, Delete: 0, Truncate: 0, Create: 0, Alter: 1, Drop: 0, Replace: 0, deletedRows: 0 },
      { name: "sample_items", Select: 960, SelectInto: 0, Insert: 22, Update: 41, Delete: 4, Truncate: 0, Create: 0, Alter: 0, Drop: 0, Replace: 0, deletedRows: 4 },
    ],
    samples: [
      { sql: "SELECT * FROM users; DROP TABLE users;--", exec: 3, errors: 3, readRows: 0, updateRows: 0 },
      { sql: "UPDATE users SET password_hash='x'", exec: 1, errors: 1, readRows: 0, updateRows: 0 },
      { sql: "SELECT * FROM access_logs WHERE 1=1", exec: 12, errors: 0, readRows: 420, updateRows: 0 },
    ],
  };
}

export function getWebAppMetrics() {
  return {
    refreshedAt: new Date().toISOString(),
    currentExecuting: Math.floor(jitter(6, 4)),
    maxConcurrency: 48,
    totalRequests: Math.floor(jitter(98200, 400)),
    sessionCount: Math.floor(jitter(210, 30)),
    txCommit: Math.floor(jitter(5400, 80)),
    txRollback: Math.floor(jitter(26, 8)),
    jdbcExec: Math.floor(jitter(120400, 500)),
    jdbcTimeMs: Math.floor(jitter(880000, 20000)),
    readRows: Math.floor(jitter(2_400_000, 50000)),
    updateRows: Math.floor(jitter(18500, 400)),
    series: series(24, 55, 30),
  };
}

export function getUrlMetrics() {
  const urls = [
    "/api/users",
    "/api/orgs",
    "/admin/monitoring/host",
    "/login",
    "/api/monitoring/sql",
    "/portal/notices",
    "/api/logs",
  ];
  return {
    refreshedAt: new Date().toISOString(),
    rows: urls.map((uri, i) => ({
      uri,
      requestCount: Math.floor(jitter(5000 - i * 400, 300)),
      totalTimeMs: Math.floor(jitter(120000 - i * 8000, 10000)),
      slowestMs: jitter(900 - i * 80, 120),
      running: Math.floor(jitter(i < 3 ? 2 : 0.3, 2)),
      maxConcurrency: Math.floor(jitter(20 - i, 5)),
      jdbcExec: Math.floor(jitter(8000 - i * 500, 400)),
      jdbcError: Math.floor(jitter(i === 4 ? 5 : 0.5, 2)),
      jdbcTimeMs: Math.floor(jitter(40000 - i * 3000, 4000)),
      txCommit: Math.floor(jitter(600 - i * 40, 50)),
      txRollback: Math.floor(jitter(i, 2)),
      readRows: Math.floor(jitter(20000 - i * 1500, 2000)),
      updateRows: Math.floor(jitter(i < 2 ? 300 : 20, 40)),
    })),
  };
}
