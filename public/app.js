const state = {
  secureChannel: true,
  session: null,
  scenarios: [],
  learners: [],
};

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.secureChannel) headers["X-Ilook-Channel"] = "encrypted";

  const res = await fetch(path, { ...options, headers });
  const json = await res.json();
  updateChannelPill(json.channel);
  if (!res.ok || json.ok === false) {
    const msg = json?.data?.error || json?.error || res.statusText;
    throw new Error(msg);
  }
  return json;
}

function updateChannelPill(channel) {
  const el = $("channelPill");
  if (!channel) return;
  el.textContent = channel.secure
    ? `加密通道 · ${channel.layers?.[0] || "TLS"}`
    : "明文通道 · 本地演示";
  el.style.color = channel.secure ? "var(--accent)" : "var(--accent-2)";
}

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

async function loadBootstrap() {
  const [scenariosRes, learnersRes, sessionsRes, componentsRes, consRes, ipcRes] =
    await Promise.all([
      api("/api/scenarios"),
      api("/api/learners"),
      api("/api/sessions"),
      api("/api/components"),
      api("/api/consistency"),
      api("/api/ipc"),
    ]);

  state.scenarios = scenariosRes.data.scenarios;
  state.learners = learnersRes.data.learners;

  fillSelect($("scenarioSelect"), state.scenarios, (s) => `${s.name}（${s.difficulty}）`);
  fillSelect($("learnerSelect"), state.learners, (l) => `${l.name} · ${l.org}`);

  renderSessions(sessionsRes.data.sessions);
  renderLearners(state.learners);
  renderComponents(componentsRes.data);
  renderConsistency(consRes.data);
  renderIpc(ipcRes.data);
}

function fillSelect(el, items, labelFn) {
  el.innerHTML = items
    .map((item) => `<option value="${item.id}">${escapeHtml(labelFn(item))}</option>`)
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderFlow(session) {
  const list = $("flowList");
  if (!session) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = session.steps
    .map((step, i) => {
      const cls = step.status === "active" ? "active" : step.status === "done" ? "done" : "";
      return `<li class="${cls}">
        <span class="idx">${String(i + 1).padStart(2, "0")}</span>
        <span>${escapeHtml(step.label)}</span>
        <span class="badge">${step.status}</span>
      </li>`;
    })
    .join("");
}

function renderSessionMeta(session) {
  const el = $("sessionMeta");
  if (!session) {
    el.textContent = "尚未启动会话";
    return;
  }
  el.textContent = `${session.scenarioName} · ${session.learnerName} · ${session.status} · 得分 ${session.score}`;
}

function renderSessions(sessions) {
  const tbody = $("sessionRows");
  if (!sessions?.length) {
    tbody.innerHTML = `<tr><td colspan="5">暂无会话</td></tr>`;
    return;
  }
  tbody.innerHTML = sessions
    .slice(0, 8)
    .map(
      (s) => `<tr>
      <td>${escapeHtml(s.scenarioName)}</td>
      <td>${escapeHtml(s.learnerName)}</td>
      <td>${escapeHtml(s.status)}</td>
      <td>${s.score}</td>
      <td>${fmtTime(s.updatedAt)}</td>
    </tr>`
    )
    .join("");
}

function renderLearners(learners) {
  const tbody = $("learnerRows");
  tbody.innerHTML = learners
    .map(
      (l) => `<tr>
      <td>${escapeHtml(l.name)}</td>
      <td>${escapeHtml(l.org)}</td>
      <td>${escapeHtml(l.phoneMasked)}</td>
      <td>${escapeHtml(l.idCardMasked)}</td>
      <td><code>${escapeHtml(l.phoneCipherPreview)}</code></td>
      <td>${escapeHtml(l.syncStatus)}</td>
      <td><button type="button" class="btn tiny" data-reveal="${l.id}">解密审计</button></td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-reveal]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-reveal");
      const res = await api(`/api/learners/${id}/reveal`, { method: "POST", body: "{}" });
      const box = $("revealBox");
      box.hidden = false;
      box.textContent = JSON.stringify(res.data, null, 2);
    });
  });
}

function renderConsistency(data) {
  const ul = $("consistencyLog");
  ul.innerHTML = (data.log || [])
    .map((row) => {
      const kind = row.kind || "info";
      return `<li><span class="kind ${kind}">${escapeHtml(kind)}</span>${escapeHtml(row.note || "")}<div style="color:var(--muted);font-size:0.72rem;margin-top:0.2rem">${fmtTime(row.at)}</div></li>`;
    })
    .join("") || "<li>暂无日志</li>";
  $("outboxBox").textContent = JSON.stringify(data.outbox || [], null, 2);
}

function renderComponents(data) {
  const cls = data.classification;
  $("aiTag").textContent = `软件分类：${cls.softwareCategory} · ${cls.rationale}`;
  const grid = $("compGrid");
  grid.innerHTML = (data.components || [])
    .map((c) => {
      const degraded = c.status !== "healthy";
      return `<article class="comp">
        <h4>${escapeHtml(c.name)}</h4>
        <div class="role">${escapeHtml(c.role)}${c.category ? " · " + escapeHtml(c.category) : ""}</div>
        <div class="status ${degraded ? "degraded" : ""}">${escapeHtml(c.status)} · ${fmtTime(c.lastHeartbeat)}</div>
        <button type="button" class="btn tiny" data-toggle="${c.id}">切换健康状态</button>
      </article>`;
    })
    .join("");

  grid.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-toggle");
      await api(`/api/components/${id}/toggle`, { method: "POST", body: "{}" });
      const fresh = await api("/api/components");
      renderComponents(fresh.data);
      const ipc = await api("/api/ipc");
      renderIpc(ipc.data);
    });
  });
}

function renderIpc(data) {
  const ul = $("ipcLog");
  ul.innerHTML = (data.recent || [])
    .slice(0, 18)
    .map(
      (m) =>
        `<li>${escapeHtml(m.id)} · ${escapeHtml(m.topic)} · ${escapeHtml(m.status)} · attempts=${m.attempts}</li>`
    )
    .join("") || "<li>暂无消息</li>";
}

async function refreshSidePanels() {
  const [learnersRes, sessionsRes, consRes, ipcRes, componentsRes] = await Promise.all([
    api("/api/learners"),
    api("/api/sessions"),
    api("/api/consistency"),
    api("/api/ipc"),
    api("/api/components"),
  ]);
  state.learners = learnersRes.data.learners;
  renderLearners(state.learners);
  renderSessions(sessionsRes.data.sessions);
  renderConsistency(consRes.data);
  renderIpc(ipcRes.data);
  renderComponents(componentsRes.data);
}

function setSessionControls(enabled) {
  $("advanceBtn").disabled = !enabled;
  $("coachBtn").disabled = !enabled;
}

$("secureChannel").addEventListener("change", (e) => {
  state.secureChannel = e.target.checked;
  api("/api/health").catch(() => {});
});

$("startBtn").addEventListener("click", async () => {
  try {
    const res = await api("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        scenarioId: $("scenarioSelect").value,
        learnerId: $("learnerSelect").value,
      }),
    });
    state.session = res.data.session;
    renderSessionMeta(state.session);
    renderFlow(state.session);
    setSessionControls(true);
    $("coachBox").hidden = true;
    await refreshSidePanels();
  } catch (err) {
    alert(err.message);
  }
});

$("advanceBtn").addEventListener("click", async () => {
  if (!state.session) return;
  try {
    const res = await api(`/api/sessions/${state.session.id}/advance`, {
      method: "POST",
      body: "{}",
    });
    state.session = res.data.session;
    renderSessionMeta(state.session);
    renderFlow(state.session);
    if (state.session.status === "completed") {
      setSessionControls(false);
      // 等待最终一致同步
      setTimeout(refreshSidePanels, 400);
      setTimeout(refreshSidePanels, 900);
    } else {
      await refreshSidePanels();
    }
  } catch (err) {
    alert(err.message);
  }
});

$("coachBtn").addEventListener("click", async () => {
  if (!state.session) return;
  const step = state.session.steps.find((s) => s.status === "active") || state.session.steps.at(-1);
  const res = await api("/api/ai/coach", {
    method: "POST",
    body: JSON.stringify({ stepKey: step?.key }),
  });
  const box = $("coachBox");
  box.hidden = false;
  box.textContent = JSON.stringify(res.data, null, 2);
});

/* 轻量 3D/VR 示意：旋转线框空间 + 实训路径点 */
function initVrCanvas() {
  const canvas = $("vrCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const w = canvas.clientWidth || 960;
    const h = Math.round(w * 0.375);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  let t = 0;
  const nodes = [
    [-1.2, 0.2, 0],
    [-0.4, 0.6, 0.4],
    [0.3, 0.1, -0.2],
    [0.9, 0.5, 0.3],
    [1.4, 0.0, 0],
  ];

  function project(x, y, z, rot) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const xr = x * c - z * s;
    const zr = x * s + z * c;
    const scale = 140 / (2.6 + zr);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    return [w * 0.5 + xr * scale, h * 0.62 - y * scale, scale];
  }

  function frame() {
    t += 0.008;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    // floor grid
    ctx.strokeStyle = "rgba(30,200,165,0.18)";
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      const a = project(i * 0.45, 0, -1.5, t);
      const b = project(i * 0.45, 0, 1.5, t);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      const c = project(-1.8, 0, i * 0.4, t);
      const d = project(1.8, 0, i * 0.4, t);
      ctx.beginPath();
      ctx.moveTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.stroke();
    }

    // headset box
    const corners = [
      [-0.35, 0.9, -0.25],
      [0.35, 0.9, -0.25],
      [0.35, 1.35, -0.25],
      [-0.35, 1.35, -0.25],
      [-0.35, 0.9, 0.25],
      [0.35, 0.9, 0.25],
      [0.35, 1.35, 0.25],
      [-0.35, 1.35, 0.25],
    ].map((p) => project(p[0], p[1], p[2], t * 0.7));
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    ctx.strokeStyle = "rgba(240,180,41,0.85)";
    ctx.lineWidth = 1.5;
    for (const [i, j] of edges) {
      ctx.beginPath();
      ctx.moveTo(corners[i][0], corners[i][1]);
      ctx.lineTo(corners[j][0], corners[j][1]);
      ctx.stroke();
    }

    // path
    const pts = nodes.map((n) => project(n[0], n[1], n[2], t));
    ctx.strokeStyle = "rgba(30,200,165,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
    pts.forEach((p, i) => {
      ctx.fillStyle = i === Math.floor((t * 3) % pts.length) ? "#f0b429" : "#1ec8a5";
      ctx.beginPath();
      ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

loadBootstrap()
  .then(() => {
    initVrCanvas();
    setInterval(() => {
      api("/api/ipc").then((r) => renderIpc(r.data)).catch(() => {});
      api("/api/components").then((r) => renderComponents(r.data)).catch(() => {});
    }, 10000);
  })
  .catch((err) => {
    console.error(err);
    $("sessionMeta").textContent = `启动失败：${err.message}`;
  });
