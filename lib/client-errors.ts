/**
 * Последние ошибки браузера.
 *
 * Держим в памяти процесса, а не в базе: схему ради отладки менять не
 * хочется, а если сервер перезапустится и список обнулится — это само по
 * себе ответ, значит падает сервер, а не страница.
 */
export interface ClientError {
  at: string;
  message: string;
  url: string;
  kind: "error" | "rejection" | "chunk";
  stack?: string;
  ua?: string;
}

const MAX = 50;
const store: ClientError[] = [];

export function addClientError(e: ClientError) {
  store.unshift(e);
  if (store.length > MAX) store.length = MAX;
}

export function listClientErrors(): ClientError[] {
  return store;
}
