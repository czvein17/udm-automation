import { ZodError } from "zod";

export type ZodFieldError = { field: string; message: string };

export function formatZodError(err: ZodError): ZodFieldError[] {
  const issues = (err as any).issues ?? (err as any).errors ?? [];
  return issues.map((e: any) => {
    const path = e.path && e.path.length ? e.path.join(".") : "body";
    return { field: path, message: e.message };
  });
}

export function formatZodErrorMessage(err: ZodError): string {
  return formatZodError(err)
    .map((d) => `${d.field}: ${d.message}`)
    .join("; ");
}
