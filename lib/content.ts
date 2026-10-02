// Copy do site (pt-BR). Todo texto visível mora aqui.
//
// Tom: humano, próximo, simples e direto. "O Primo conhece a fonte."
// Menos é mais: título curto (+ no máximo uma linha), cards com título curto e, se
// precisar, uma linha. Sem eyebrows/selos acima dos títulos. Cada fato no máximo
// duas vezes na página.
//
// O Primo é INTERMEDIÁRIO comercial entre o comprador e um fornecedor internacional
// parceiro. Nunca escrever: laboratório/fábrica própria, estoque próprio, pureza em %,
// certificações, avaliações, número de clientes, alegações terapêuticas, garantias
// absolutas ou relação pessoal com o fornecedor.
//
// Sem travessão (em dash ou en dash) em nenhum texto: use vírgula, ponto, dois-pontos
// ou 'e'. Intervalos por extenso: '20 a 35 dias'. Hífen em nome de produto (BPC-157) pode.
//
// A lista de produtos do site é "Mais buscados", só uma parte do que o fornecedor tem.
// "Catálogo completo" só se refere ao pedido pelo WhatsApp (COPY.catalog.fullCatalogCta).
//
// Textos com {chave} são modelos: use fill(COPY.x.y, { chave: valor }).
// Números comerciais vêm de COMMERCIAL (lib/site.ts): mudou lá, muda aqui.

import { COMMERCIAL } from '@/lib/site'
import { formatBRL, formatUSD } from '@/lib/format'

const { vialsPerBox, shippingUSD, leadTimeDays, usdToBrlRef } = COMMERCIAL

const SHIPPING = formatUSD(shippingUSD) // 'US$ 100'
const LEAD_TIME = `${leadTimeDays.min} a ${leadTimeDays.max} dias` // '20 a 35 dias'
const RATE = `${formatUSD(1)} = ${formatBRL(usdToBrlRef)}` // 'US$ 1 = R$ 5,20'

// Política de reenvio do Primo: já vem no preço final. Se algo acontecer com o envio,
// o reenvio é gratuito. Não inventar condições nem números além disso.
const RESEND = 'Reenvio gratuito incluso'

// Linha de clareza da lista do site (título "Mais buscados" + esta linha).
const FRACTION = 'Só uma parte do que o fornecedor tem. O catálogo completo vem pelo WhatsApp.'

// Aviso fixo do protocolo de uso: sempre junto do protocolo (seção, FAQ e ficha do produto).
const PROTOCOL_NOTE = 'Material informativo. Não substitui a orientação de um profissional de saúde.'

// Substitui {chave} no modelo. Chaves sem valor ficam como estão.
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

export const COPY = {
  // Metadados da página /catalogo (a home usa SITE.title e SITE.description).
  // O layout aplica o modelo '%s · Primo Peptídeos' ao title.
  meta: {
    catalog: {
      title: 'Mais buscados',
      description: `Os mais buscados do Primo Peptídeos, em caixas com ${vialsPerBox} vials. O catálogo completo vem pelo WhatsApp.`,
    },
  },

  // Textos de apoio usados em vários lugares.
  common: {
    opensInNewTab: '(abre em nova aba)',
    skipToContent: 'Pular para o conteúdo',
  },

  header: {
    homeLabel: 'Primo Peptídeos, página inicial',
    navLabel: 'Navegação principal',
    cta: 'Falar com o Primo',
    ctaMessage: 'Olá, Primo. Quero entender como funciona.',
    menuOpen: 'Abrir menu',
    menuClose: 'Fechar menu',
  },

  hero: {
    // h1 da página. highlight = trecho do title em dourado.
    title: 'O Primo conhece a fonte.',
    highlight: 'a fonte',
    subtitle: 'Acesso direto ao fornecedor internacional parceiro. O Primo acompanha seu pedido até a entrega.',
    primaryCta: 'Ver produtos',
    secondaryCta: 'Falar com o Primo',
    secondaryCtaMessage: 'Olá, Primo. Quero entender como funciona.',
    map: {
      originLabel: 'Hong Kong',
      originCaption: 'Fornecedor parceiro',
      destinationLabel: 'Brasil',
      destinationCaption: 'Você',
      ariaLabel:
        'Mapa-múndi pontilhado com a rota de envio: do fornecedor parceiro, em Hong Kong, na China, até você, no Brasil.',
    },
  },

  // Faixa de condições (só fatos, frases curtas).
  conditions: {
    ariaLabel: 'Condições comerciais',
    // Botão de pausa da faixa rolante (alternância com aria-pressed).
    pauseLabel: 'Pausar a faixa de condições',
    items: [
      `Caixas com ${vialsPerBox} vials`,
      `Frete ${SHIPPING} por pedido`,
      `${LEAD_TIME} após o despacho`,
      'Rastreio do envio',
      RESEND,
    ],
  },

  how: {
    title: 'Da escolha até você.',
    highlight: 'até você',
    // Exatamente 4 etapas (grade 2 × 2 no celular).
    steps: [
      {
        id: 'escolha',
        title: 'Você escolhe',
        description: 'Produto, apresentação e quantidade.',
      },
      {
        id: 'confirmacao',
        title: 'O Primo confirma',
        description: 'Disponibilidade e orçamento antes de pagar.',
      },
      {
        id: 'fornecedor',
        title: 'O fornecedor envia',
        description: 'Direto para você, após o pagamento.',
      },
      {
        id: 'entrega',
        title: 'Você recebe',
        description: 'Com código de rastreio desde o despacho.',
      },
    ],
    cta: 'Falar com o Primo',
    ctaMessage: 'Olá, Primo. Quero entender como funciona o pedido.',
  },

  model: {
    title: 'Menos camadas, mais acesso.',
    highlight: 'mais acesso',
    description: 'Cada intermediário soma margem e tempo. O Primo encurta o caminho.',
    traditional: {
      label: 'Caminho tradicional',
      steps: ['Fornecedor', 'Importador', 'Distribuidor', 'Revendedor', 'Você'],
    },
    primo: {
      label: 'Com o Primo',
      steps: ['Fornecedor', 'Primo', 'Você'],
      // Etapa que representa o Primo (destaque dourado e o único cifrão da cadeia).
      bridgeStep: 'Primo',
    },
  },

  // Fotos e vídeos reais da estrutura do fornecedor parceiro (não é do Primo).
  source: {
    title: 'Conheça a fonte.',
    highlight: 'a fonte',
    description: 'Imagens reais da estrutura do fornecedor parceiro.',
    viewAll: 'Ver todas as imagens',
    close: 'Fechar',
    prev: 'Imagem anterior',
    next: 'Próxima imagem',
    videoBadgeLabel: 'Vídeo',
    galleryLabel: 'Galeria do fornecedor parceiro',
  },

  featured: {
    title: 'Comece por aqui.',
    highlight: 'por aqui',
    labels: {
      priceOnRequest: 'Sob consulta',
      fromPrice: 'a partir de',
      presentations: 'Apresentações',
      presentationTbd: 'Apresentação a confirmar',
      consult: 'Consultar',
      detailsAria: 'Ver detalhes de {product}',
      seeCatalog: 'Ver mais buscados',
    },
  },

  // Protocolo de uso completo em PDF de cada peptídeo comprado, enviado junto com a compra.
  protocol: {
    title: 'Protocolo de uso incluso.',
    highlight: 'incluso',
    description: 'Nunca usou? Cada peptídeo vem com um PDF completo explicando como ele age no seu corpo.',
    // Nome acessível da ilustração (silhueta com o sistema nervoso em dourado).
    figureLabel: 'Ilustração de uma pessoa com o sistema nervoso em destaque',
    // Exatamente 4 itens (grade 2 × 2 no celular).
    items: [
      { id: 'como-funciona', title: 'Como funciona no corpo' },
      { id: 'preparo', title: 'Preparo e uso' },
      { id: 'dosagem', title: 'Referências de dosagem' },
      { id: 'cuidados', title: 'Cuidados' },
    ],
    note: PROTOCOL_NOTE,
    // Linha na ficha do produto, sempre seguida de note (use com hasProtocol(product)).
    badge: 'Protocolo de uso incluso',
  },

  // Lista de produtos do site: "Mais buscados", só uma parte do que o fornecedor tem.
  // "Catálogo completo" é só o pedido pelo WhatsApp (fullCatalogCta / fullCatalogMessage).
  catalog: {
    title: 'Mais buscados.',
    highlight: 'buscados',
    // Linha do cabeçalho (home e /catalogo).
    fraction: FRACTION,
    // CTA para pedir o catálogo completo no WhatsApp (location 'catalog_full').
    fullCatalogCta: 'Pedir catálogo completo',
    fullCatalogMessage: 'Olá, Primo. Quero receber o catálogo completo.',
    // Página /catalogo (o título vira h1 nessa rota; pageTitle também é rótulo de link).
    pageTitle: 'Mais buscados',
    pageHighlight: 'buscados',
    backHome: 'Voltar para o início',
    searchLabel: 'Buscar produto',
    searchPlaceholder: 'Buscar por nome. Ex.: BPC-157',
    clearSearch: 'Limpar busca',
    filterLabel: 'Filtrar por família',
    allFamilies: 'Todos',
    // Use: count === 0 ? zero : count === 1 ? one : fill(other, { count })
    resultsCount: {
      zero: 'Nenhum produto encontrado',
      one: '1 produto',
      other: '{count} produtos',
    },
    emptyState: {
      title: 'Nada com esse nome.',
      cta: 'Perguntar ao Primo',
      // Mensagem do WhatsApp quando a busca não encontra nada. {query} = termo buscado.
      whatsappMessage: 'Olá, Primo. Procurei "{query}" no site e não encontrei. Consegue verificar pra mim?',
      whatsappMessageNoQuery: 'Olá, Primo. Não encontrei o que procuro no site. Consegue verificar pra mim?',
    },
    // {count} = total de itens: fill(COPY.catalog.expand, { count }).
    expand: 'Ver todos os mais buscados ({count})',
    collapse: 'Mostrar menos',
    priceNote: `Preços em USD por caixa. Reais só como referência (${RATE}).`,
    consult: 'Consultar',
    consultAria: 'Consultar {product} no WhatsApp',
    detailsAria: 'Ver detalhes de {product}',
  },

  productSheet: {
    dialogLabel: 'Detalhes do produto',
    choosePresentation: 'Escolha a apresentação',
    presentationTbd: 'Apresentação a confirmar',
    box: 'Caixa com {n} vials',
    price: 'Preço por caixa',
    priceOnRequest: 'Preço sob consulta',
    brlRef: '≈ {brl} (referência)',
    cta: 'Consultar no WhatsApp',
    note: 'Disponibilidade e orçamento confirmados antes do pagamento.',
    shippingNote: `Frete de ${SHIPPING} por pedido. Tributos à parte.`,
    // Perto do preço / da caixa.
    resend: 'Reenvio gratuito incluso no preço',
    close: 'Fechar',
  },

  faq: {
    title: 'Dúvidas frequentes.',
    highlight: 'frequentes',
    // Exatamente 6 perguntas. Respostas curtas (até ~28 palavras).
    items: [
      {
        id: 'fabricante',
        question: 'O Primo é laboratório ou fabricante?',
        answer:
          'Não. O Primo faz a ponte comercial com um fornecedor internacional parceiro e acompanha seu pedido. Quem prepara e despacha é o fornecedor.',
      },
      {
        id: 'frete',
        question: 'Quanto custa o frete e qual o prazo?',
        answer: `O frete é de ${SHIPPING} por pedido e não entra em descontos. O prazo estimado é de ${LEAD_TIME} após o despacho.`,
      },
      {
        id: 'tributos',
        question: 'E os impostos?',
        answer:
          'Tributos e taxas brasileiros não estão no preço e podem variar. O pedido fica no nome de quem recebe.',
      },
      {
        id: 'pagamento',
        question: 'Como é o pagamento?',
        answer: 'É combinado com o Primo no WhatsApp, só depois de confirmar disponibilidade e orçamento.',
      },
      {
        id: 'protocolo',
        question: 'É minha primeira vez. Como sei o que fazer?',
        answer: `Junto com a compra, você recebe o protocolo de uso em PDF de cada peptídeo. ${PROTOCOL_NOTE}`,
      },
      {
        id: 'problema-envio',
        question: 'E se der problema no envio?',
        answer:
          'Se algo acontecer com o envio, o reenvio é gratuito e já está incluso no preço final. O Primo acompanha tudo com você.',
      },
    ],
  },

  finalCta: {
    // Pergunta + resposta em dourado e um CTA só.
    question: 'Ainda ficou alguma dúvida?',
    answer: 'Fala com o Primo.',
    cta: 'Falar com o Primo',
    ctaMessage: 'Olá, Primo. Fiquei com uma dúvida.',
  },

  footer: {
    institutional:
      'O Primo faz a intermediação comercial com um fornecedor internacional parceiro e não é laboratório nem fabricante.',
    // Uma linha só.
    notes: ['Preços em USD. Frete e tributos à parte.'],
    navTitle: 'Navegação',
    contactTitle: 'Contato',
    whatsappLabel: 'WhatsApp',
    rights: '© {year} Primo Peptídeos. Todos os direitos reservados.',
    backToTop: 'Voltar ao topo',
  },

  whatsappFloat: {
    label: 'Falar com o Primo',
    ariaLabel: 'Falar com o Primo no WhatsApp (abre em nova aba)',
    message: 'Olá, Primo. Quero entender como funciona.',
  },

  // Pop-up estilo balão de conversa (tempo em WHATSAPP_POPUP, lib/site.ts).
  whatsappPopup: {
    // Texto do balão; também rotula o pop-up (aria-labelledby).
    message: 'Não achou o que procura? Fala com o Primo.',
    cta: 'Falar com o Primo',
    ctaMessage: 'Olá, Primo. Não achei o que procurava no site.',
    // aria-label do botão X.
    close: 'Fechar mensagem do Primo',
  },
} as const
