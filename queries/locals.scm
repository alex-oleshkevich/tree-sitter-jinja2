; Macro creates a new scope with parameters
(macro_statement) @local.scope

(macro_open
  name: (identifier) @local.definition.function
  (#set! definition.function.scope "parent"))

(parameter
  name: (identifier) @local.definition.parameter)

; For loop creates scope for loop variables
(for_statement) @local.scope

(for_open
  target: (identifier) @local.definition.variable)

(for_open
  target: (unpacking
    (identifier) @local.definition.variable))

; With statement creates scope for assignments
(with_statement) @local.scope

(with_open
  (with_arguments
    (assignment
      name: (identifier) @local.definition.variable)))

(with_open
  (with_arguments
    (assignment
      name: (unpacking
        (identifier) @local.definition.variable))))

; Call block creates scope for caller args
(call_block) @local.scope

(caller_args
  name: (identifier) @local.definition.parameter)

; Set statement defines variables (leaks into enclosing scope)
(set_statement
  (assignment
    name: (identifier) @local.definition.variable)
  (#set! definition.variable.scope "parent"))

(set_statement
  (assignment
    name: (unpacking
      (identifier) @local.definition.variable))
  (#set! definition.variable.scope "parent"))

; Set block defines variable (leaks into enclosing scope)
(set_block_open
  target: (identifier) @local.definition.variable
  (#set! definition.variable.scope "parent"))

; Trans variables
(trans_open
  (trans_arguments
    (assignment
      name: (identifier) @local.definition.variable)))

; Import defines aliases
(import_statement
  alias: (identifier) @local.definition.variable)

; When imported without alias, name is the local binding
(from_statement
  (import_name
    name: (identifier) @local.definition.variable
    !alias))

; When imported with alias, only alias is the local binding
(from_statement
  (import_name
    alias: (identifier) @local.definition.variable))

; Variable references
(identifier) @local.reference
