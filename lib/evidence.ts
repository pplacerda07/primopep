// Evidências reais da operação, exibidas na seção de confiança.
//
// IMPORTANTE: este array só recebe itens VERDADEIROS:
// - rastreios reais com dados pessoais ocultados (nome, endereço, CPF, telefone);
// - fotos reais de pedidos recebidos;
// - documentos autênticos;
// - histórico operacional real.
// Nunca inventar prova social, prints fictícios, avaliações ou números.
// Enquanto estiver vazio, o site mostra um estado vazio honesto.
//
// Exemplo de item (imagem em /public/evidencias/):
// {
//   id: 'rastreio-2026-10',
//   kind: 'rastreio',
//   title: 'Pedido entregue em São Paulo',
//   description: 'Rastreio com dados pessoais ocultados.',
//   image: '/evidencias/rastreio-2026-10.webp',
//   date: '2026-10-20',
// }

export type Evidence = {
  id: string
  kind: 'rastreio' | 'foto' | 'documento' | 'historico'
  title: string
  description?: string
  image?: string
  date?: string // formato ISO: AAAA-MM-DD
}

export const EVIDENCE: Evidence[] = []
