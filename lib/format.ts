import { COMMERCIAL } from '@/lib/site'

// Espaço não separável entre o símbolo e o número, para não quebrar linha no meio do preço.
const NBSP = ' '

function formatAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100
  const isInteger = Number.isInteger(rounded)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  }).format(rounded)
}

// 70 → 'US$ 70' · 70.5 → 'US$ 70,50'
export function formatUSD(value: number): string {
  return `US$${NBSP}${formatAmount(value)}`
}

// 364 → 'R$ 364' · 1234.5 → 'R$ 1.234,50'
export function formatBRL(value: number): string {
  return `R$${NBSP}${formatAmount(value)}`
}

// Valor aproximado em reais, só como referência (US$ 1 = R$ 5,20).
export function brlReference(usd: number): string {
  return formatBRL(usd * COMMERCIAL.usdToBrlRef)
}
