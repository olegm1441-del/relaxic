import { METRIKA_ID } from "@/lib/company";

/**
 * Чтение статистики из Яндекс Метрики.
 *
 * Счётчик на сайте только пишет данные, читать их можно лишь через API,
 * и для этого нужен отдельный OAuth-токен. Без токена сводка не ломается:
 * блок визитов показывает, чего не хватает, а всё остальное берётся
 * из нашей базы и работает всегда.
 */
export interface MetrikaGoal {
  id: number;
  name: string;
  /** Технический идентификатор цели-события: по нему и сопоставляем */
  key: string | null;
  reaches: number;
}
export interface MetrikaStats {
  visits: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  goals: MetrikaGoal[];
  since: string;
}

const API = "https://api-metrika.yandex.net";
/** Счётчик заведён в сентябре 2026 — раньше этой даты данных быть не может */
const SINCE = "2026-09-01";

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(API + path, {
    headers: { Authorization: `OAuth ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Метрика ответила ${res.status}`);
  return res.json() as Promise<T>;
}

export async function metrikaStats(): Promise<{ data: MetrikaStats | null; error: string | null }> {
  const token = process.env.YANDEX_METRIKA_TOKEN;
  if (!token) return { data: null, error: null };

  try {
    const goalList = await get<{
      goals?: { id: number; name: string; conditions?: { url?: string }[] }[];
    }>(`/management/v1/counter/${METRIKA_ID}/goals`, token);
    const goals = goalList.goals ?? [];

    // Метрики целей просим одним запросом: у API есть лимит на их число,
    // поэтому берём первые двадцать — больше целей у магазина и не бывает.
    const goalMetrics = goals.slice(0, 20).map((g) => `ym:s:goal${g.id}reaches`);
    const metrics = ["ym:s:visits", "ym:s:users", "ym:s:pageviews", "ym:s:bounceRate", ...goalMetrics];

    const stat = await get<{ totals: number[][] }>(
      `/stat/v1/data?ids=${METRIKA_ID}&metrics=${metrics.join(",")}` +
      `&date1=${SINCE}&date2=today&accuracy=full`, token,
    );
    const t = stat.totals?.[0] ?? [];

    return {
      data: {
        visits: t[0] ?? 0,
        users: t[1] ?? 0,
        pageviews: t[2] ?? 0,
        bounceRate: t[3] ?? 0,
        since: SINCE,
        goals: goals.slice(0, 20).map((g, i) => ({
          id: g.id,
          name: g.name,
          // Название цель может носить любое — человек пишет его руками.
          // Сопоставлять по нему нельзя: переименуют, и воронка опустеет.
          key: g.conditions?.[0]?.url ?? null,
          reaches: t[4 + i] ?? 0,
        })),
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "не удалось прочитать Метрику" };
  }
}
