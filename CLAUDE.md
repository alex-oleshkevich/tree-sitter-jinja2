# Tree-sitter Jinja2 Grammar — Developer Notes

## Overview

Tree-sitter grammar for Jinja2. Intended for LSP integration (goto-definition,
rename, hover). Parses the full Jinja2 template language including expressions,
statements, and text content.

## Current Status

273 tests passing. All language features implemented.

## Grammar Architecture

### Precedence Levels

```
0:  ternary_expression   (lowest)
1:  binary OR
2:  binary AND
3:  not (unary)
4:  comparisons, membership (in, not in), identity (is, is not)
5:  string concatenation (~), addition, subtraction
6:  multiplication, division, floor division, modulo
7:  power (right-associative)
8:  unary minus/plus
9:  attribute_access, subscript, method_call, function_call
10: filter
11: pipe token (lexer precedence for \s*| token)
```

### Expression Hierarchy

```
_expression
├── _primary_expression
│   ├── _literal (string, number, boolean, none)
│   ├── identifier
│   ├── parenthesized_expression
│   ├── list, tuple, dict
│   ├── attribute_access     (prec 9)
│   ├── subscript            (prec 9)
│   ├── function_call        (prec 9)
│   └── method_call          (prec 9)
├── binary_expression        (prec 1-7)
├── unary_expression         (prec 3, 8)
├── test_expression          (prec 4)
├── ternary_expression       (prec 0)
└── filter                   (prec 10)
```

### Filter Design

Filters are flat. `x | a | b` produces one `filter` node with multiple `filter:`
fields, not nested nodes. This is consistent with `filter_open` and `set_block_open`.

```
(filter
  value: (identifier)        ← x
  filter: (filter_name       ← a
    name: (identifier))
  filter: (filter_name       ← b
    name: (identifier)))
```

The filter's `value:` field is restricted to `_primary_expression`. This correctly
models Jinja2 precedence: `|` binds tighter than binary operators, so
`a + b | upper` parses as `a + (b | upper)`. To filter a binary expression, use
parentheses: `(a + b) | upper`.

The pipe token `token(prec(11, seq(optional(/\s+/), '|')))` greedily consumes
optional whitespace before `|` as a single high-precedence lexer token.

### Keywords

The `word: $ => $.identifier` property enables tree-sitter keyword extraction.
All keyword rules are plain strings (`'for'`, `'if'`, etc.) with no `token(prec(...))`
wrapper. The lexer automatically gives string literals matching the word pattern
priority over the `identifier` token.

The exception is `custom_close`, which uses a regex (`/end[a-zA-Z_][a-zA-Z0-9_]*/`)
and therefore needs an explicit `token(prec(1, ...))`.

### `filter_name` Rule

Filter names appear in three grammar positions. All three use `filter_name`:

- Inline: `{{ x | upper }}` → `filter.filter: (filter_name name: (identifier))`
- Block: `{% filter upper %}` → `filter_open.filter: (filter_name ...)`
- Set block: `{% set x | upper %}` → `set_block_open.filter: (filter_name ...)`

This means `(filter_name name: (identifier) @fn)` captures all filter usages.

### `raw` Blocks

`{% raw %}...{% endraw %}` requires a hand-written C scanner (`src/scanner.c`).
The external scanner reads character by character and stops only when it sees
`{%[-]?\s*endraw` — this is the only way to suppress Jinja2 parsing inside `raw`
including `{%` sequences.

### Custom Tags

`custom_open` / `custom_close` handle unknown paired tags like `{% component %}...{% endcomponent %}`.
`custom_open` uses `prec(-2)` and `custom_close` uses `prec(-1)` so known statement
rules win. `custom_close` matches `/end[a-zA-Z_][a-zA-Z0-9_]*/`.

### `_call_attr_chain` / `_call_target`

`call_open` (`{% call %}`) uses private `_call_attr_chain` / `_call_target` rules
instead of the real `attribute_access` / `method_call`. This is intentional:
`caller_args` starts with `(`, which creates cascading GLR conflicts with
`_primary_expression`, `tuple`, and `list` if the real rules are used directly.
The private rules restrict the call target to identifier chains, which is what
Jinja2 actually allows in `{% call %}`.

## Conflicts

```javascript
[$._primary_expression, $.unpacking],       // (a, b) tuple vs unpacking
[$.function_call, $._primary_expression],   // fn( ambiguity
[$.subscript, $._expression],               // x[ ambiguity
[$.trans_open, $._literal],                 // trans trimmed/pluralize
[$.filter_name],                            // filter_name optional args
```

## Field Annotations

```
filter:           value, filter
filter_name:      name
function_call:    name
method_call:      object, method
attribute_access: object, attribute
subscript:        object, index
slice:            start, stop, step
ternary_expression: value, condition, alternative
test_expression:  value, test
binary_expression: left, operator, right
assignment:       name, value
parameter:        name, default
keyword_argument: name, value
for_open:         target, iterable, condition
if_open:          condition
macro_open:       name
block_open:       name
set_block_open:   target, filter
filter_open:      filter
call_open:        call
```

## Development Commands

```bash
tree-sitter generate    # regenerate parser after editing grammar.js
tree-sitter test        # run tests
tree-sitter test -u     # update test snapshots
tree-sitter parse <file>
```

## Test Corpus Format

```
================================================================================
Test name
================================================================================
{{ input }}
--------------------------------------------------------------------------------

(source_file
  (print
    (print_begin)
    ...
    (print_end)))
```

Tests live in `test/corpus/`. Field annotations appear in `tree-sitter parse`
output but are optional in corpus expectations.
