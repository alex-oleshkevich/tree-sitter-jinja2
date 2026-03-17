; Block openers - increase indent
(if_open) @indent.begin
(for_open) @indent.begin
(block_open) @indent.begin
(macro_open) @indent.begin
(call_open) @indent.begin
(with_open) @indent.begin
(trans_open) @indent.begin
(autoescape_open) @indent.begin
(raw_open) @indent.begin
(filter_open) @indent.begin
(set_block_open) @indent.begin

; Block closers - decrease indent
(if_close) @indent.end
(for_close) @indent.end
(block_close) @indent.end
(macro_close) @indent.end
(call_close) @indent.end
(with_close) @indent.end
(trans_close) @indent.end
(autoescape_close) @indent.end
(raw_close) @indent.end
(filter_close) @indent.end
(set_block_close) @indent.end

; Intermediate clauses - dedent then indent
(elif_clause) @indent.end @indent.begin
(else_clause) @indent.end @indent.begin
(pluralize_clause) @indent.end @indent.begin

; Custom tags
(custom_open) @indent.begin
(custom_close) @indent.end
