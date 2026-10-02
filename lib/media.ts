// Fotos e vídeos REAIS da estrutura de produção do fornecedor parceiro (China),
// enviados pelo cliente. Arquivos otimizados em /public/fonte.
//
// Regras para editar:
// - Nenhuma foto ou vídeo pode mostrar o rosto de alguém (pedido do cliente).
//   Os vídeos já foram recortados só nos trechos sem rosto (mãos e frascos).
// - No máximo 14 itens: os 8 do bloco da home e mais até 6 só na galeria.
// - alt: descreve só o que aparece na imagem (até 14 palavras).
// - caption: legenda curta (até 3 palavras).
// - Nada de alegações: sem "GMP", "sala limpa certificada", "estéril", pureza,
//   marcas de equipamentos ou qualquer coisa que não esteja visível.
//
// Ordem: os 8 primeiros são os destaques da home (FEATURED_SOURCE_MEDIA),
// alternando vídeo e foto. Assim o índice de um destaque é o mesmo em
// SOURCE_MEDIA (útil para abrir o lightbox).

export type SourceMedia = {
  id: string
  type: 'photo' | 'video'
  src: string
  poster?: string
  width: number
  height: number
  alt: string
  caption: string
}

const VIDEO_WIDTH = 540
const VIDEO_HEIGHT = 960

function video(id: string, file: string, alt: string, caption: string): SourceMedia {
  return {
    id,
    type: 'video',
    src: `/fonte/videos/${file}.mp4`,
    poster: `/fonte/videos/${file}-poster.webp`,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    alt,
    caption,
  }
}

function photo(
  id: string,
  file: string,
  width: number,
  height: number,
  alt: string,
  caption: string,
): SourceMedia {
  return {
    id,
    type: 'photo',
    src: `/fonte/fotos/${file}.webp`,
    width,
    height,
    alt,
    caption,
  }
}

export const SOURCE_MEDIA: SourceMedia[] = [
  // Destaques da home (8): vídeo, foto, vídeo, foto, vídeo, foto, vídeo, foto.
  video(
    'frascos-esteira',
    'bandejas-envase',
    'Mão segurando um frasco com pó branco sobre a esteira cheia de frascos',
    'Frascos na esteira',
  ),
  photo(
    'tanques-valvulas',
    'fonte-01',
    1400,
    1049,
    'Tanques de inox com válvulas, manômetros e tubulações sobre piso azul',
    'Tanques e válvulas',
  ),
  video(
    'lacre-automatico',
    'alimentacao-frascos',
    'Frascos com tampa verde entrando em máquina rotativa de lacre',
    'Lacre automático',
  ),
  photo(
    'filtragem-agua',
    'fonte-11',
    1290,
    885,
    'Sistema de filtragem de água com tubulações de inox, painel e tanque',
    'Filtragem de água',
  ),
  video(
    'lacre-frascos',
    'lacre-frascos',
    'Frascos sendo lacrados em máquina de bancada e deslizando para a mesa de inox',
    'Lacre dos frascos',
  ),
  photo(
    'tratamento-agua',
    'fonte-14',
    1049,
    1400,
    'Tanque de inox e colunas da área de tratamento de água, sobre piso azul',
    'Tratamento de água',
  ),
  video(
    'triagem-frascos',
    'triagem-frascos',
    'Bandeja de frascos com tampa verde sendo despejada na mesa de inox para triagem',
    'Triagem dos frascos',
  ),
  photo(
    'camara-inox',
    'fonte-16',
    1049,
    1400,
    'Câmara de inox com visor, bombas de vácuo e tubulações isoladas',
    'Câmara de inox',
  ),

  // Só na galeria completa (4).
  video(
    'carrinho-bandejas',
    'carrinho-bandejas',
    'Carrinho de inox com bandejas cheias de frascos com rolha cinza',
    'Carrinho de bandejas',
  ),
  photo(
    'sistema-agua',
    'fonte-09',
    1400,
    932,
    'Sistema de água com painel de controle, filtros e tanque de inox',
    'Sistema de água',
  ),
  photo(
    'sala-bancadas',
    'fonte-08',
    787,
    1400,
    'Sala ampla com bancadas de inox e piso verde',
    'Sala de bancadas',
  ),
  photo(
    'corredor-interno',
    'fonte-07',
    1050,
    1400,
    'Corredor interno com paredes lisas, portas azuis e janela de vidro',
    'Corredor interno',
  ),
]

// Grade da home: 2 colunas × 4 linhas no celular, 4 colunas × 2 linhas no desktop.
export const FEATURED_SOURCE_MEDIA: SourceMedia[] = SOURCE_MEDIA.slice(0, 8)
