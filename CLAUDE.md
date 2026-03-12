# Tree-sitter Jinja Grammar Development Guide

## Project Overview
This is a tree-sitter grammar for Jinja2 templating language, intended for LSP (Language Server Protocol) integration. The grammar parses Jinja expressions within `{{ }}` blocks.

## Current Status

### Working Features ✓
- **Literals**: strings, numbers, booleans, none
- **Identifiers and attribute access**: `user.name.first`
- **Function calls**: `range(10)`, with args and kwargs
- **Method calls**: `user.get_name()`, with args and kwargs
- **Binary expressions**: all operators (when no filters in grammar)
- **Unary expressions**: `not`, `-`, `+`
- **Ternary expressions**: `value if condition else alternative`
- **Subscript access**: `items[0]`, `dict['key']`, chained `matrix[0][1]`
- **Keyword arguments (kwargs)**: `func(key=value)`, `method(to='admin', subject='Hello')`
- **Keywords**: Named rules for highlighting (`keyword_if`, `keyword_and`, etc.)
- **Parenthesized expressions**: `(1 + 2) * 3`

### Fully Working ✓
- **Filters**: `{{ value | upper }}`, chained filters, filters with args/kwargs
- **Binary expressions**: All operators with proper precedence

## Filter/Binary Expression Conflict - SOLVED ✓

### The Problem (Historical)
When `filtered_expression` was in `primary_expression` with `optional($._whitespace)` before `|`, binary expressions with spaces created ERROR nodes because the parser couldn't decide between filter and binary operator paths.

### The Solution
Two key changes fixed the issue:

1. **Move `filtered_expression` to `expression` level** (not `primary_expression`)
2. **Use `token(prec(11, seq(optional(/\s+/), '|')))` for the pipe operator**

This creates a high-precedence token that greedily captures optional whitespace followed by `|`, preventing ambiguity with binary operators.

### Working Implementation
```javascript
filtered_expression: $ => prec.left(10, seq(
  field('value', choice(
    $.primary_expression,
    $.binary_expression,
    $.unary_expression,
    $.ternary_expression,
  )),
  repeat1(seq(
    token(prec(11, seq(optional(/\s+/), '|'))),  // Key: greedy token with high precedence
    optional($._whitespace),
    field('filter', $.filter)
  ))
)),

expression: $ => choice(
  $.primary_expression,
  $.binary_expression,
  $.unary_expression,
  $.ternary_expression,
  $.filtered_expression,  // At expression level, not primary
),
```

### Why It Works
- `token(prec(11, ...))` creates a single lexer token with high precedence
- The lexer greedily matches `\s*|` as one unit before the parser decides
- This prevents the parser from consuming whitespace separately and then being confused about what follows
- Filters can now accept any expression type as input (binary, unary, ternary)

## Test Status
- **110 tests passing** ✓
- All binary expressions work
- All filter variations work (`name|upper`, `name | upper`, `name| upper`)
- All keyword argument tests pass
- All subscript tests pass
- All attribute access tests pass

## Grammar Architecture

### Precedence Levels
```
0: Ternary expression (lowest)
1: Logical OR, filtered_expression (CONFLICT!)
2: Logical AND
3: Comparisons, membership, identity
4: String concatenation
5: Addition/Subtraction
6: Multiplication/Division/Modulo
7: Power (right associative)
8: Unary expressions
9: Attribute/Subscript access (highest)
```

### Expression Hierarchy
```
expression
├── primary_expression
│   ├── literal (string, number, boolean, none)
│   ├── identifier
│   ├── parenthesized_expression
│   ├── attribute_access (precedence 9)
│   ├── subscript_access (precedence 9)
│   ├── function_call
│   ├── method_call
│   └── filtered_expression (PROBLEMATIC)
├── binary_expression (precedence 1-7)
├── unary_expression (precedence 8)
└── ternary_expression (precedence 0)
```

### Field Annotations
Field annotations are used for selective node access in LSP:
- `attribute_access`: `object`, `attribute`
- `subscript_access`: `object`, `index`
- `function_call`: `name`
- `method_call`: `object`
- `keyword_argument`: `name`, `value`
- `filter`: `name`
- `filtered_expression`: `value`, `filter`
- `ternary_expression`: `value`, `condition`, `alternative`

## Key Grammar Concepts

### Keyword vs Identifier
```javascript
word: $ => $.identifier,  // Sets word boundary

keyword_if: $ => 'if',
keyword_and: $ => 'and',
// etc...
```

This allows keywords to be highlighted separately while maintaining word boundaries.

### Conflicts Declaration
```javascript
conflicts: $ => [
  [$.binary_expression, $.ternary_expression],
  [$.keyword_argument, $.primary_expression],
  // [$.binary_expression, $.filtered_expression],  // Marked unnecessary
],
```

### Whitespace Handling
- `_whitespace: $ => /[ \t\n\r]+/` (hidden with underscore prefix)
- Most rules have `optional($._whitespace)` between tokens
- **Problem**: Trailing spaces before `}}` sometimes create ERROR nodes

## Keyword Arguments (kwargs)

Successfully implemented with proper field annotations:
```javascript
keyword_argument: $ => seq(
  field('name', $.identifier),
  optional($._whitespace),
  '=',
  optional($._whitespace),
  field('value', $.expression)
),

argument: $ => choice(
  $.keyword_argument,  // Check first for greedy matching
  $.expression
),
```

Works in:
- Function calls: `{{ range(10, step=2) }}`
- Method calls: `{{ user.send_email(to='admin', subject='Hello') }}`
- Filters (when fixed): `{{ text | replace(old='foo', new='bar') }}`

## Filter Implementation

### Builtin Filters
40+ Jinja2 built-in filters for separate highlighting:
```javascript
builtin_filter: $ => choice(
  // String filters
  'upper', 'lower', 'capitalize', 'title', 'trim', 'truncate', 'wordwrap',
  'wordcount', 'replace', 'format', 'indent', 'escape', 'forceescape',
  'safe', 'striptags', 'urlize', 'center', 'string',
  // Number filters
  'abs', 'round', 'int', 'float', 'sum',
  // List/Dict filters
  'length', 'count', 'first', 'last', 'random', 'join', 'sort',
  'reverse', 'unique', 'list', 'slice', 'batch', 'groupby',
  'select', 'reject', 'selectattr', 'rejectattr', 'map', 'min', 'max',
  'items', 'dictsort', 'attr',
  // Other filters
  'default', 'filesizeformat', 'pprint', 'tojson', 'xmlattr', 'urlencode'
),
```

### Filter Structure
```javascript
filter: $ => choice(
  // Simple filter
  field('name', choice($.builtin_filter, $.identifier)),
  // Filter with arguments
  seq(
    field('name', choice($.builtin_filter, $.identifier)),
    '(',
    optional($._whitespace),
    optional($.argument_list),
    optional($._whitespace),
    ')'
  )
),
```

## Development Commands

```bash
# Generate parser
npx tree-sitter generate

# Run tests
npx tree-sitter test

# Update test expectations
npx tree-sitter test -u

# Parse a file
npx tree-sitter parse <file>

# Remove trailing spaces from test files (common issue)
sed -i 's/ }}/}}/g' test/corpus/*.txt
```

## Test Corpus Format

```
=====
Test name - description
=====

{{ test_input }}

---

(source_file
  (text)
  (output
    (expression
      (primary_expression
        (identifier))))
  (text))
```

**Note**: Field annotations don't show in simplified test output but are present in actual parse trees.

## Files Structure

```
tree-sitter-jinja/
├── grammar.js              # Main grammar definition
├── src/
│   ├── parser.c           # Generated parser (do not edit)
│   ├── grammar.json       # Generated (do not edit)
│   └── node-types.json    # Generated (do not edit)
├── test/corpus/           # Test files
│   ├── attribute.txt
│   ├── binary_expression.txt
│   ├── function_call.txt   # Includes keyword argument tests
│   ├── method_call.txt     # Includes keyword argument tests
│   ├── filter.txt          # Filter tests (partially working)
│   ├── subscript.txt
│   └── ...
├── queries/
│   └── highlights.scm     # Syntax highlighting queries
├── sample.html.j2         # Comprehensive sample file
├── HIGHLIGHTING.md        # Highlighting documentation
└── CLAUDE.md             # This file

```

## Next Steps

1. **Fix filter/binary expression conflict** (PRIORITY)
   - Research other template language grammars
   - Try alternative precedence strategies
   - Consider restructuring expression hierarchy

2. **Future features** (after filters work):
   - Slice notation: `list[1:3]`, `list[::2]`
   - List literals: `[1, 2, 3]`
   - Dict literals: `{'key': 'value'}`
   - Set literals: `{1, 2, 3}`
   - Statement parsing (currently regex)
   - Control structures: `{% if %}`, `{% for %}`, etc.

## Resources

- [Tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/)
- [Jinja2 documentation](https://jinja.palletsprojects.com/)
- [GLR parsing](https://en.wikipedia.org/wiki/GLR_parser)
- Grammar conflicts: When multiple parse trees are valid, tree-sitter uses GLR to explore both
