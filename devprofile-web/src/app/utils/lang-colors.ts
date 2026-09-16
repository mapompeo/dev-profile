/**
 * Cores de linguagem do Linguist, o mesmo mapa que o GitHub usa.
 * É dado, não decoração: só colore linguagem, nunca elemento de interface.
 */
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  'C#': '#178600',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Python: '#3572a5',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Shell: '#89e051',
  Dart: '#00b4ab',
  Kotlin: '#a97bff',
  Swift: '#f05138',
  'C++': '#f34b7d',
  C: '#555555',
  Vue: '#41b883',
  Dockerfile: '#384d54',
  Elixir: '#6e4a7e',
  Lua: '#000080',
  'Jupyter Notebook': '#da5b0b',
  Makefile: '#427819',
  PowerShell: '#012456',
  Svelte: '#ff3e00'
};

/** Linguagem sem cor no Linguist cai no cinza neutro do tema. */
export function langColor(name: string): string {
  return LANG_COLORS[name] ?? 'var(--fg-subtle)';
}
