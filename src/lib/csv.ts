export function parseCSV(texto: string): string[][] {
  const linhas: string[][] = []
  let linha: string[] = []
  let campo = ''
  let dentroDeAspas = false
  let i = 0

  while (i < texto.length) {
    const c = texto[i]

    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i += 2
          continue
        }
        dentroDeAspas = false
        i++
        continue
      }
      campo += c
      i++
      continue
    }

    if (c === '"') {
      dentroDeAspas = true
      i++
      continue
    }
    if (c === ',') {
      linha.push(campo)
      campo = ''
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      linha.push(campo)
      linhas.push(linha)
      linha = []
      campo = ''
      i++
      continue
    }
    campo += c
    i++
  }

  if (campo.length > 0 || linha.length > 0) {
    linha.push(campo)
    linhas.push(linha)
  }

  return linhas.filter((l) => l.some((c) => c.trim() !== ''))
}

function precisaAspas(valor: string): boolean {
  return /[",\n]/.test(valor)
}

export function paraCSV(linhas: (string | number)[][]): string {
  return linhas
    .map((linha) =>
      linha
        .map((v) => {
          const valor = v == null ? '' : String(v)
          return precisaAspas(valor) ? `"${valor.replace(/"/g, '""')}"` : valor
        })
        .join(','),
    )
    .join('\r\n')
}
