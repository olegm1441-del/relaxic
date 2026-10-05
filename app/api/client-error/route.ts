import { addClientError, type ClientError } from "@/lib/client-errors";

export const dynamic = "force-dynamic";

/**
 * Приём ошибок из браузера.
 *
 * Ошибку, которая ломает переход по ссылке, в серверных логах не видно:
 * она случается на стороне человека. Без этого канала остаётся только
 * гадать, а гадать мы уже пробовали.
 */
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Partial<ClientError>;
    addClientError({
      at: new Date().toISOString(),
      kind: b.kind === "rejection" || b.kind === "chunk" ? b.kind : "error",
      message: String(b.message ?? "").slice(0, 500),
      url: String(b.url ?? "").slice(0, 300),
      stack: b.stack ? String(b.stack).slice(0, 1200) : undefined,
      ua: req.headers.get("user-agent")?.slice(0, 200) ?? undefined,
    });
  } catch { /* кривой запрос — не наша забота */ }
  // Отвечаем пустотой и всегда успехом: отчёт об ошибке не должен
  // порождать вторую ошибку.
  return new Response(null, { status: 204 });
}
