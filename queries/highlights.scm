; Keywords
[
  (if_keyword)
  (elif_keyword)
  (else_keyword)
  (endif_keyword)
  (for_keyword)
  (in_keyword)
  (endfor_keyword)
  (recursive_keyword)
  (extends_keyword)
  (block_keyword)
  (endblock_keyword)
  (scoped_keyword)
  (required_keyword)
  (include_keyword)
  (ignore_keyword)
  (missing_keyword)
  (with_keyword)
  (without_keyword)
  (context_keyword)
  (macro_keyword)
  (endmacro_keyword)
  (import_keyword)
  (from_keyword)
  (as_keyword)
  (set_keyword)
  (endset_keyword)
  (call_keyword)
  (endcall_keyword)
  (endwith_keyword)
  (trans_keyword)
  (endtrans_keyword)
  (pluralize_keyword)
  (trimmed_keyword)
  (do_keyword)
  (autoescape_keyword)
  (endautoescape_keyword)
  (raw_keyword)
  (endraw_keyword)
  (debug_keyword)
  (filter_keyword)
  (endfilter_keyword)
] @keyword

(is_keyword) @keyword.operator
(not_keyword) @keyword.operator

; Operators
(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)

"|" @operator

; Punctuation - Delimiters
(statement_begin) @punctuation.bracket
(statement_end) @punctuation.bracket
(print_begin) @punctuation.bracket
(print_end) @punctuation.bracket
(comment_begin) @punctuation.bracket
(comment_end) @punctuation.bracket

"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket

"," @punctuation.delimiter
":" @punctuation.delimiter
"." @punctuation.delimiter

; Literals
(string) @string
(number) @number
(boolean) @constant.builtin
(none) @constant.builtin

; Comments
(comment) @comment
(comment_content) @comment

; Functions and methods
(function_call name: (identifier) @function.call)
(function_call name: (function_call name: (identifier) @function.call))
(method_call method: (identifier) @function.method.call)

; Macro definitions
(macro_open name: (identifier) @function)
(macro_close name: (identifier) @function)

; Block names
(block_open name: (identifier) @label)
(block_close name: (identifier) @label)

; Filter names
(filter_name name: (identifier) @function.call)

; Template references
(extends_statement template: (_) @string)
(include_statement template: (_) @string)
(import_statement template: (_) @string)
(from_statement template: (_) @string)

; Test expressions
(test_expression test: (identifier) @function.builtin)
(test_expression test: (function_call name: (identifier) @function.builtin))

; Variables and parameters
(parameter name: (identifier) @variable.parameter)
(caller_args name: (identifier) @variable.parameter)
(for_open target: (identifier) @variable)
(for_open target: (unpacking (identifier) @variable))

; Definition and binding targets
(set_block_open target: (identifier) @variable)
(assignment name: (identifier) @variable)
(assignment name: (unpacking (identifier) @variable))
(assignment name: (attribute_access object: (identifier) @variable))
(assignment name: (attribute_access attribute: (identifier) @property))
(import_name name: (identifier) @variable)
(import_name alias: (identifier) @variable)
(import_statement alias: (identifier) @variable)

; Keyword arguments
(keyword_argument name: (identifier) @variable.parameter)
(keyword_argument "=" @operator)

; Attribute access
(attribute_access attribute: (identifier) @property)
(attribute_access object: (identifier) @variable)

; Subscript
(subscript object: (identifier) @variable)

; Dict keys (when identifier)
(pair key: (identifier) @property)

; Custom tags
(custom_open name: (identifier) @tag)
(custom_close name: (identifier) @tag)
(custom_open argument: (keyword_argument name: (identifier) @variable.parameter))
(custom_open argument: (identifier) @variable)

; Raw content
(raw_content) @string.special

; General identifiers (lowest priority)
(identifier) @variable
