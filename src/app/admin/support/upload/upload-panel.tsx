"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, PageHeader, Table } from "@/components/ui";

export function UploadPanel({
  files,
}: {
  files: {
    id: number;
    original_name: string;
    stored_name: string;
    size: number;
    mime_type: string;
    uploaded_by: string;
    created_at: string;
  }[];
}) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  async function upload(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setMsg(res.ok ? `已保存到本地磁盘：${data.stored}` : data.error || "上传失败");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="本地文件上传"
        desc="文件写入 DATA_DIR/uploads，元数据入库。支持设备存储与传输能力。"
        actions={
          <Button type="button" onClick={() => ref.current?.click()}>
            选择文件
          </Button>
        }
      />
      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      {msg ? <p className="mb-3 text-sm text-teal-800">{msg}</p> : null}
      <Table headers={["原文件名", "存储名", "大小", "类型", "上传者", "时间"]}>
        {files.map((f) => (
          <tr key={f.id}>
            <td className="px-3 py-2">{f.original_name}</td>
            <td className="px-3 py-2 font-mono text-xs">{f.stored_name}</td>
            <td className="px-3 py-2">{(f.size / 1024).toFixed(1)} KB</td>
            <td className="px-3 py-2 text-xs">{f.mime_type}</td>
            <td className="px-3 py-2">{f.uploaded_by}</td>
            <td className="px-3 py-2 text-xs">{f.created_at}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
