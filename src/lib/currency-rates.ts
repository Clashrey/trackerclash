import type { Currency, ExchangeRate } from '@/types/budget'
import { budgetDatabaseService } from './budget-database'

const API_URL = 'https://open.er-api.com/v6/latest/USD'
const CACHE_KEY = 'exchange_rates_cache'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

const SUPPORTED_CURRENCIES: Currency[] = ['THB', 'RUB', 'USD', 'EUR']

interface CachedRates {
  rates: Record<string, number>
  fetchedAt: number
}

function getCachedRates(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedRates = JSON.parse(raw)
    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached
    return null
  } catch {
    return null
  }
}

function setCachedRates(rates: Record<string, number>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }))
  } catch {
    // localStorage may be full
  }
}

/**
 * Fetch exchange rates from API, cache locally, and persist to DB.
 * Returns a map of all currency pairs we need.
 */
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  // Check localStorage cache first
  const cached = getCachedRates()
  const usdRates = cached?.rates ?? await fetchFromApi()

  if (!usdRates) return []

  if (!cached) {
    setCachedRates(usdRates)
  }

  // Build all pairs between supported currencies
  const pairs: ExchangeRate[] = []
  for (const from of SUPPORTED_CURRENCIES) {
    for (const to of SUPPORTED_CURRENCIES) {
      if (from === to) continue
      const fromRate = usdRates[from]
      const toRate = usdRates[to]
      if (!fromRate || !toRate) continue
      const rate = toRate / fromRate
      pairs.push({
        id: `${from}_${to}`,
        from_currency: from,
        to_currency: to,
        rate,
        fetched_at: new Date().toISOString(),
      })
    }
  }

  // Persist to DB (fire and forget)
  persistRatesToDb(pairs)

  return pairs
}

async function fetchFromApi(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) return null
    const data = await res.json()
    return data.rates ?? null
  } catch {
    return null
  }
}

async function persistRatesToDb(pairs: ExchangeRate[]): Promise<void> {
  try {
    for (const pair of pairs) {
      await budgetDatabaseService.updateExchangeRate(pair.from_currency, pair.to_currency, pair.rate)
    }
  } catch {
    // silent — DB persistence is best-effort
  }
}

/**
 * Convert an amount from one currency to another using provided rates.
 */
export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRate[]
): number {
  if (from === to) return amount
  const pair = rates.find(r => r.from_currency === from && r.to_currency === to)
  if (!pair) return amount // fallback: return unconverted
  return amount * pair.rate
}

/**
 * Sum an array of transactions converting all to the target currency.
 */
export function sumInCurrency(
  items: { amount: number | string; currency: Currency }[],
  targetCurrency: Currency,
  rates: ExchangeRate[]
): number {
  return items.reduce((sum, item) => {
    const converted = convertAmount(Number(item.amount), item.currency, targetCurrency, rates)
    return sum + converted
  }, 0)
}
