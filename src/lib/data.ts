// Campos do tipo "date" do Postgres (ex: "2026-10-17") não têm horário, então formatamos
// manualmente para não sofrer deslocamento de fuso horário ao converter para Date.
export function formatarDataSimples(data: string | null): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarDataHora(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export function dataHojeISO(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor)
}

export function diasDesde(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
