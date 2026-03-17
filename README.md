# tree-sitter-jinja2

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [Jinja2](https://jinja.palletsprojects.com/) templating language, designed for LSP integration and syntax highlighting.

## Features

### LSP / Editor Integration

- **Syntax highlighting** (`queries/highlights.scm`) — keywords, operators, strings, builtins, variables, properties, comments
- **Scope tracking** (`queries/locals.scm`) — variable definitions and references for goto-definition
- **Code folding** (`queries/folds.scm`) — `if`, `for`, `block`, `macro`, and other block structures
- **Indentation hints** (`queries/indents.scm`) — automatic indent/dedent around block openers/closers
- **Symbol outline** (`queries/outline.scm`) — blocks, macros, and `set` variables
- **Bracket matching** (`queries/brackets.scm`)
- **Text objects** (`queries/textobjects.scm`)

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
# Cargo.toml
[dependencies]
tree-sitter-jinja2 = "0.1"
```

### Python

```sh
pip install tree-sitter-jinja2
```

### Other

Bindings are also available for **C**, **Go**, and **Swift**. See the `bindings/` directory.

## Supported File Types

The grammar is registered for these extensions by default:

`.jinja2`, `.jinja`, `.j2`, `.html.j2`, `.js.j2`, `.css.j2`, `.yaml.j2`, `.yml.j2`

## Development

```sh
# Install dependencies
npm install

# Generate parser from grammar.js
npx tree-sitter generate

# Run all tests
npx tree-sitter test

# Update test expectations
npx tree-sitter test -u

# Parse a file
npx tree-sitter parse sample.html.j2

# Launch playground (WASM)
npm start
```

Tests live in `test/corpus/` in tree-sitter's corpus format.

## Tradeoffs

**Filter/binary operator ambiguity** — The `|` character is both a filter operator and (in some template contexts) a potential bitwise operator. The grammar resolves this by using a high-precedence lexer token `token(prec(11, seq(optional(/\s+/), '|')))` that greedily captures optional whitespace followed by `|`. This means `|` is always treated as a filter, not a bitwise OR — consistent with Jinja2 semantics but unlike Python.

**Expression-only parsing for `{{ }}`** — The grammar fully parses the AST for output expressions. Statement blocks (`{% %}`) are also fully parsed. This makes the grammar suitable for LSP but means the parser is more complex than a simple regex-based tokenizer.

**Conflict resolution via GLR** — Several grammar constructs are genuinely ambiguous (e.g., `(a, b)` as a tuple vs. parenthesized expression, `a[b]` as subscript vs. primary). Tree-sitter's GLR parser explores both paths; conflicts are declared explicitly and resolved by precedence rules. This is correct but has a minor performance cost compared to a purely LALR grammar.

**No host language injection** — The grammar parses Jinja2 syntax but does not inject the surrounding host language (HTML, CSS, JS, etc.). Editor plugins that support injections can layer this on top.

**Keywords are identifiers at the lexer level** — Jinja2 keywords (`if`, `for`, `in`, etc.) are valid variable names in some positions. The grammar uses tree-sitter's `word` rule and per-keyword named nodes to handle this without breaking identifier parsing.

## License

MIT
