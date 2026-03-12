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
