"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "登录失败");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1a6b78,#0b3d4a_55%,#07262e)] px-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--usp-sand)] p-6 shadow-xl">
        <div className="font-display text-2xl text-[#0b3d4a]">统一支撑平台</div>
        <p className="mt-1 text-sm text-slate-600">管理后台登录 · V1.0</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-700">用户名</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </Button>
        </form>
        <div className="mt-4 space-y-1 text-xs text-slate-500">
          <p>默认管理员：admin / admin123</p>
          <p>教师：teacher / teacher123 · 学生：student01 / student123</p>
          <Link href="/" className="inline-block text-teal-800 hover:underline">
            返回门户
          </Link>
        </div>
      </div>
    </div>
  );
}
