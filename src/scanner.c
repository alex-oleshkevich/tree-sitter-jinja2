#include "tree_sitter/parser.h"
#include <stdbool.h>

enum TokenType {
  RAW_CONTENT,
};

void *tree_sitter_jinja2_external_scanner_create() { return NULL; }
void tree_sitter_jinja2_external_scanner_destroy(void *p) { (void)p; }
unsigned tree_sitter_jinja2_external_scanner_serialize(void *p, char *buf) { (void)p; (void)buf; return 0; }
void tree_sitter_jinja2_external_scanner_deserialize(void *p, const char *buf, unsigned n) { (void)p; (void)buf; (void)n; }

// Returns true if the lexer (positioned after '{%') is looking at '[-]?\s*endraw'.
// Advances the lexer past the matched prefix on both true and false returns.
static bool scan_endraw(TSLexer *lexer) {
  if (lexer->lookahead == '-') {
    lexer->advance(lexer, false);
  }
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
         lexer->lookahead == '\n' || lexer->lookahead == '\r') {
    lexer->advance(lexer, false);
  }
  const char *kw = "endraw";
  for (int i = 0; kw[i] != '\0'; i++) {
    if (lexer->eof(lexer) || lexer->lookahead != (int32_t)kw[i]) {
      return false;
    }
    lexer->advance(lexer, false);
  }
  return true;
}

bool tree_sitter_jinja2_external_scanner_scan(
  void *payload,
  TSLexer *lexer,
  const bool *valid_symbols
) {
  (void)payload;
  if (!valid_symbols[RAW_CONTENT]) return false;

  bool has_content = false;

  while (!lexer->eof(lexer)) {
    if (lexer->lookahead == '{') {
      lexer->advance(lexer, false);
      if (!lexer->eof(lexer) && lexer->lookahead == '%') {
        lexer->advance(lexer, false);
        if (scan_endraw(lexer)) {
          if (!has_content) return false;
          lexer->result_symbol = RAW_CONTENT;
          return true;
        }
      }
      lexer->mark_end(lexer);
      has_content = true;
    } else {
      lexer->advance(lexer, false);
      lexer->mark_end(lexer);
      has_content = true;
    }
  }

  if (has_content) {
    lexer->result_symbol = RAW_CONTENT;
    return true;
  }
  return false;
}
