(macro_statement
  (macro_open
    name: (identifier) @name)) @definition.function

(block_statement
  (block_open
    name: (identifier) @name)) @definition.module

(set_statement
  (assignment
    name: (identifier) @name)) @definition.variable

(set_block
  (set_block_open
    target: (identifier) @name)) @definition.variable

(import_statement
  alias: (identifier) @name) @definition.variable

(from_statement
  (import_name
    name: (identifier) @name)) @definition.variable

(from_statement
  (import_name
    alias: (identifier) @name)) @definition.variable
