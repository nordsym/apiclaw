import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCallableSnapshot, renderLiveSkill } from "@/lib/callable-snapshot";

export const dynamic = "force-dynamic";
export async function GET() {
  const [snapshot, template] = await Promise.all([
    getCallableSnapshot(), readFile(path.join(process.cwd(), "public/SKILL.md"), "utf8"),
  ]);
  return new Response(renderLiveSkill(template, snapshot), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" },
  });
}
