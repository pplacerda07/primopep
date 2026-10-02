// Produtos do Primo Peptídeos (lista "Mais buscados"): dados separados da interface.
//
// COMO EDITAR (sem mexer em componentes):
// - Novo produto: copie um item de PRODUCTS, troque slug (único, minúsculo, com hífen),
//   name, family (um id de FAMILIES) e summary (classificação curta e neutra,
//   SEM promessa de efeito ou orientação de uso).
// - Preço: em presentations, troque priceUSD: null pelo valor em dólar (ex.: 70).
//   Enquanto for null, o site mostra "Preço sob consulta".
// - Apresentação: { id: '<slug>-<mg>mg', label: '10 mg', vials: VIALS, priceUSD: null }.
//   Lista vazia = o site mostra "Apresentação a confirmar".
// - Código do fornecedor: campo opcional code na apresentação. Não inventar.
// - Sem travessão em texto visível (summary, label etc.): intervalos como '1 a 29'.
// - Destaque na home: featured: true (manter poucos e em número par para a grade de 2
//   colunas no celular; hoje são 4).
// - Foto real (opcional): image: '/<pasta>/<arquivo>.webp' (em /public). Sem foto, o site
//   desenha o vial. Só fotos neutras do frasco: sem rostos, sem marca de terceiros e sem
//   selos ou números de pureza.
// - Status: 'sob-consulta' (padrão), 'disponivel' ou 'indisponivel'.
//   A disponibilidade é sempre confirmada no WhatsApp antes do pagamento.
// - Protocolo de uso em PDF: incluso em todo produto (COMMERCIAL.protocolIncluded).
//   Para uma exceção, use protocol: false no item. Leia sempre com hasProtocol(product).

import { COMMERCIAL } from '@/lib/site'

export type FamilyId =
  | 'incretinas'
  | 'eixo-gh'
  | 'reparo'
  | 'mitocondrial'
  | 'neuro'
  | 'pele'
  | 'imunidade'
  | 'blends'

export type FamilyTone = 'gold' | 'silver' | 'bronze'

export type Family = {
  id: FamilyId
  label: string
  description: string
  tone: FamilyTone
}

export type ProductStatus = 'sob-consulta' | 'disponivel' | 'indisponivel'

export type Presentation = {
  id: string
  label: string // ex.: '10 mg'
  vials: number // vials por caixa
  priceUSD: number | null // null = preço sob consulta
  code?: string // código do fornecedor, quando houver
}

export type Product = {
  slug: string
  name: string
  aliases?: string[]
  family: FamilyId
  summary: string // descrição neutra de exatamente 7 palavras, sem alegação terapêutica
  presentations: Presentation[] // vazio = apresentação a confirmar
  status: ProductStatus
  featured?: boolean
  image?: string // foto real opcional; sem ela o site desenha o vial
  protocol?: boolean // protocolo de uso em PDF; omitido = COMMERCIAL.protocolIncluded
}

const VIALS = COMMERCIAL.vialsPerBox

// Ordem desta lista = ordem das famílias no catálogo.
export const FAMILIES: Family[] = [
  {
    id: 'incretinas',
    label: 'Incretinas',
    description: 'Agonistas de GLP-1, GIP e glucagon.',
    tone: 'gold',
  },
  {
    id: 'eixo-gh',
    label: 'Eixo GH',
    description: 'Análogos de GHRH, IGF-1 e secretagogos.',
    tone: 'silver',
  },
  {
    id: 'reparo',
    label: 'BPC-157 e TB-500',
    description: 'Pentadecapeptídeo e derivado da timosina beta-4.',
    tone: 'bronze',
  },
  {
    id: 'mitocondrial',
    label: 'Mitocondriais',
    description: 'Peptídeos mitocondriais e a coenzima NAD+.',
    tone: 'gold',
  },
  {
    id: 'neuro',
    label: 'Neuropeptídeos',
    description: 'Sequências curtas análogas a peptídeos endógenos.',
    tone: 'silver',
  },
  {
    id: 'pele',
    label: 'Peptídeos de cobre',
    description: 'Tripeptídeo GHK complexado com cobre.',
    tone: 'bronze',
  },
  {
    id: 'imunidade',
    label: 'Timosinas',
    description: 'Forma sintética da timosina alfa-1.',
    tone: 'silver',
  },
  {
    id: 'blends',
    label: 'Blends',
    description: 'Dois ou mais peptídeos combinados.',
    tone: 'gold',
  },
]

export const PRODUCTS: Product[] = [
  // Incretinas
  {
    slug: 'retatrutida',
    name: 'Retatrutida',
    aliases: ['Retatrutide', 'Reta'],
    family: 'incretinas',
    summary: 'Agonista triplo de GIP, GLP-1 e glucagon',
    presentations: [{ id: 'retatrutida-15mg', label: '15 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
    featured: true,
  },
  {
    slug: 'semaglutida',
    name: 'Semaglutida',
    aliases: ['Semaglutide', 'Sema'],
    family: 'incretinas',
    summary: 'Agonista de GLP-1 estudado no controle glicêmico',
    presentations: [],
    status: 'sob-consulta',
  },
  {
    slug: 'survodutide',
    name: 'Survodutida',
    aliases: ['Survodutide'],
    family: 'incretinas',
    summary: 'Agonista duplo de glucagon e GLP-1, experimental',
    presentations: [],
    status: 'sob-consulta',
  },
  {
    slug: 'tirzepatida',
    name: 'Tirzepatida',
    aliases: ['Tirzepatide', 'Tirze'],
    family: 'incretinas',
    summary: 'Agonista duplo dos receptores GIP e GLP-1',
    presentations: [],
    status: 'sob-consulta',
    featured: true,
  },

  // Eixo GH
  {
    slug: 'aod-9604',
    name: 'AOD-9604',
    aliases: ['AOD 9604', 'AOD'],
    family: 'eixo-gh',
    summary: 'Fragmento modificado do hormônio do crescimento humano',
    presentations: [{ id: 'aod-9604-5mg', label: '5 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
  },
  {
    slug: 'cjc-1295',
    name: 'CJC-1295',
    aliases: ['CJC 1295', 'CJC'],
    family: 'eixo-gh',
    summary: 'Análogo modificado do GHRH com 29 aminoácidos',
    presentations: [],
    status: 'sob-consulta',
  },
  {
    slug: 'igf-1-lr3',
    name: 'IGF-1 LR3',
    aliases: ['IGF1 LR3', 'Long R3 IGF-1', 'IGF-1'],
    family: 'eixo-gh',
    summary: 'Análogo do IGF-1 com meia-vida mais longa',
    presentations: [{ id: 'igf-1-lr3-1mg', label: '1 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
  },
  {
    slug: 'ipamorelina',
    name: 'Ipamorelina',
    aliases: ['Ipamorelin', 'Ipa'],
    family: 'eixo-gh',
    summary: 'Secretagogo seletivo de GH, agonista da grelina',
    presentations: [],
    status: 'sob-consulta',
  },
  {
    slug: 'sermorelin',
    name: 'Sermorelina',
    aliases: ['Sermorelin'],
    family: 'eixo-gh',
    summary: 'Fragmento sintético 1 a 29 do GHRH',
    presentations: [],
    status: 'sob-consulta',
  },
  {
    slug: 'tesamorelina',
    name: 'Tesamorelina',
    aliases: ['Tesamorelin', 'Tesa'],
    family: 'eixo-gh',
    summary: 'Análogo sintético do GHRH com estrutura estabilizada',
    presentations: [{ id: 'tesamorelina-10mg', label: '10 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
  },

  // BPC-157 e TB-500
  {
    slug: 'bpc-157',
    name: 'BPC-157',
    aliases: ['BPC 157', 'BPC'],
    family: 'reparo',
    summary: 'Peptídeo sintético de 15 aminoácidos, origem gástrica',
    presentations: [{ id: 'bpc-157-10mg', label: '10 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
    featured: true,
  },
  {
    slug: 'tb-500',
    name: 'TB-500',
    aliases: ['TB 500', 'Timosina Beta-4', 'Thymosin Beta-4'],
    family: 'reparo',
    summary: 'Versão sintética de fragmento da timosina beta-4',
    presentations: [],
    status: 'sob-consulta',
  },

  // Mitocondriais
  {
    slug: 'mots-c',
    name: 'MOTS-c',
    aliases: ['MOTSc', 'MOTS c'],
    family: 'mitocondrial',
    summary: 'Peptídeo de 16 aminoácidos de origem mitocondrial',
    presentations: [{ id: 'mots-c-40mg', label: '40 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
  },
  {
    slug: 'nad',
    name: 'NAD+',
    aliases: ['NAD', 'Nicotinamida adenina dinucleotídeo'],
    family: 'mitocondrial',
    summary: 'Coenzima presente em todas as células vivas',
    presentations: [],
    status: 'sob-consulta',
  },
  {
    slug: 'ss-31',
    name: 'SS-31',
    aliases: ['SS 31', 'Elamipretida', 'Elamipretide'],
    family: 'mitocondrial',
    summary: 'Tetrapeptídeo que se concentra na membrana mitocondrial',
    presentations: [],
    status: 'sob-consulta',
  },

  // Neuropeptídeos
  {
    slug: 'dsip',
    name: 'DSIP',
    aliases: ['Delta Sleep-Inducing Peptide'],
    family: 'neuro',
    summary: 'Neuropeptídeo de nove aminoácidos isolado em 1977',
    presentations: [],
    status: 'sob-consulta',
  },
  {
    slug: 'epitalon',
    name: 'Epitalon',
    aliases: ['Epithalon', 'Epitalão'],
    family: 'neuro',
    summary: 'Tetrapeptídeo sintético estudado em pesquisas de longevidade',
    presentations: [],
    status: 'sob-consulta',
  },
  {
    slug: 'selank',
    name: 'Selank',
    family: 'neuro',
    summary: 'Análogo sintético da tuftsina, de origem russa',
    presentations: [{ id: 'selank-10mg', label: '10 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
  },
  {
    slug: 'semax',
    name: 'Semax',
    family: 'neuro',
    summary: 'Análogo do fragmento ACTH(4-10), desenvolvido na Rússia',
    presentations: [{ id: 'semax-10mg', label: '10 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
  },

  // Peptídeos de cobre
  {
    slug: 'ghk-cu',
    name: 'GHK-Cu',
    aliases: ['GHK Cu', 'GHK', 'Peptídeo de cobre'],
    family: 'pele',
    summary: 'Tripeptídeo ligado ao cobre, presente no plasma',
    presentations: [{ id: 'ghk-cu-100mg', label: '100 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
    featured: true,
  },

  // Timosinas
  {
    slug: 'thymosin-alpha-1',
    name: 'Thymosin Alpha-1',
    aliases: ['Timosina Alfa-1', 'TA-1', 'Timalfasina', 'Thymalfasin'],
    family: 'imunidade',
    summary: 'Peptídeo de 28 aminoácidos derivado do timo',
    presentations: [],
    status: 'sob-consulta',
  },

  // Blends
  {
    slug: 'cjc-1295-ipamorelina',
    name: 'CJC-1295 + Ipamorelina',
    aliases: ['CJC Ipa', 'CJC + Ipa', 'CJC-1295 Ipamorelin'],
    family: 'blends',
    summary: 'Combinação de análogo de GHRH com ipamorelina',
    presentations: [
      { id: 'cjc-1295-ipamorelina-10mg', label: '10 mg', vials: VIALS, priceUSD: null },
    ],
    status: 'sob-consulta',
  },
  {
    slug: 'klow',
    name: 'KLOW',
    aliases: ['Klow', 'GHK-Cu + BPC-157 + TB-500 + KPV'],
    family: 'blends',
    summary: 'Blend de GHK-Cu, BPC-157, TB-500 e KPV',
    presentations: [{ id: 'klow-80mg', label: '80 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
  },
  {
    slug: 'wolverine',
    name: 'BPC-157 + TB-500',
    aliases: ['Wolverine', 'BPC + TB'],
    family: 'blends',
    summary: 'Combinação de BPC-157 e TB-500 num frasco',
    presentations: [{ id: 'wolverine-20mg', label: '20 mg', vials: VIALS, priceUSD: null }],
    status: 'sob-consulta',
  },
]

export const STATUS_LABEL: Record<ProductStatus, string> = {
  'sob-consulta': 'Disponibilidade sob consulta',
  disponivel: 'Disponível',
  indisponivel: 'Indisponível no momento',
}

export function getFamily(id: FamilyId): Family {
  const family = FAMILIES.find((item) => item.id === id)
  if (!family) throw new Error(`Família desconhecida no catálogo: ${id}`)
  return family
}

// Se o produto vem com o protocolo de uso em PDF (padrão: COMMERCIAL.protocolIncluded).
export function hasProtocol(product: Product): boolean {
  return product.protocol ?? COMMERCIAL.protocolIncluded
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((product) => product.featured)
}

// Agrupa por família, na ordem de FAMILIES, pulando famílias vazias.
export function getProductsByFamily(
  products: Product[] = PRODUCTS,
): { family: Family; products: Product[] }[] {
  return FAMILIES.map((family) => ({
    family,
    products: products.filter((product) => product.family === family.id),
  })).filter((group) => group.products.length > 0)
}

// Menor preço entre as apresentações com preço definido; null se nenhuma tiver.
export function startingPriceUSD(product: Product): number | null {
  const prices = product.presentations
    .map((presentation) => presentation.priceUSD)
    .filter((price): price is number => typeof price === 'number')
  return prices.length > 0 ? Math.min(...prices) : null
}

// 'Olá, Primo. Quero consultar Retatrutida 15 mg (caixa com 10 vials).'
// 'Olá, Primo. Quero consultar Retatrutida.'
export function productWhatsappMessage(product: Product, presentation?: Presentation): string {
  if (!presentation) return `Olá, Primo. Quero consultar ${product.name}.`
  const code = presentation.code ? `, código ${presentation.code}` : ''
  return `Olá, Primo. Quero consultar ${product.name} ${presentation.label} (caixa com ${presentation.vials} vials${code}).`
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Remove espaços, hífens e pontuação: 'bpc157' encontra 'BPC-157'.
function compact(value: string): string {
  return normalize(value).replace(/[^a-z0-9+]/g, '')
}

// Busca sem acento e sem diferenciar maiúsculas, em nome, apelidos e família.
// Com várias palavras, todas precisam aparecer.
export function searchProducts(query: string, products: Product[] = PRODUCTS): Product[] {
  const tokens = normalize(query).split(/\s+/).map(compact).filter(Boolean)
  if (tokens.length === 0) return products

  return products.filter((product) => {
    const haystack = [
      product.name,
      ...(product.aliases ?? []),
      getFamily(product.family).label,
    ].map(compact)
    return tokens.every((token) => haystack.some((field) => field.includes(token)))
  })
}
