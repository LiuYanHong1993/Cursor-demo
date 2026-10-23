import { NextRequest, NextResponse } from "next/server";
import { formatZodError, userFormSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = userFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, issues: formatZodError(parsed.error) }, { status: 400 });
  }
  return NextResponse.json({ ok: true, data: parsed.data });
}
