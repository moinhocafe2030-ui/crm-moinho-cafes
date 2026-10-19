import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEtapas } from '../lib/clientes'
import { criarEtapa, atualizarEtapa, reordenarEtapas, excluirEtapa } from '../lib/etapas'
import type { EtapaFunil } from '../types/cliente'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

export function EtapasFunil() {
  const [etapas, setEtapas] = useState<EtapaFunil[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [novaEtapa, setNovaEtapa] = useState('')

  async function carregar() {
    setCarregando(true)
    try {
      setEtapas(await listarEtapas())
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvarCampo(id: string, dados: Partial<EtapaFunil>) {
    setEtapas((es) => es.map((e) => (e.id === id ? { ...e, ...dados } : e)))
    try {
      await atualizarEtapa(id, dados)
    } catch (e) {
      setErro((e as Error).message)
      carregar()
    }
  }

  async function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= etapas.length) return
    const copia = [...etapas]
    ;[copia[index], copia[alvo]] = [copia[alvo], copia[index]]
    const comNovaOrdem = copia.map((e, i) => ({ ...e, ordem: i + 1 }))
    setEtapas(comNovaOrdem)
    try {
      await reordenarEtapas(comNovaOrdem.map((e) => ({ id: e.id, ordem: e.ordem })))
    } catch (e) {
      setErro((e as Error).message)
      carregar()
    }
  }

  async function adicionar() {
    const nome = novaEtapa.trim()
    if (!nome) return
    try {
      const etapa = await criarEtapa(nome, etapas.length + 1)
      setEtapas((es) => [...es, etapa])
      setNovaEtapa('')
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta etapa? Só funciona se não houver clientes nela.')) return
    try {
      await excluirEtapa(id)
      setEtapas((es) => es.filter((e) => e.id !== id))
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-marrom">Etapas do funil</h1>
        <Link to="/funil" className="text-sm text-gray-500 hover:text-marrom">
          Voltar ao funil
        </Link>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <div className="flex flex-col gap-2">
        {etapas.map((etapa, index) => (
          <div key={etapa.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => mover(index, -1)}
                  className="text-gray-400 hover:text-marrom disabled:opacity-30"
                  aria-label="Mover para cima"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === etapas.length - 1}
                  onClick={() => mover(index, 1)}
                  className="text-gray-400 hover:text-marrom disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  ▼
                </button>
              </div>

              <input
                type="color"
                value={etapa.cor}
                onChange={(e) => salvarCampo(etapa.id, { cor: e.target.value })}
                className="h-8 w-8 shrink-0 cursor-pointer rounded border border-gray-200"
              />

              <input
                className={campoClasse}
                defaultValue={etapa.nome}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== etapa.nome) {
                    salvarCampo(etapa.id, { nome: e.target.value.trim() })
                  }
                }}
              />

              <button
                type="button"
                onClick={() => excluir(etapa.id)}
                className="shrink-0 text-sm text-gray-400 hover:text-red-600"
              >
                Excluir
              </button>
            </div>

            <div className="mt-2 flex gap-4 pl-9 text-sm text-gray-600">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={etapa.encerra_ganho}
                  onChange={(e) => salvarCampo(etapa.id, { encerra_ganho: e.target.checked })}
                />
                Marca cliente como ganho
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={etapa.encerra_perda}
                  onChange={(e) => salvarCampo(etapa.id, { encerra_perda: e.target.checked })}
                />
                Pede motivo da perda
              </label>
              <label className="flex items-center gap-1.5">
                Chance de fechar
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  value={etapa.probabilidade}
                  onChange={(e) =>
                    salvarCampo(etapa.id, {
                      probabilidade: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                />
                %
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2 rounded-xl bg-white p-3 shadow-sm">
        <div className="flex-1">
          <label className={labelClasse}>Nova etapa</label>
          <input
            className={campoClasse}
            value={novaEtapa}
            onChange={(e) => setNovaEtapa(e.target.value)}
            placeholder="Nome da nova etapa"
          />
        </div>
        <button type="button" onClick={adicionar} className={`${botaoPrimarioClasse} self-end`}>
          Adicionar
        </button>
      </div>

      <Link to="/funil" className={`${botaoSecundarioClasse} mt-4 inline-block`}>
        Voltar ao funil
      </Link>
    </div>
  )
}
