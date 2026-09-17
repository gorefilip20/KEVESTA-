export type PaymentMetric = "crypto_quote_expired" | "crypto_quote_provider_error" | "column_webhook_invalid" | "column_webhook_duplicate" | "column_webhook_received";
type MetricEvent = { metric: PaymentMetric; at: string; details?: Record<string, string> };
type MetricState = { events: MetricEvent[] };

type GlobalWithMetrics = typeof globalThis & { __kevestaPaymentMetrics?: MetricState };
const globalMetrics = globalThis as GlobalWithMetrics;
const state = globalMetrics.__kevestaPaymentMetrics || { events: [] };
globalMetrics.__kevestaPaymentMetrics = state;

export function recordPaymentMetric(metric: PaymentMetric, details?: Record<string, string>) {
  state.events.push({ metric, at: new Date().toISOString(), details });
  if (state.events.length > 1000) state.events.splice(0, state.events.length - 1000);
  console.warn(JSON.stringify({ service: "kevesta-payments", metric, at: new Date().toISOString(), details }));
}

export function getPaymentMetrics(windowMinutes = 15) {
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  const recent = state.events.filter((event) => Date.parse(event.at) >= cutoff);
  const counts = recent.reduce<Partial<Record<PaymentMetric, number>>>((result, event) => {
    result[event.metric] = (result[event.metric] || 0) + 1;
    return result;
  }, {});
  const degraded = (counts.crypto_quote_provider_error || 0) >= 5 || (counts.column_webhook_duplicate || 0) >= 25 || (counts.column_webhook_invalid || 0) >= 5;
  return { status: degraded ? "degraded" : "ok", windowMinutes, counts, recent: recent.slice(-50) };
}
