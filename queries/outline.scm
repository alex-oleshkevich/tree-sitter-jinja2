(block_statement
  (block_open
    (block_keyword) @context
    name: (identifier) @name)) @item

(macro_statement
  (macro_open
    (macro_keyword) @context
    name: (identifier) @name)) @item

(set_statement
  (set_keyword) @context
  (assignment
    name: (identifier) @name)) @item

(set_statement
  (set_keyword) @context
  (assignment
    name: (unpacking
      (identifier) @name))) @item

(set_block
  (set_block_open
    (set_keyword) @context
    target: (identifier) @name)) @item

(call_block
  (call_open
    (call_keyword) @context
    call: (function_call
      name: (identifier) @name))) @item

(call_block
  (call_open
    (call_keyword) @context
    call: (method_call
      method: (identifier) @name))) @item

(filter_statement
  (filter_open
    (filter_keyword) @context
    filter: (identifier) @name)) @item

(filter_statement
  (filter_open
    (filter_keyword) @context
    filter: (function_call
      name: (identifier) @name))) @item

(filter_statement
  (filter_open
    (filter_keyword) @context
    filter: (filter
      name: (identifier) @name))) @item

(with_statement
  (with_open
    (with_keyword) @context
    (with_arguments
      (assignment
        name: (identifier) @name)))) @item

(with_statement
  (with_open
    (with_keyword) @context
    (with_arguments
      (assignment
        name: (unpacking
          (identifier) @name))))) @item

(for_statement
  (for_open
    (for_keyword) @context
    target: (identifier) @name)) @item

(for_statement
  (for_open
    (for_keyword) @context
    target: (unpacking
      (identifier) @name))) @item

(if_statement
  (if_open
    (if_keyword) @context
    condition: (_) @name)) @item

(extends_statement
  (extends_keyword) @context
  template: (_) @name) @item

(import_statement
  (import_keyword) @context
  alias: (identifier) @name) @item

(from_statement
  (from_keyword) @context
  template: (_) @name) @item
