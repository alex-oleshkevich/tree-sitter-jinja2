; Block statements
(if_statement) @class.around
(for_statement) @class.around
(block_statement) @class.around
(macro_statement) @function.around
(call_block) @class.around
(with_statement) @class.around
(trans_statement) @class.around
(autoescape_statement) @class.around
(raw_statement) @class.around
(filter_statement) @class.around
(set_block) @class.around

; Comments
(comment) @comment.around
(comment_content) @comment.inside
