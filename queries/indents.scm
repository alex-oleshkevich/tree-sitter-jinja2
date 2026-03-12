; Block openers - increase indent
(if_open) @indent
(for_open) @indent
(block_open) @indent
(macro_open) @indent
(call_open) @indent
(with_open) @indent
(trans_open) @indent
(autoescape_open) @indent
(raw_open) @indent
(filter_open) @indent
(set_block_open) @indent

; Block closers - decrease indent
(if_close) @end
(for_close) @end
(block_close) @end
(macro_close) @end
(call_close) @end
(with_close) @end
(trans_close) @end
(autoescape_close) @end
(raw_close) @end
(filter_close) @end
(set_block_close) @end

; Intermediate clauses - dedent then indent
(elif_clause) @end @indent
(else_clause) @end @indent
(pluralize_clause) @end @indent

; Custom tags
(custom_open) @indent
(custom_close) @end
