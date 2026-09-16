# DevProfile — Design System

> Fonte única de verdade do visual do DevProfile. Nenhuma cor, tamanho, raio, sombra
> ou animação entra no código sem estar aqui. Valor novo no componente significa
> token novo neste arquivo, ou está fora do sistema.

Stack: Angular 21 standalone + SCSS puro. Sem Tailwind, sem lib de animação, sem
`@primer/primitives` (os valores do Primer estão escritos à mão em
`devprofile-web/src/app/styles/_theme.scss`).

---

## As duas teses (validadas)

**Tese visual.** Interface na gramática do Primer nos três temas do GitHub, com
hierarquia feita de borda de 1px e de superfície e nunca de profundidade: Mona Sans
nos títulos e a pilha de sistema do GitHub no corpo de 14px, com numerais tabulares
nas métricas; grade de 8px e densidade de aplicação, não de landing page; raio de 6px,
botão de 32px, sem sombra no dark e `0 1px 0` no light; a cor é a do Primer, inclusive
o azul de acento, e a única licença autoral é estrutural: o bloco de score.

**Tese de interação.** Movimento curto e seco, de 80 a 400ms, no comportamento do
próprio GitHub: hover muda só cor de fundo e de borda em 80ms lineares, sem escala,
sem levitação e sem sombra que cresce; foco sempre com anel de 2px do acento; na
rolagem não acontece nada, as animações são de dado novo, não de scroll: quando um
perfil é analisado, o score conta de 0 e as barras crescem uma vez em 400ms com
`cubic-bezier(.22,.61,.36,1)`, escalonadas de 40 em 40ms; nada de bounce, elástico,
parallax, scroll hijack ou vidro, e tudo cai no estado final imediato sob
`prefers-reduced-motion`.

Decisões de acompanhamento, já fechadas:

| Decisão | Escolha |
| --- | --- |
| Temas | Os três do Primer: `light`, `dark` (default), `dimmed`, com seletor no header e `system` seguindo o SO |
| Acento | O azul do próprio Primer. Sem cor de marca própria |
| Tipografia | Mona Sans nos títulos e números de destaque; pilha de sistema do GitHub no corpo |
| Tokens | Escritos à mão no SCSS, sem dependência nova |
| Assinatura | Estrutural, não cromática: o bloco de score |

---

## Cor

Nomes seguem os do Primer (`canvas.default` vira `--canvas-default`). Os três temas
definem o mesmo conjunto de variáveis; nenhum componente pode declarar um hex.

### Superfície e texto

| Token | light | dark | dimmed |
| --- | --- | --- | --- |
| `--canvas-default` | `#ffffff` | `#0d1117` | `#22272e` |
| `--canvas-subtle` | `#f6f8fa` | `#151b23` | `#2d333b` |
| `--canvas-inset` | `#f6f8fa` | `#010409` | `#1c2128` |
| `--header-bg` | `#ffffff` | `#010409` | `#1c2128` |
| `--border-default` | `#d1d9e0` | `#3d444d` | `#444c56` |
| `--border-muted` | `#d8dee4` | `#2f353d` | `#373e47` |
| `--fg-default` | `#1f2328` | `#f0f6fc` | `#adbac7` |
| `--fg-muted` | `#59636e` | `#9198a1` | `#768390` |
| `--fg-subtle` | `#818b98` | `#6e7681` | `#636e7b` |
| `--fg-on-emphasis` | `#ffffff` | `#ffffff` | `#ffffff` |

### Semânticas

| Token | light | dark | dimmed |
| --- | --- | --- | --- |
| `--accent-fg` | `#0969da` | `#4493f8` | `#539bf5` |
| `--accent-emphasis` | `#0969da` | `#1f6feb` | `#316dca` |
| `--accent-subtle` | `#ddf4ff` | `rgba(56,139,253,.15)` | `rgba(65,132,228,.15)` |
| `--success-fg` | `#1a7f37` | `#3fb950` | `#57ab5a` |
| `--success-emphasis` | `#1f883d` | `#238636` | `#347d39` |
| `--attention-fg` | `#9a6700` | `#d29922` | `#c69026` |
| `--danger-fg` | `#d1242f` | `#f85149` | `#e5534b` |
| `--done-fg` | `#8250df` | `#ab7df8` | `#986ee2` |
| `--neutral-muted` | `rgba(129,139,152,.2)` | `rgba(101,108,118,.2)` | `rgba(99,110,123,.4)` |

Contraste de `--fg-default` sobre `--canvas-default`: 15.9:1 no light, 17.1:1 no dark,
9.6:1 no dimmed. `--fg-muted` fica em 5.6:1, 5.4:1 e 4.8:1. Todos passam em AA.

### Botão

| Token | light | dark | dimmed |
| --- | --- | --- | --- |
| `--btn-bg` | `#f6f8fa` | `#212830` | `#373e47` |
| `--btn-hover-bg` | `#eef1f4` | `#262c36` | `#444c56` |
| `--btn-border` | `rgba(31,35,40,.15)` | `#3d444d` | `#444c56` |
| `--btn-primary-bg` | `#1f883d` | `#238636` | `#347d39` |
| `--btn-primary-hover` | `#1a7f37` | `#2ea043` | `#46954a` |
| `--btn-danger-fg` | `#d1242f` | `#f85149` | `#e5534b` |

### Grade de contribuições (também usada no ritmo de commits)

| Nível | light | dark | dimmed |
| --- | --- | --- | --- |
| `--grid-0` | `#ebedf0` | `#151b23` | `#2d333b` |
| `--grid-1` | `#9be9a8` | `#033a16` | `#12462b` |
| `--grid-2` | `#40c463` | `#196c2e` | `#196c2e` |
| `--grid-3` | `#30a14e` | `#2ea043` | `#2ea043` |
| `--grid-4` | `#216e39` | `#56d364` | `#56d364` |

### Escala categórica de gráfico

`--chart-1` a `--chart-6`, nessa ordem: azul, roxo, verde, amarelo, vermelho, cinza, sempre
com o valor do tema corrente. É a única exceção à regra de uso das cores semânticas, e
existe porque donut e barra empilhada precisam de categorias distinguíveis. Fora de
gráfico, vale a regra normal.

| Token | light | dark | dimmed |
| --- | --- | --- | --- |
| `--chart-1` | `#0969da` | `#4493f8` | `#539bf5` |
| `--chart-2` | `#8250df` | `#ab7df8` | `#986ee2` |
| `--chart-3` | `#1a7f37` | `#3fb950` | `#57ab5a` |
| `--chart-4` | `#9a6700` | `#d29922` | `#c69026` |
| `--chart-5` | `#d1242f` | `#f85149` | `#e5534b` |
| `--chart-6` | `#59636e` | `#9198a1` | `#768390` |

### Cores de linguagem

São as do Linguist, tratadas como dado e não como decoração: vêm com o dado da
linguagem e nunca são usadas para colorir UI. Ficam em
`devprofile-web/src/app/utils/lang-colors.ts`, em um lugar só, porque são consumidas
por template e não por folha de estilo.

### Regras de uso

- Verde é só de ação primária e de sucesso. Nunca decorativo.
- Vermelho é só de erro e de destrutivo.
- Azul é link, foco, estado selecionado e valor em destaque.
- Amarelo é só aviso, inclusive rate limit da API do GitHub.
- Cor nunca é o único indicador: sempre acompanha texto ou ícone.

---

## Tipografia

| Papel | Fonte | Tamanho | Peso |
| --- | --- | --- | --- |
| Score | Mona Sans | 60px, `clamp(44px, 7vw, 60px)` | 800 |
| Display de página | Mona Sans | `clamp(28px, 4vw, 40px)` | 700 |
| Título de seção | Mona Sans | 26px | 600 |
| Título de Box | pilha do sistema | 14px | 600 |
| Corpo | pilha do sistema | 14px | 400 |
| Metadado, legenda | pilha do sistema | 12px | 400 |
| Código, JSON, `kbd` | mono do sistema | 12px | 400 |

- Pilha do corpo: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`.
- Pilha mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`.
- `line-height` 1.5 no corpo, 1.25 em títulos, 0.9 no score.
- Toda métrica usa `font-variant-numeric: tabular-nums`.
- `letter-spacing` só em display negativo: -0.01em nos títulos, -0.04em no score.
- Outfit e JetBrains Mono saem do projeto: eram carregadas de CDN e ficam fora da tese.

---

## Espaço, forma e elevação

| Token | Valor | Uso |
| --- | --- | --- |
| `$space-1` a `$space-6` | 4, 8, 12, 16, 24, 32px | Grade de 8px, com 4px só para pares ícone/texto |
| `$radius-sm` | 4px | Célula de grade, `kbd` |
| `$radius-md` | 6px | Box, botão, input, flash. O raio padrão |
| `$radius-full` | 2em | Label, Counter, badge de estado |
| `$control-h` | 32px | Altura de botão e de input |
| `$border-w` | 1px | Sempre sólida |
| `--shadow-resting` | `0 1px 0 rgba(31,35,40,.04)` no light, nenhuma no dark e no dimmed | Único nível de elevação de repouso |
| `--shadow-overlay` | `0 8px 24px` | Só para overlay real: menu, diálogo |

Sem glassmorphism, sem gradiente de fundo, sem sombra colorida, sem glow. A hierarquia
vem de borda e de superfície.

---

## Movimento

| Token | Valor | Uso |
| --- | --- | --- |
| `$dur-fast` | 80ms | Hover de cor, linear |
| `$dur-normal` | 160ms | Estado, label, foco, expandir |
| `$dur-slow` | 400ms | Score contando e barras crescendo, uma vez por análise |
| `$ease-out` | `cubic-bezier(.22,.61,.36,1)` | Toda entrada |
| `$stagger` | 40ms | Entre barras, teto de 240ms |

Proibido: bounce, elástico, escala em hover, levitação, parallax, scroll hijack,
revelação por scroll, animação de `width`/`height` de container, `will-change`
permanente. Sob `prefers-reduced-motion: reduce`, tudo vai ao estado final em 0ms.

---

## Componentes base

Todos vivem em `styles.scss` como classes globais, no vocabulário do Primer.

| Classe | O que é | Estados |
| --- | --- | --- |
| `.btn` | Botão de 32px, raio 6px, borda 1px | default, hover (só fundo), focus (anel 2px), active, disabled (opacidade .6, `cursor: not-allowed`) |
| `.btn--primary` | Verde de ação, texto branco | idem |
| `.btn--danger` | Texto vermelho, fundo neutro; fica vermelho no hover | idem |
| `.Box` | Card padrão: borda, raio 6px, `--canvas-default` | — |
| `.Box-header` | Cabeçalho em `--canvas-subtle`, 14px/600 | — |
| `.Box-row` | Linha de 16px com divisória `--border-muted` | hover opcional em lista |
| `.Label` | Pílula de borda 1px, 12px | variantes `--accent`, `--success`, `--danger` |
| `.Counter` | Número em pílula `--neutral-muted` | — |
| `.UnderlineNav` | Abas com barra de 2px na ativa, laranja do GitHub (`#fd8c73` / `#f78166` / `#ec775c`) | hover mostra barra `--border-default` |
| `.flash` | Aviso de 1px com ícone | variantes `--warn`, `--danger` |
| `.input` | 32px, raio 6px, foco com anel do acento | focus, disabled, `aria-invalid` |

Regras de estado, sem exceção: todo elemento interativo tem os cinco estados, alvo de
toque de no mínimo 44x44 no mobile, `cursor: pointer`, foco visível, e ícone-só sempre
com `aria-label`.

---

## A assinatura: o bloco de score

O único elemento da tela que não existe no GitHub, e o único lugar onde o sistema
abre exceção de escala.

- Numeral de 60px em Mona Sans 800, tabular, com `/100` em 18px `--fg-muted`.
- Medidor de 25 células de 26px de altura, gap de 3px, raio 4px: a grade de
  contribuições virada de lado. Célula cheia usa `--accent-fg`, a célula de ponta usa
  `opacity: .45`, o resto usa `--neutral-muted`.
- Régua de níveis embaixo, com divisória de 1px: `0 Júnior`, `34 Pleno`, `67 Sênior`.
- Badge do nível ao lado do número, em Label de borda do acento.
- Faixa de composição: a barra de linguagens do repositório, com a legenda dos cinco
  sinais e os pesos.
- Rodapé de quatro estatísticas em `.stat-grid`, divididas por borda.
- Entrada: conta de 0 até o valor em 400ms com `$ease-out`, uma vez por análise.

Qualquer outra tela usa a escala normal do Primer. Se um segundo elemento quiser
numeral gigante, ele está fora do sistema.

---

## As duas exceções ao "nenhum hex fora do tema"

1. `utils/lang-colors.ts`: a paleta do Linguist é dado que vem junto da linguagem.
2. `card-generator.ts`: o card é exportado como imagem e pode usar um tema diferente do
   app, então não pode depender das custom properties da página. Os valores são os mesmos
   três temas desta página, copiados literalmente.

Qualquer outro hex no código é erro.

## Checklist de entrega (roda a cada tela)

- [ ] Nenhum hex fora deste arquivo, de `_theme.scss` e das duas exceções acima
- [ ] Contraste de texto >= 4.5:1 nos três temas
- [ ] Cinco estados em todo elemento interativo
- [ ] Foco visível, ordem de tab igual à visual
- [ ] `aria-label` em botão de ícone, `alt` em imagem com conteúdo
- [ ] `prefers-reduced-motion` respeitado
- [ ] Sem animação de propriedade de layout
- [ ] Responsivo em 375, 768, 1024 e 1440px, sem rolagem horizontal
- [ ] Tabela ou texto alternativo para todo gráfico
