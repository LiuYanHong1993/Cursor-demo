"use client";

import { useState } from "react";
import { Alert, Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { userFormSchema } from "@/lib/validation";

export function FormValidationPanel() {
  const [form, setForm] = useState({
    username: "ab",
    displayName: "A",
    email: "bad",
    password: "123",
    status: "active",
  });
  const [clientIssues, setClientIssues] = useState<{ path: string; message: string }[]>([]);
  const [serverIssues, setServerIssues] = useState<{ path: string; message: string }[]>([]);
  const [ok, setOk] = useState("");

  function validateClient() {
    const parsed = userFormSchema.safeParse(form);
    if (!parsed.success) {
      setClientIssues(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
      return false;
    }
    setClientIssues([]);
    return true;
  }

  async function validateServer() {
    setOk("");
    const res = await fetch("/api/validate/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerIssues(data.issues || [{ path: "", message: data.error || "失败" }]);
      return;
    }
    setServerIssues([]);
    setOk("服务端校验通过（与前端同一套 Zod schema）。");
  }

  return (
    <div>
      <PageHeader
        title="表单前后端校验"
        desc="前后端共用 src/lib/validation.ts 中的 Zod 规则，避免双写不一致。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <Input
            placeholder="用户名"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            placeholder="显示名"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <Input
            placeholder="邮箱"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="密码"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">active</option>
            <option value="disabled">disabled</option>
          </Select>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                validateClient();
              }}
            >
              仅前端校验
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!validateClient()) return;
                await validateServer();
              }}
            >
              提交到后端
            </Button>
          </div>
        </Card>
        <div className="space-y-3">
          <Card>
            <h3 className="font-medium">前端结果</h3>
            {clientIssues.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                {clientIssues.map((i, idx) => (
                  <li key={idx}>
                    {i.path}: {i.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">暂无错误</p>
            )}
          </Card>
          <Card>
            <h3 className="font-medium">后端结果</h3>
            {serverIssues.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                {serverIssues.map((i, idx) => (
                  <li key={idx}>
                    {i.path}: {i.message}
                  </li>
                ))}
              </ul>
            ) : ok ? (
              <div className="mt-2">
                <Alert tone="success">{ok}</Alert>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">暂无结果</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
