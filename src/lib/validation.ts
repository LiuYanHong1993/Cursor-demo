import { z } from "zod";

/** Shared front/back validation rules for platform forms */
export const userFormSchema = z.object({
  username: z
    .string()
    .min(3, "用户名至少 3 位")
    .max(32, "用户名最多 32 位")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "以字母开头，仅含字母数字下划线"),
  displayName: z.string().min(2, "显示名至少 2 个字符").max(40, "显示名最多 40 字"),
  email: z.string().email("邮箱格式不正确"),
  password: z
    .string()
    .min(6, "密码至少 6 位")
    .max(64, "密码最多 64 位")
    .optional()
    .or(z.literal("")),
  orgId: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["active", "disabled"]).default("active"),
});

export const sampleItemSchema = z.object({
  title: z.string().min(2, "标题至少 2 字").max(80, "标题最多 80 字"),
  content: z.string().max(2000, "内容最多 2000 字").default(""),
  status: z.enum(["draft", "review", "published", "archived"]).default("draft"),
});

export const orgFormSchema = z.object({
  name: z.string().min(2, "名称至少 2 字").max(60, "名称最多 60 字"),
  code: z
    .string()
    .min(2, "编码至少 2 位")
    .max(32, "编码最多 32 位")
    .regex(/^[A-Z0-9_-]+$/i, "编码仅含字母数字_-"),
  type: z.enum(["school", "college", "dept", "major", "class"]),
  parentId: z.coerce.number().int().positive().nullable().optional(),
});

export type UserFormInput = z.infer<typeof userFormSchema>;
export type SampleItemInput = z.infer<typeof sampleItemSchema>;

export function formatZodError(error: z.ZodError) {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}
