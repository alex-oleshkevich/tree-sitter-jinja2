; Functions (macros)
(macro_statement) @function.outer
(macro_statement
  (macro_open) . (_)* . (macro_close)) @function.inner

; Parameters
(parameter) @parameter.outer
(parameter name: (identifier) @parameter.inner)

; Conditionals
(if_statement) @conditional.outer
(if_statement
  (if_open) . (_)* . (if_close)) @conditional.inner

; Loops
(for_statement) @loop.outer
(for_statement
  (for_open) . (_)* . (for_close)) @loop.inner

; Generic blocks
(block_statement) @block.outer
(block_statement
  (block_open) . (_)* . (block_close)) @block.inner

(call_block) @block.outer
(call_block
  (call_open) . (_)* . (call_close)) @block.inner

(with_statement) @block.outer
(with_statement
  (with_open) . (_)* . (with_close)) @block.inner

(trans_statement) @block.outer
(autoescape_statement) @block.outer
(raw_statement) @block.outer
(filter_statement) @block.outer
(set_block) @block.outer

(custom_statement) @block.outer
(custom_statement
  (custom_open) . (_)* . (custom_close)) @block.inner

; Comments
(comment) @comment.outer
(comment_content) @comment.inner
