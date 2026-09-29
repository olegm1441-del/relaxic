import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Container } from "@/components/ui";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { adminSignIn, adminSignOut } from "@/lib/actions/admin";
import { ADMIN_COOKIE } from "@/lib/admin";
import { metrikaStats } from "@/lib/metrika";
import { prisma } from "@/lib/db";
import { price } from "@/lib/format";
import { GOALS } from "@/lib/track";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Сводка",
  robots: { index: false, follow: false },
};

const DAY = 86_400_000;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

/* ── Плитка с числом ─────────────────────────────────────────
   Одно число без графика: форма выбрана по задаче — здесь нечего
   сравнивать во времени, нужен сам показатель. */
function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card p-5">
      <p className="text-[0.8125rem] leading-snug text-[var(--text-muted)]">{label}</p>
      <p className="tnum mt-2 text-[1.75rem] font-bold leading-none">{value}</p>
      {note && <p className="mt-2 text-[0.8125rem] leading-snug text-[var(--text-muted)]">{note}</p>}
    </div>
  );
}

/* ── Воронка ─────────────────────────────────────────────────
   Одна серия одного цвета с прямыми подписями. Раскрашивать шаги
   в разные цвета нельзя: на тёмном фоне фирменные цвета как набор
   категорий не проходят проверку на различимость при дальтонизме,
   а цвет здесь всё равно ничего не кодирует — длину задаёт число. */
function Funnel({ steps, source }: { steps: { name: string; value: number }[]; source: string }) {
  const top = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div>
      <p className="mb-4 text-[0.8125rem] text-[var(--text-muted)]">Источник: {source}</p>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const prev = i === 0 ? null : steps[i - 1].value;
          return (
            <div key={s.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-[0.9375rem]">{s.name}</span>
                <span className="text-[0.8125rem] text-[var(--text-muted)]">
                  <span className="tnum font-semibold text-[var(--text)]">{s.value}</span>
                  {prev !== null && <> · {pct(s.value, prev)}% от прошлого шага</>}
                </span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-[4px] bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-[4px] bg-[var(--accent)]"
                  style={{ width: `${Math.max((s.value / top) * 100, s.value > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Login({ failed }: { failed: boolean }) {
  return (
    <Container className="py-20">
      <form action={adminSignIn} className="mx-auto max-w-sm">
        <h1 className="h2">Сводка</h1>
        <p className="mt-3 text-[0.9375rem] text-[var(--text-muted)]">
          Нужен административный токен — тот же, что у служебных маршрутов.
        </p>
        <input
          type="password"
          name="token"
          autoComplete="current-password"
          className="field mt-5 w-full"
          placeholder="Токен"
          required
        />
        {failed && (
          <p className="mt-2 text-[0.8125rem] text-[var(--color-danger)]">Токен не подошёл</p>
        )}
        <button type="submit" className="btn btn-primary mt-4 w-full">Войти</button>
      </form>
    </Container>
  );
}

export default async function AdminPage({
  searchParams,
}: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams;
  const expected = process.env.ADMIN_TOKEN;
  const given = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!expected || given !== expected) return <Login failed={sp.e === "1"} />;

  const now = Date.now();
  const d7 = new Date(now - 7 * DAY);

  const orders = prisma
    ? await prisma.order
        .findMany({
          select: { id: true, number: true, total: true, status: true, createdAt: true,
                    customerName: true, notifyError: true, _count: { select: { items: true } } },
          orderBy: { createdAt: "desc" },
        })
        .catch(() => [])
    : [];

  const [quizAll, customAll, consentAll] = prisma
    ? await Promise.all([
        prisma.quizResult.count().catch(() => 0),
        prisma.customRequest.count().catch(() => 0),
        prisma.consent.count({ where: { analytics: true } }).catch(() => 0),
      ])
    : [0, 0, 0];

  const fresh = orders.filter((o) => o.createdAt >= d7);
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const multi = orders.filter((o) => o._count.items > 1).length;
  const failed = orders.filter((o) => o.notifyError).length;

  const { data: ym, error: ymError } = await metrikaStats();
  const goal = (key: string) => ym?.goals.find((g) => g.key === key)?.reaches ?? 0;

  const steps = ym
    ? [
        { name: "Визиты", value: ym.visits },
        { name: "Положили в корзину", value: goal(GOALS.ADD_TO_CART) },
        { name: "Перешли к оформлению", value: goal(GOALS.CHECKOUT_OPEN) },
        { name: "Оформили заказ", value: orders.length },
      ]
    : [
        { name: "Согласились на аналитику", value: consentAll },
        { name: "Прошли подбор", value: quizAll },
        { name: "Оформили заказ", value: orders.length },
      ];

  return (
    <Container className="py-10 lg:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="h2">Сводка</h1>
          <p className="mt-2 text-[0.9375rem] text-[var(--text-muted)]">
            Конверсия в целевые действия. Данные живые, за всё время наблюдений.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AutoRefresh />
          <form action={adminSignOut}>
            <button type="submit" className="btn btn-secondary btn-sm">Выйти</button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <Tile label="Заказов всего" value={String(orders.length)} note={`${fresh.length} за 7 дней`} />
        <Tile label="Выручка" value={price(revenue)} note={orders.length ? `средний чек ${price(Math.round(revenue / orders.length))}` : undefined} />
        <Tile
          label="Заказы с двумя и более наборами"
          value={`${pct(multi, orders.length)}%`}
          note="цель — от 35%: без этого доставка не окупается"
        />
        <Tile label="Подборов пройдено" value={String(quizAll)} note={`заявок на свою картину: ${customAll}`} />
      </div>

      <section className="mt-12">
        <h2 className="h3">Воронка</h2>
        <div className="card mt-4 p-5 lg:p-6">
          <Funnel
            steps={steps}
            source={ym ? "Яндекс Метрика и заказы из базы" : "наша база: согласия, подборы, заказы"}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="h3">Визиты и цели</h2>
        {ym ? (
          <>
            <div className="mt-4 grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
              <Tile label="Визиты" value={String(ym.visits)} note={`с ${ym.since}`} />
              <Tile label="Посетители" value={String(ym.users)} />
              <Tile label="Просмотры" value={String(ym.pageviews)} />
              <Tile label="Отказы" value={`${Math.round(ym.bounceRate)}%`} />
            </div>
            <div className="card mt-4 overflow-x-auto">
              <table className="w-full text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[0.8125rem] text-[var(--text-muted)]">
                    <th className="p-4 font-medium">Цель</th>
                    <th className="p-4 font-medium">Достижений</th>
                    <th className="p-4 font-medium">Конверсия от визитов</th>
                  </tr>
                </thead>
                <tbody>
                  {ym.goals.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-[var(--text-muted)]">
                      В счётчике не заведено ни одной цели.
                    </td></tr>
                  )}
                  {ym.goals.map((g) => (
                    <tr key={g.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="p-4">
                        {g.name}
                        {g.key && (
                          <span className="ml-2 text-[0.75rem] text-[var(--text-muted)]">{g.key}</span>
                        )}
                      </td>
                      <td className="tnum p-4">{g.reaches}</td>
                      <td className="tnum p-4">{pct(g.reaches, ym.visits)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="card mt-4 p-5">
            <p className="text-[0.9375rem]">
              {ymError
                ? `Метрика не ответила: ${ymError}`
                : "Визиты лежат в Яндекс Метрике, и читать их можно только по токену."}
            </p>
            <p className="measure mt-3 text-[0.9375rem] text-[var(--text-muted)]">
              Токен берётся на oauth.yandex.ru: создать приложение, дать ему право
              «Яндекс Метрика — получение статистики», скопировать токен и положить
              его в переменную <code>YANDEX_METRIKA_TOKEN</code> на Railway.
              Пересборка не нужна — переменная читается на сервере при каждом запросе.
            </p>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="h3">Последние заказы</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[0.8125rem] text-[var(--text-muted)]">
                <th className="p-4 font-medium">Номер</th>
                <th className="p-4 font-medium">Покупатель</th>
                <th className="p-4 font-medium">Наборов</th>
                <th className="p-4 font-medium">Сумма</th>
                <th className="p-4 font-medium">Статус</th>
                <th className="p-4 font-medium">Уведомление</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-[var(--text-muted)]">Заказов пока нет.</td></tr>
              )}
              {orders.slice(0, 15).map((o) => (
                <tr key={o.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="tnum p-4">{o.number}</td>
                  <td className="p-4">{o.customerName}</td>
                  <td className="tnum p-4">{o._count.items}</td>
                  <td className="tnum p-4">{price(o.total)}</td>
                  <td className="p-4 text-[var(--text-muted)]">{o.status}</td>
                  <td className="p-4 text-[0.8125rem] text-[var(--text-muted)]">
                    {o.notifyError ? `ошибка: ${o.notifyError.slice(0, 40)}` : "ушло"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {failed > 0 && (
          <p className="mt-3 text-[0.8125rem] text-[var(--color-danger)]">
            Уведомление не ушло по {failed} заказам — проверьте бота в чате.
          </p>
        )}
      </section>
    </Container>
  );
}
