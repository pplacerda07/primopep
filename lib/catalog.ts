// Produtos do Primo Peptídeos (lista "Mais buscados"): dados separados da interface.
//
// COMO EDITAR (sem mexer em componentes):
// - Novo produto: copie um item de PRODUCTS, troque slug (único, minúsculo, com hífen),
//   name, family (um id de FAMILIES), summary, category, description e image.
// - summary: descrição neutra de exatamente 7 palavras, mostrada na lista "Mais buscados".
//   SEM promessa de efeito ou orientação de uso.
// - category: linha curta de classificação, mostrada na ficha do produto
//   (ex.: 'Análogo de GHRH'). Vem do arquivo de descrições do cliente.
// - description: parágrafo "Como age" da ficha do produto, de 35 a 60 palavras. Sempre no
//   enquadramento de pesquisa ("é estudado", "pesquisas investigam"), sem promessa de
//   resultado e sem dose ou orientação de uso. Vem do arquivo de descrições do cliente.
// - image: foto real do fornecedor (caixa transparente com 10 frascos), em
//   public/peptideos/<arquivo>.webp, 960 × 720 (4:3). Use '/peptideos/<arquivo>.webp'.
//   Sem foto, o site desenha o vial. Nada de rostos, selos ou números de pureza.
// - Apresentações: ficam VAZIAS (presentations: []). Regra do cliente: o site não cita
//   miligramas, porque cada peptídeo tem várias dosagens; a dose é combinada no WhatsApp.
// - Preço: troque priceUSD: null pelo valor em dólar (ex.: 70).
//   Enquanto for null, o site não mostra preço (a consulta é pelo WhatsApp).
//   A ficha do produto nunca mostra preço; só o card de destaque e a lista mostram.
// - Código do fornecedor: campo opcional code na apresentação. Não inventar.
// - Sem travessão em texto visível (summary, category, description, label etc.):
//   intervalos como '1 a 29'. Hífen em nome de produto (BPC-157) pode.
// - Destaque na home: featured: true (manter poucos e em número par para a grade de 2
//   colunas no celular; hoje são 4).
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
  label: string // ex.: '10 mg' (dose por frasco)
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
  category: string // classificação curta da ficha (ex.: 'Análogo de GHRH')
  description: string // parágrafo "Como age" da ficha, 35 a 60 palavras, enquadramento de pesquisa
  presentations: Presentation[] // uma por produto; vazio = apresentação a confirmar
  status: ProductStatus
  featured?: boolean
  image?: string // foto real em /peptideos/<arquivo>.webp; sem ela o site desenha o vial
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
    category: 'Agonista metabólico investigacional',
    description:
      'A Retatrutida é um composto investigacional de ação tripla, desenvolvido para atuar ao mesmo tempo nos receptores de GLP-1, GIP e glucagon. Essa combinação é estudada principalmente por sua influência sobre saciedade, gasto energético, metabolismo da glicose e regulação do peso corporal. Por atuar em várias vias metabólicas, é considerada uma das moléculas mais avançadas em pesquisa nessa categoria.',
    presentations: [],
    status: 'sob-consulta',
    featured: true,
    image: '/peptideos/retatrutida.webp',
  },
  {
    slug: 'semaglutida',
    name: 'Semaglutida',
    aliases: ['Semaglutide', 'Sema'],
    family: 'incretinas',
    summary: 'Agonista de GLP-1 estudado no controle glicêmico',
    category: 'Análogo de GLP-1',
    description:
      'A Semaglutida é um análogo do hormônio GLP-1, que participa de mecanismos ligados à saciedade, ao controle da glicose e à resposta à alimentação. Ela ativa os receptores de GLP-1, influenciando o esvaziamento gástrico, a sinalização de fome e a regulação metabólica. É uma das moléculas mais conhecidas da classe dos agonistas de GLP-1.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/semaglutida.webp',
  },
  {
    slug: 'survodutide',
    name: 'Survodutida',
    aliases: ['Survodutide'],
    family: 'incretinas',
    summary: 'Agonista duplo de glucagon e GLP-1, experimental',
    category: 'Agonista duplo de GLP-1 e glucagon',
    description:
      'A Survodutida é um composto investigacional que combina a ativação dos receptores de GLP-1 e glucagon. Essa dupla ação vem sendo estudada pela capacidade de influenciar, ao mesmo tempo, a saciedade, o metabolismo energético e o uso das reservas corporais. Seu desenvolvimento está ligado principalmente a pesquisas sobre controle de peso, metabolismo hepático e parâmetros metabólicos.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/survodutide.webp',
  },
  {
    slug: 'tirzepatida',
    name: 'Tirzepatida',
    aliases: ['Tirzepatide', 'Tirze'],
    family: 'incretinas',
    summary: 'Agonista duplo dos receptores GIP e GLP-1',
    category: 'Agonista duplo de GIP e GLP-1',
    description:
      'A Tirzepatida atua em dois receptores importantes do metabolismo: GIP e GLP-1. Essa combinação permite uma ação integrada sobre controle glicêmico, sinalização de saciedade, resposta à alimentação e metabolismo energético. Por atingir duas vias hormonais ao mesmo tempo, tornou-se uma das principais referências da nova geração de agonistas metabólicos.',
    presentations: [],
    status: 'sob-consulta',
    featured: true,
    image: '/peptideos/tirzepatida.webp',
  },

  // Eixo GH
  {
    slug: 'aod-9604',
    name: 'AOD-9604',
    aliases: ['AOD 9604', 'AOD'],
    family: 'eixo-gh',
    summary: 'Fragmento modificado do hormônio do crescimento humano',
    category: 'Fragmento modificado do hormônio do crescimento',
    description:
      'O AOD-9604 é um fragmento sintético derivado de uma região específica do hormônio do crescimento humano. Foi desenvolvido para investigar efeitos metabólicos ligados principalmente à quebra e ao uso de gordura, sem reproduzir toda a atividade do hormônio completo. É estudado especialmente em contextos de lipólise e metabolismo do tecido adiposo.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/aod-9604.webp',
  },
  {
    slug: 'cjc-1295',
    name: 'CJC-1295',
    aliases: ['CJC 1295', 'CJC'],
    family: 'eixo-gh',
    summary: 'Análogo modificado do GHRH com 29 aminoácidos',
    category: 'Análogo de GHRH',
    description:
      'O CJC-1295 é um peptídeo sintético desenvolvido para agir de forma semelhante ao hormônio liberador do hormônio do crescimento, o GHRH. Seu principal mecanismo é estimular a hipófise, aumentando a sinalização ligada à produção e à liberação do hormônio do crescimento. É estudado em pesquisas sobre pulsos hormonais, recuperação, composição corporal e regulação endócrina.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/cjc-1295.webp',
  },
  {
    slug: 'igf-1-lr3',
    name: 'IGF-1 LR3',
    aliases: ['IGF1 LR3', 'Long R3 IGF-1', 'IGF-1'],
    family: 'eixo-gh',
    summary: 'Análogo do IGF-1 com meia-vida mais longa',
    category: 'Variante de longa duração do IGF-1',
    description:
      'O IGF-1 LR3 é uma versão modificada do fator de crescimento semelhante à insulina tipo 1, criada para ter atividade mais duradoura que a do IGF-1 natural. Sua estrutura reduz a ligação a proteínas transportadoras e aumenta a disponibilidade experimental. É usado em pesquisas sobre crescimento celular, síntese proteica, sinalização anabólica e metabolismo de nutrientes.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/igf-1-lr3.webp',
  },
  {
    slug: 'ipamorelina',
    name: 'Ipamorelina',
    aliases: ['Ipamorelin', 'Ipa'],
    family: 'eixo-gh',
    summary: 'Peptídeo secretagogo seletivo do hormônio do crescimento',
    category: 'Secretagogo do hormônio do crescimento',
    description:
      'A Ipamorelina é um peptídeo que atua em receptores ligados à liberação do hormônio do crescimento. É conhecida por uma ação mais seletiva que a de outros secretagogos, estimulando pulsos de GH por vias específicas. É estudada em contextos de recuperação, composição corporal, sono e regulação hormonal.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/ipamorelina.webp',
  },
  {
    slug: 'sermorelin',
    name: 'Sermorelina',
    aliases: ['Sermorelin'],
    family: 'eixo-gh',
    summary: 'Fragmento sintético 1 a 29 do GHRH',
    category: 'Análogo de GHRH',
    description:
      'A Sermorelina é um peptídeo sintético que imita parte da ação natural do hormônio liberador do hormônio do crescimento. Atua principalmente na hipófise, estimulando os mecanismos fisiológicos de produção e liberação de GH. É usada em pesquisas sobre função endócrina, secreção hormonal e manutenção dos ritmos naturais de liberação do hormônio do crescimento.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/sermorelin.webp',
  },
  {
    slug: 'tesamorelina',
    name: 'Tesamorelina',
    aliases: ['Tesamorelin', 'Tesa'],
    family: 'eixo-gh',
    summary: 'Análogo sintético do GHRH com estrutura estabilizada',
    category: 'Análogo de GHRH',
    description:
      'A Tesamorelina é um análogo sintético do hormônio liberador do hormônio do crescimento. Seu principal efeito está ligado ao estímulo da produção endógena de GH pela hipófise, preservando o padrão natural de sinalização hormonal. É estudada por sua influência sobre metabolismo, composição corporal e distribuição de gordura.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/tesamorelina.webp',
  },

  // BPC-157 e TB-500
  {
    slug: 'bpc-157',
    name: 'BPC-157',
    aliases: ['BPC 157', 'BPC'],
    family: 'reparo',
    summary: 'Peptídeo sintético de 15 aminoácidos, origem gástrica',
    category: 'Peptídeo experimental de reparação tecidual',
    description:
      'O BPC-157 é um peptídeo experimental amplamente pesquisado em modelos de regeneração e recuperação de tecidos. Estudos pré-clínicos investigam sua possível participação na reparação de músculos, tendões, ligamentos, mucosa gastrointestinal e outros tecidos. Também é analisado por sua interação com mecanismos inflamatórios, angiogênese e recuperação celular.',
    presentations: [],
    status: 'sob-consulta',
    featured: true,
    image: '/peptideos/bpc-157.webp',
  },
  {
    slug: 'tb-500',
    name: 'TB-500',
    aliases: ['TB 500', 'Timosina Beta-4', 'Thymosin Beta-4'],
    family: 'reparo',
    summary: 'Versão sintética de fragmento da timosina beta-4',
    category: 'Peptídeo relacionado à timosina beta-4',
    description:
      'O TB-500 é um peptídeo sintético associado à atividade da timosina beta-4, proteína envolvida na migração celular e na reparação de tecidos. É investigado principalmente por sua relação com regeneração, mobilidade celular, formação de novos vasos e recuperação de estruturas musculares e conjuntivas. Seu uso segue concentrado em contextos experimentais.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/tb-500.webp',
  },

  // Mitocondriais
  {
    slug: 'mots-c',
    name: 'MOTS-c',
    aliases: ['MOTSc', 'MOTS c'],
    family: 'mitocondrial',
    summary: 'Peptídeo de 16 aminoácidos de origem mitocondrial',
    category: 'Peptídeo mitocondrial',
    description:
      'O MOTS-c é um pequeno peptídeo produzido a partir do DNA mitocondrial e associado à regulação do metabolismo celular. Pesquisas investigam seu papel no uso da glicose, na produção de energia, na resposta ao estresse metabólico e na adaptação celular ao exercício. É considerado um importante exemplo de molécula de sinalização originada diretamente das mitocôndrias.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/mots-c.webp',
  },
  {
    slug: 'nad',
    name: 'NAD+',
    aliases: ['NAD', 'Nicotinamida adenina dinucleotídeo'],
    family: 'mitocondrial',
    summary: 'Coenzima presente em praticamente todas as células',
    category: 'Cofator celular',
    description:
      'O NAD+ é uma molécula presente em praticamente todas as células do organismo e participa de processos fundamentais de produção de energia. Atua como cofator em diversas reações metabólicas e está envolvido na reparação celular, na função mitocondrial e na atividade de enzimas reguladoras. Seus níveis são amplamente estudados em pesquisas sobre metabolismo e envelhecimento.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/nad.webp',
  },
  {
    slug: 'ss-31',
    name: 'SS-31',
    aliases: ['SS 31', 'Elamipretida', 'Elamipretide'],
    family: 'mitocondrial',
    summary: 'Tetrapeptídeo que se concentra na membrana mitocondrial',
    category: 'Peptídeo direcionado às mitocôndrias',
    description:
      'O SS-31 é um peptídeo experimental desenvolvido para atuar diretamente nas mitocôndrias. Sua pesquisa está ligada à proteção das membranas mitocondriais, à eficiência energética e à redução de danos associados ao estresse oxidativo. É estudado em diferentes modelos de disfunção celular, especialmente os ligados à baixa eficiência na produção de energia.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/ss-31.webp',
  },

  // Neuropeptídeos
  {
    slug: 'dsip',
    name: 'DSIP',
    aliases: ['Delta Sleep-Inducing Peptide'],
    family: 'neuro',
    summary: 'Neuropeptídeo de nove aminoácidos isolado em 1977',
    category: 'Peptídeo experimental relacionado ao sono',
    description:
      'O DSIP (Delta Sleep-Inducing Peptide) é um peptídeo identificado inicialmente em estudos sobre sono e atividade cerebral. Desde então, passou a ser investigado por sua possível relação com a regulação do sono, a resposta ao estresse, o controle neuroendócrino e funções do sistema nervoso. Seu mecanismo de ação ainda é objeto de pesquisa.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/dsip.webp',
  },
  {
    slug: 'epitalon',
    name: 'Epitalon',
    aliases: ['Epithalon', 'Epitalão'],
    family: 'neuro',
    summary: 'Tetrapeptídeo sintético estudado em pesquisas de longevidade',
    category: 'Tetrapeptídeo sintético',
    description:
      'O Epitalon é um pequeno peptídeo sintético desenvolvido a partir de estudos sobre peptídeos da glândula pineal. É investigado principalmente em pesquisas sobre envelhecimento celular, ritmos circadianos, expressão gênica e atividade da telomerase. Seu interesse científico está ligado à possível influência sobre processos de manutenção e longevidade celular.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/epitalon.webp',
  },
  {
    slug: 'selank',
    name: 'Selank',
    family: 'neuro',
    summary: 'Análogo sintético da tuftsina, de origem russa',
    category: 'Peptídeo neuroativo',
    description:
      'O Selank é um peptídeo sintético desenvolvido a partir de moléculas ligadas aos sistemas imunológico e nervoso. É estudado por sua possível influência sobre mecanismos de ansiedade, estresse, cognição, memória e neurotransmissão. Pesquisas experimentais também avaliam sua interação com sistemas como GABA, serotonina e fatores neurotróficos.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/selank.webp',
  },
  {
    slug: 'semax',
    name: 'Semax',
    family: 'neuro',
    summary: 'Análogo do fragmento ACTH 4 a 10',
    category: 'Peptídeo neuroativo',
    description:
      'O Semax é um peptídeo sintético pesquisado principalmente por sua interação com mecanismos de cognição e proteção neuronal. Estudos investigam sua influência sobre memória, aprendizado, resposta ao estresse celular e produção de fatores neurotróficos. É conhecido sobretudo por pesquisas sobre o sistema nervoso central e a sinalização cerebral.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/semax.webp',
  },

  // Peptídeos de cobre
  {
    slug: 'ghk-cu',
    name: 'GHK-Cu',
    aliases: ['GHK Cu', 'GHK', 'Peptídeo de cobre'],
    family: 'pele',
    summary: 'Tripeptídeo ligado ao cobre, presente no plasma',
    category: 'Peptídeo ligado ao cobre',
    description:
      'O GHK-Cu é um complexo formado pelo peptídeo GHK ligado a um íon de cobre. A molécula ocorre naturalmente no organismo e participa de processos de remodelação de tecidos. É amplamente estudada por sua relação com produção de colágeno, regeneração da pele, cicatrização, crescimento capilar e manutenção da matriz extracelular.',
    presentations: [],
    status: 'sob-consulta',
    featured: true,
    image: '/peptideos/ghk-cu.webp',
  },

  // Timosinas
  {
    slug: 'thymosin-alpha-1',
    name: 'Thymosin Alpha-1',
    aliases: ['Timosina Alfa-1', 'TA-1', 'Timalfasina', 'Thymalfasin'],
    family: 'imunidade',
    summary: 'Peptídeo de 28 aminoácidos derivado do timo',
    category: 'Peptídeo imunomodulador',
    description:
      'A Thymosin Alpha-1 é um peptídeo ligado à atividade do timo e à regulação da resposta imunológica. É estudada por sua capacidade de influenciar diferentes componentes do sistema imune, incluindo células T, células dendríticas e mecanismos de defesa celular. Seu interesse científico está principalmente na modulação e no equilíbrio da resposta imunológica.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/thymosin-alpha-1.webp',
  },

  // Blends
  {
    slug: 'cjc-1295-ipamorelina',
    name: 'CJC-1295 + Ipamorelina',
    aliases: ['CJC Ipa', 'CJC + Ipa', 'CJC-1295 Ipamorelin'],
    family: 'blends',
    summary: 'Combinação de análogo de GHRH com ipamorelina',
    category: 'Combinação de peptídeos secretagogos',
    description:
      'A combinação de CJC-1295 com Ipamorelina reúne dois mecanismos complementares ligados à liberação do hormônio do crescimento. Enquanto o CJC-1295 atua em vias semelhantes às do GHRH, a Ipamorelina age sobre receptores secretagogos específicos. A associação é estudada pela capacidade de estimular pulsos hormonais por vias diferentes ao mesmo tempo.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/cjc-1295-ipamorelina.webp',
  },
  {
    slug: 'klow',
    name: 'KLOW',
    aliases: ['Klow', 'GHK-Cu + BPC-157 + TB-500 + KPV'],
    family: 'blends',
    // A composição ainda não foi confirmada pelo Primo (o rótulo só diz 'KLOW'):
    // o resumo não afirma os componentes e a descrição mantém a ressalva.
    // Confirmada, a descrição pode dizer 'Esta formulação reúne GHK-Cu, BPC-157, TB-500 e KPV.'
    summary: 'Blend de peptídeos estudado em reparação tecidual',
    category: 'Combinação de peptídeos de reparação tecidual',
    description:
      'O KLOW é uma combinação de peptídeos usada em pesquisas que buscam reunir mecanismos ligados à regeneração, à remodelação de tecidos e à modulação inflamatória. Dependendo da formulação, o blend pode incluir GHK-Cu, BPC-157, TB-500 e KPV. A proposta é explorar diferentes vias biológicas de forma complementar num mesmo protocolo experimental.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/klow.webp',
  },
  {
    slug: 'wolverine',
    name: 'BPC-157 + TB-500',
    aliases: ['Wolverine', 'BPC + TB'],
    family: 'blends',
    summary: 'Combinação de BPC-157 e TB-500 num frasco',
    category: 'Combinação de peptídeos de pesquisa',
    description:
      'A combinação de BPC-157 com TB-500 reúne dois peptídeos experimentais amplamente investigados em estudos de reparação e regeneração tecidual. O BPC-157 é associado à recuperação e à angiogênese, e o TB-500, à migração celular e à remodelação dos tecidos. Juntos, são estudados em protocolos experimentais voltados à recuperação de músculos, tendões e outros tecidos.',
    presentations: [],
    status: 'sob-consulta',
    image: '/peptideos/bpc-157-tb-500.webp',
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

// Mensagem pronta do WhatsApp para um produto. Sem dosagem: cada peptídeo tem várias,
// e a dose é combinada na conversa. Ex.: 'Olá, Primo. Quero consultar Retatrutida. Quais dosagens estão disponíveis?'
export function productWhatsappMessage(product: Product): string {
  return `Olá, Primo. Quero consultar ${product.name}. Quais dosagens estão disponíveis?`
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
