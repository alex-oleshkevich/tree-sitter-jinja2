# tree-sitter-jinja2

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [Jinja2](https://jinja.palletsprojects.com/) templating language.

## What it parses

The grammar handles both expression blocks (`{{ }}`) and statement blocks (`{% %}`), producing a full AST suitable for editor tooling.

Supported language features:

- Literals: strings, numbers, booleans, `none`, lists, dicts, tuples
- Expressions: attribute access, subscript, function/method calls, filters, tests, ternary
- Operators: arithmetic, comparison, logical, membership (`in`, `not in`), string concatenation (`~`)
- Statements: `if`/`elif`/`else`, `for`/`else`, `set`, `set` blocks, `block`, `macro`, `call`, `with`, `include`, `import`, `from`, `trans`/`pluralize`, `do`, `filter`, `autoescape`, `raw`, `debug`, `extends`
- Whitespace trimming: `{%- -%}`, `{{- -}}`, `{#- -#}`
- Custom extension tags (paired open/close)
- Comments

## Editor integration

The `queries/` directory contains:

| File | Purpose |
|------|---------|
| `highlights.scm` | Syntax highlighting |
| `locals.scm` | Variable definitions and references (goto-definition, rename) |
| `textobjects.scm` | Text object motions (select function, parameter, block, etc.) |
| `indents.scm` | Auto-indentation |
| `folds.scm` | Code folding |
| `outline.scm` | Symbol list (blocks, macros, set variables) |
| `brackets.scm` | Bracket matching |

These follow [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) conventions.

## Installation

### Node.js

```sh
npm install tree-sitter-jinja2
```

```js
const Parser = require('tree-sitter');
const Jinja2 = require('tree-sitter-jinja2');

const parser = new Parser();
parser.setLanguage(Jinja2);
const tree = parser.parse('{{ user.name | upper }}');
```

### Rust

```toml
[dependencies]
tree-sitter-jinja2 = "0.1"
```

### Python

```sh
pip install tree-sitter-jinja2
```

Bindings for C, Go, and Swift are in the `bindings/` directory.

## Supported file types

`.jinja2`, `.jinja`, `.j2`, `.html.j2`, `.js.j2`, `.css.j2`, `.yaml.j2`, `.yml.j2`

## Development

```sh
npm install

# Regenerate parser after editing grammar.js
npx tree-sitter generate

# Run tests
npx tree-sitter test

# Update test snapshots
npx tree-sitter test -u

# Parse a file
npx tree-sitter parse example.html.j2
```

Tests are in `test/corpus/` using tree-sitter's corpus format.

## Notes

**`|` is always a filter operator.** Jinja2 has no bitwise OR, so `|` unambiguously means filter. The lexer uses a high-precedence token to greedily consume optional whitespace before `|`, which prevents conflicts with binary expressions.

**No host language injection.** The grammar parses Jinja2 syntax only. Editors that support language injection (Neovim, Helix, Zed) can layer HTML, CSS, or JavaScript parsing on top.

**`raw` blocks use an external scanner.** The `{% raw %}...{% endraw %}` construct must suppress all Jinja2 parsing inside, including `{%` sequences. This requires a hand-written C scanner (`src/scanner.c`) rather than a regex rule.

**GLR for genuine ambiguities.** A few constructs are structurally ambiguous — for example, `(a, b)` as a tuple vs. a parenthesized expression. Tree-sitter's GLR parser explores both paths; the conflicts are declared explicitly in `grammar.js`.

## License

MIT
