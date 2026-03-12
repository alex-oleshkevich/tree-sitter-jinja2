module.exports = grammar({
  name: "jinja2",
  word: $ => $.identifier,
  rules: {
    source_file: $ => repeat($._node),
    _node: $ => choice(
      $.output,
      $.statement,
      $.comment,
      $.text,
    ),
    _whitespace: $ => /\s+/,
    // List literal
    list_literal: $ => seq(
      '[',
      optional($._whitespace),
      optional(seq(
        $.expression,
        repeat(seq(
          optional($._whitespace),
          ',',
          optional($._whitespace),
          $.expression
        )),
        optional(seq(optional($._whitespace), ',', optional($._whitespace)))  // Trailing comma
      )),
      optional($._whitespace),
      ']'
    ),

    // Dict literal
    dict_pair: $ => seq(
      field('key', $.expression),
      optional($._whitespace),
      ':',
      optional($._whitespace),
      field('value', $.expression)
    ),

    dict_literal: $ => seq(
      '{',
      optional($._whitespace),
      optional(seq(
        $.dict_pair,
        repeat(seq(
          optional($._whitespace),
          ',',
          optional($._whitespace),
          $.dict_pair
        )),
        optional(seq(optional($._whitespace), ',', optional($._whitespace)))  // Trailing comma
      )),
      optional($._whitespace),
      '}'
    ),

    // Set literal
    set_literal: $ => seq(
      '{',
      optional($._whitespace),
      $.expression,
      repeat(seq(
        optional($._whitespace),
        ',',
        optional($._whitespace),
        $.expression
      )),
      optional(seq(optional($._whitespace), ',', optional($._whitespace))),  // Trailing comma
      optional($._whitespace),
      '}'
    ),

    // Tuple literal
    tuple_literal: $ => choice(
      // Empty tuple
      seq('(', optional($._whitespace), ')'),
      // Single element with trailing comma
      seq(
        '(',
        optional($._whitespace),
        $.expression,
        optional($._whitespace),
        ',',
        optional($._whitespace),
        ')'
      ),
      // Multiple elements
      seq(
        '(',
        optional($._whitespace),
        $.expression,
        repeat1(seq(
          optional($._whitespace),
          ',',
          optional($._whitespace),
          $.expression
        )),
        optional(seq(optional($._whitespace), ',', optional($._whitespace))),  // Optional trailing comma
        optional($._whitespace),
        ')'
      )
    ),

    literal: $ => choice($.boolean, $.none, $.number, $.string, $.list_literal, $.set_literal, $.dict_literal, $.tuple_literal),

    // objects and attributes
    attribute_access: $ => prec.left(9, seq(
      field('object', $.primary_expression),
      '.',
      field('attribute', $.identifier)
    )),

    // Slice notation
    slice: $ => prec.left(seq(
      optional(field('start', $.expression)),
      optional($._whitespace),
      ':',
      optional($._whitespace),
      optional(field('stop', $.expression)),
      optional(seq(
        optional($._whitespace),
        ':',
        optional($._whitespace),
        optional(field('step', $.expression))
      ))
    )),

    subscript_access: $ => prec.left(9, seq(
      field('object', $.primary_expression),
      '[',
      optional($._whitespace),
      field('index', choice($.slice, $.expression)),
      optional($._whitespace),
      ']'
    )),

    // expressions
    keyword_argument: $ => seq(
      field('name', $.identifier),
      optional($._whitespace),
      '=',
      optional($._whitespace),
      field('value', $.expression)
    ),
    argument: $ => choice(
      $.keyword_argument,
      $.expression
    ),
    argument_list: $ => seq(
      $.argument,
      repeat(seq(',', optional($._whitespace), $.argument)),
    ),

    // Parameters for definitions (macros, filters, etc) - supports positional and keyword
    parameter: $ => prec.right(seq(
      field('name', $.identifier),
      optional(seq(
        optional($._whitespace),
        '=',
        optional($._whitespace),
        field('default', $.expression)
      ))
    )),
    parameter_list: $ => seq(
      $.parameter,
      repeat(seq(
        optional($._whitespace),
        ',',
        optional($._whitespace),
        $.parameter
      )),
      optional(seq(optional($._whitespace), ','))  // trailing comma
    ),
    function_call: $ => prec.left(2, seq(
      field('name', $.identifier),
      '(',
      optional($._whitespace),
      optional($.argument_list),
      optional($._whitespace),
      ')',
    )),
    method_call: $ => prec.left(2, seq(
      field('object', $.attribute_access),
      '(',
      optional($._whitespace),
      optional($.argument_list),
      optional($._whitespace),
      ')'
    )),
    // Keywords
    keyword_if: $ => 'if',
    keyword_elif: $ => token(prec(2, 'elif')),
    keyword_else: $ => 'else',
    keyword_endif: $ => token(prec(2, 'endif')),
    keyword_for: $ => 'for',
    keyword_endfor: $ => 'endfor',
    keyword_break: $ => 'break',
    keyword_continue: $ => 'continue',
    keyword_recursive: $ => 'recursive',
    keyword_extends: $ => 'extends',
    keyword_block: $ => 'block',
    keyword_endblock: $ => 'endblock',
    keyword_scoped: $ => 'scoped',
    keyword_required: $ => 'required',
    keyword_super: $ => 'super',
    keyword_macro: $ => 'macro',
    keyword_endmacro: $ => 'endmacro',
    keyword_call: $ => 'call',
    keyword_endcall: $ => 'endcall',
    keyword_import: $ => 'import',
    keyword_from: $ => 'from',
    keyword_as: $ => 'as',
    keyword_and: $ => 'and',
    keyword_or: $ => 'or',
    keyword_not: $ => 'not',
    keyword_in: $ => 'in',
    keyword_is: $ => 'is',
    keyword_do: $ => 'do',
    keyword_endwith: $ => 'endwith',
    keyword_set: $ => 'set',
    keyword_endset: $ => 'endset',
    keyword_include: $ => 'include',
    keyword_ignore: $ => 'ignore',
    keyword_missing: $ => 'missing',
    keyword_filter: $ => 'filter',
    keyword_endfilter: $ => 'endfilter',
    keyword_autoescape: $ => 'autoescape',
    keyword_endautoescape: $ => 'endautoescape',
    keyword_raw: $ => 'raw',
    keyword_endraw: $ => 'endraw',
    keyword_trans: $ => 'trans',
    keyword_endtrans: $ => 'endtrans',
    keyword_pluralize: $ => 'pluralize',
    keyword_trimmed: $ => 'trimmed',
    keyword_notrimmed: $ => 'notrimmed',
    keyword_debug: $ => 'debug',
    keyword_with: $ => token(prec(2, 'with')),
    keyword_without: $ => token(prec(2, 'without')),
    keyword_context: $ => token(prec(2, 'context')),

    // Built-in tests
    builtin_test: $ => choice(
      // State/existence tests
      'defined', 'undefined', 'none',
      // Type tests
      'boolean', 'false', 'true', 'filter', 'test',
      'number', 'integer', 'float', 'string',
      'mapping', 'sequence', 'iterable',
      // Numeric tests
      'odd', 'even',
      // String tests
      'lower', 'upper',
      // Comparison tests (require args)
      'divisibleby', 'equalto', 'sameas',
      // Other tests
      'escaped', 'in', 'callable'
    ),

    builtin_filter: $ => choice(
      // String filters
      'upper', 'lower', 'capitalize', 'title', 'trim', 'truncate', 'wordwrap',
      'wordcount', 'replace', 'format', 'indent', 'escape', 'forceescape',
      'safe', 'striptags', 'urlize', 'center', 'string',
      // Number filters
      'abs', 'round', 'int', 'float', 'sum',
      // List/Dict filters
      'length', 'count', 'first', 'last', 'random', 'join', 'sort',
      'reverse', 'unique', 'list', 'slice', 'batch', 'groupby',
      'select', 'reject', 'selectattr', 'rejectattr', 'map', 'min', 'max',
      'items', 'dictsort', 'attr',
      // Other filters
      'default', 'filesizeformat', 'pprint', 'tojson', 'xmlattr', 'urlencode'
    ),
    // Filters
    filter: $ => choice(
      // Simple filter
      field('name', choice($.builtin_filter, $.identifier)),
      // Filter with arguments
      seq(
        field('name', choice($.builtin_filter, $.identifier)),
        '(',
        optional($._whitespace),
        optional($.argument_list),
        optional($._whitespace),
        ')'
      )
    ),
    filtered_expression: $ => prec.left(10, seq(
      field('value', choice(
        $.primary_expression,
        $.binary_expression,
        $.unary_expression,
        $.ternary_expression,
      )),
      repeat1(seq(
        token(prec(11, seq(optional(/\s+/), '|'))),
        optional($._whitespace),
        field('filter', $.filter)
      ))
    )),

    // Individual operator types for use in binary_expression rules
    additive_operator: $ => choice('+', '-'),
    multiplicative_operator: $ => choice('*', '/', '//', '%'),
    power_operator: $ => '**',
    comparison_operator: $ => choice('==', '!=', '<', '>', '<=', '>='),
    membership_operator: $ => $.keyword_in,
    concatenation_operator: $ => '~',
    logical_and: $ => $.keyword_and,
    logical_or: $ => $.keyword_or,
    logical_not: $ => $.keyword_not,

    // Test expression
    test_expression: $ => prec.left(3, seq(
      field('value', $.primary_expression),
      token(prec(11, seq(optional(/\s+/), 'is'))),
      optional($._whitespace),
      optional(seq($.keyword_not, optional($._whitespace))),
      field('test', choice(
        $.builtin_test,
        $.identifier,
        // Test with arguments
        seq(
          choice($.builtin_test, $.identifier),
          '(',
          optional($._whitespace),
          optional($.argument_list),
          optional($._whitespace),
          ')'
        )
      ))
    )),

    binary_expression: $ => choice(
      // Logical OR (lowest precedence)
      prec.left(1, seq($.expression, optional($._whitespace), $.logical_or, optional($._whitespace), $.expression)),

      // Logical AND
      prec.left(2, seq($.expression, optional($._whitespace), $.logical_and, optional($._whitespace), $.expression)),

      // Comparisons
      prec.left(3, seq($.expression, optional($._whitespace), $.comparison_operator, optional($._whitespace), $.expression)),

      // Membership
      prec.left(3, seq($.expression, optional($._whitespace), $.membership_operator, optional($._whitespace), $.expression)),

      // String concatenation
      prec.left(4, seq($.expression, optional($._whitespace), $.concatenation_operator, optional($._whitespace), $.expression)),

      // Addition/Subtraction
      prec.left(5, seq($.expression, optional($._whitespace), $.additive_operator, optional($._whitespace), $.expression)),

      // Multiplication/Division/Modulo
      prec.left(6, seq($.expression, optional($._whitespace), $.multiplicative_operator, optional($._whitespace), $.expression)),

      // Power (RIGHT associative)
      prec.right(7, seq($.expression, optional($._whitespace), $.power_operator, optional($._whitespace), $.expression)),
    ),
    unary_expression: $ => choice(
      prec(8, seq($.logical_not, choice($.attribute_access, $.function_call, $.method_call, $.identifier, $.literal, $.parenthesized_expression))),
      prec(8, seq($.additive_operator, choice($.attribute_access, $.function_call, $.method_call, $.identifier, $.literal, $.parenthesized_expression))),
    ),
    ternary_expression: $ => prec.right(0, seq(
      field('value', $.expression),
      optional($._whitespace),
      $.keyword_if,
      optional($._whitespace),
      field('condition', $.expression),
      optional(seq(
        optional($._whitespace),
        $.keyword_else,
        optional($._whitespace),
        field('alternative', $.expression)
      ))
    )),
    parenthesized_expression: $ => seq('(', optional($._whitespace), $.expression, optional($._whitespace), ')'),
    // super() calls parent block content in template inheritance
    // Note: super.super() pattern exists for nested inheritance scenarios
    super_call: $ => seq(
      $.keyword_super,
      repeat(seq('.', $.keyword_super)),
      '(',
      optional($._whitespace),
      ')',
    ),

    primary_expression: $ => choice(
      $.literal,
      $.identifier,
      $.parenthesized_expression,
      $.attribute_access,
      $.subscript_access,
      $.function_call,
      $.method_call,
      $.super_call,
    ),
    expression: $ => choice(
      $.ternary_expression,
      $.test_expression,
      $.filtered_expression,
      $.primary_expression,
      $.binary_expression,
      $.unary_expression,
    ),

    // output
    output: $ => seq(
      $.output_begin,
      optional($._whitespace),
      $.expression,
      $.output_end,
    ),

    statement: $ =>
      choice(
        prec.dynamic(1, $.extends_statement),
        prec.dynamic(1, $.block_statement),
        $.macro_statement,
        $.import_statement,
        $.from_statement,
        $.include_statement,
        $.call_statement,
        // prec.dynamic(1, $.if_statement),
        // prec.dynamic(1, $.for_statement),
        prec.dynamic(1, $.with_statement),
        prec.dynamic(1, $.set_statement),
        // prec.dynamic(1, $.filter_statement),
        // prec.dynamic(1, $.autoescape_statement),
        // prec.dynamic(1, $.raw_statement),
        // prec.dynamic(1, $.trans_statement),
        $.do_statement,
        $.debug_statement,
        // $.break_statement,
        // $.continue_statement,
        // prec.dynamic(-2, $.custom_tag_statement),
      ),

    extends_statement: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_extends,
      optional($._whitespace),
      field('template', $.expression),
      optional($._whitespace),
      $.statement_end,
    ),

    block_open: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_block,
      $._whitespace,
      field('name', $.identifier),
      repeat(seq($._whitespace, choice($.keyword_scoped, $.keyword_required))),
      optional($._whitespace),
      $.statement_end,
    ),
    block_close: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endblock,
      optional(seq(
        optional($._whitespace),
        field('endblock_name', $.identifier)
      )),
      optional($._whitespace),
      $.statement_end,
    ),
    block_statement: $ => seq(
      $.block_open,
      repeat($._node),
      $.block_close,
    ),

    macro_open: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_macro,
      optional($._whitespace),
      field('name', $.identifier),
      optional($._whitespace),
      seq(
        '(',
        optional($._whitespace),
        optional($.parameter_list),
        optional($._whitespace),
        ')'
      ),
      $.statement_end,
    ),
    macro_close: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endmacro,
      optional($._whitespace),
      $.statement_end,
    ),
    macro_statement: $ => seq(
      $.macro_open,
      repeat($._node),
      $.macro_close,
    ),

    context_modifier: $ => prec.dynamic(2, choice(
      seq($.keyword_with, optional($._whitespace), $.keyword_context),
      seq($.keyword_without, optional($._whitespace), $.keyword_context)
    )),

    import_statement: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_import,
      field('template', $.expression),
      optional($._whitespace),
      $.keyword_as,
      optional($._whitespace),
      field('alias', $.identifier),
      optional(seq($._whitespace, $.context_modifier)),
      optional($._whitespace),
      $.statement_end,
    ),

    import_item: $ => prec.right(seq(
      field('name', $.identifier),
      optional(seq(
        optional($._whitespace),
        $.keyword_as,
        optional($._whitespace),
        field('alias', $.identifier)
      ))
    )),

    import_list: $ => seq(
      $.import_item,
      repeat(seq(
        optional($._whitespace),
        ',',
        optional($._whitespace),
        $.import_item
      )),
      optional(seq(optional($._whitespace), ','))
    ),

    from_statement: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_from,
      optional($._whitespace),
      field('template', $.expression),
      optional($._whitespace),
      $.keyword_import,
      $._whitespace,
      $.import_list,
      optional($._whitespace),
      optional($.context_modifier),
      optional($._whitespace),
      $.statement_end,
    ),

    call_open: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_call,
      optional($._whitespace),
      field('macro', choice($.function_call, $.method_call)),
      optional($._whitespace),
      $.statement_end,
    ),
    call_close: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endcall,
      optional($._whitespace),
      $.statement_end,
    ),
    call_statement: $ => seq(
      $.call_open,
      repeat($._node),
      $.call_close,
    ),

    if_open: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_if,
      optional($._whitespace),
      field('condition', $.expression),
      $.statement_end,
    ),
    elif_clause: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_elif,
      optional($._whitespace),
      field('condition', $.expression),
      $.statement_end,
      repeat($._node),
    ),
    else_clause: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_else,
      optional($._whitespace),
      $.statement_end,
      repeat($._node),
    ),
    if_close: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endif,
      optional($._whitespace),
      $.statement_end,
    ),
    if_statement: $ => seq(
      $.if_open,
      repeat($._node),
      repeat($.elif_clause),
      optional($.else_clause),
      $.if_close,
    ),

    unpacking_target: $ => choice(
      $.identifier,
      seq(
        $.identifier,
        repeat1(seq(
          optional($._whitespace),
          ',',
          optional($._whitespace),
          $.identifier
        ))
      )
    ),

    for_statement: $ => seq(
      $.keyword_for,
      optional($._whitespace),
      field('left', $.unpacking_target),
      optional($._whitespace),
      $.keyword_in,
      optional($._whitespace),
      field('right', $.expression),
      optional(seq(
        optional($._whitespace),
        $.keyword_if,
        optional($._whitespace),
        field('filter', $.expression)
      )),
      optional(seq(
        optional($._whitespace),
        $.keyword_recursive
      )),
      $.statement_end,
      repeat($._node),
      optional($.for_else_clause),
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endfor,
    ),

    for_else_clause: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_else,
      $.statement_end,
      repeat($._node),
    ),

    break_statement: $ => seq(
      $.keyword_break,
    ),

    continue_statement: $ => seq(
      $.keyword_continue,
    ),

    do_statement: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_do,
      optional($._whitespace),
      field('expression', $.expression),
      optional($._whitespace),
      $.statement_end,
    ),

    debug_statement: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_debug,
      optional($._whitespace),
      $.statement_end,
    ),

    assignment_expression: $ => seq(
      field('name', $.identifier),
      optional($._whitespace),
      '=',
      optional($._whitespace),
      field('value', $.expression)
    ),

    assignment_expression_list: $ => seq(
      $.assignment_expression,
      repeat(seq(
        optional($._whitespace),
        ',',
        optional($._whitespace),
        $.assignment_expression
      ))
    ),

    with_open: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_with,
      optional(seq(
        $._whitespace,
        $.assignment_expression_list
      )),
      $.statement_end,
    ),
    with_close: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endwith,
      optional($._whitespace),
      $.statement_end,
    ),
    with_statement: $ => seq(
      $.with_open,
      repeat($._node),
      $.with_close,
    ),

    set_assignment: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_set,
      $._whitespace,
      $.unpacking_target,
      optional($._whitespace),
      $.comparison_operator,
      optional($._whitespace),
      $.expression,
      optional($._whitespace),
      $.statement_end,
    ),
    set_block_open: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_set,
      $._whitespace,
      field('name', $.identifier),
      optional(seq(
        optional($._whitespace),
        '|',
        optional($._whitespace),
        field('filter', $.filter)
      )),
      optional($._whitespace),
      $.statement_end,
    ),
    set_block_close: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endset,
      optional($._whitespace),
      $.statement_end,
    ),
    set_block: $ => seq(
      $.set_block_open,
      repeat($._node),
      $.set_block_close,
    ),
    set_statement: $ => choice(
      $.set_block,
      $.set_assignment,
    ),

    // set_statement: $ => choice(
    //   seq(
    //     $.keyword_set,
    //     optional($._whitespace),
    //     field('name', $.identifier),
    //     repeat1(seq(
    //       optional($._whitespace),
    //       '|',
    //       optional($._whitespace),
    //       field('filter', $.filter)
    //     )),
    //     $.statement_end,
    //     repeat($._node),
    //     $.statement_begin,
    //     optional($._whitespace),
    //     $.keyword_endset,
    //   ),
    //   // Block assignment: {% set x %}...{% endset %}
    //   seq(
    //     $.keyword_set,
    //     optional($._whitespace),
    //     field('name', $.identifier),
    //     $.statement_end,
    //     repeat($._node),
    //     $.statement_begin,
    //     optional($._whitespace),
    //     $.keyword_endset,
    //   ),
    // ),

    ignore_missing_modifier: $ => seq(
      $.keyword_ignore,
      optional($._whitespace),
      $.keyword_missing
    ),

    include_statement: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_include,
      optional($._whitespace),
      field('template', $.expression),
      optional($._whitespace),
      seq(optional($.ignore_missing_modifier), optional($._whitespace)),
      seq(optional($.context_modifier), optional($._whitespace)),
      $.statement_end,
    ),

    filter_statement: $ => seq(
      $.keyword_filter,
      optional($._whitespace),
      field('filter', $.filter),
      repeat(seq(
        optional($._whitespace),
        '|',
        optional($._whitespace),
        field('filter', $.filter)
      )),
      $.statement_end,
      repeat($._node),
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endfilter,
    ),

    autoescape_statement: $ => seq(
      $.keyword_autoescape,
      optional($._whitespace),
      field('mode', $.boolean),
      $.statement_end,
      repeat($._node),
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endautoescape,
    ),

    raw_content: $ => token(prec(1, /([^{]|\{[^%]|\{%[^\s]|\{%\s+[^e]|\{%\s+e[^n]|\{%\s+en[^d]|\{%\s+end[^r]|\{%\s+endr[^a]|\{%\s+endra[^w])+/)),

    raw_statement: $ => seq(
      $.keyword_raw,
      $.statement_end,
      optional(field('content', $.raw_content)),
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endraw,
    ),

    trans_variable: $ => seq(
      field('name', $.identifier),
      optional($._whitespace),
      '=',
      optional($._whitespace),
      field('value', $.expression)
    ),

    pluralize_clause: $ => seq(
      $.statement_begin,
      optional($._whitespace),
      $.keyword_pluralize,
      optional(seq(
        optional($._whitespace),
        field('count_var', $.identifier)
      )),
      $.statement_end,
      repeat($._node),
    ),

    trans_statement: $ => seq(
      $.keyword_trans,
      // Optional context string
      optional(seq(
        optional($._whitespace),
        field('context', $.string)
      )),
      // Optional trimmed/notrimmed modifier
      optional(seq(
        optional($._whitespace),
        field('modifier', choice($.keyword_trimmed, $.keyword_notrimmed))
      )),
      // Optional variable bindings
      optional(seq(
        optional($._whitespace),
        field('variable', $.trans_variable),
        repeat(seq(
          optional($._whitespace),
          ',',
          optional($._whitespace),
          field('variable', $.trans_variable)
        ))
      )),
      $.statement_end,
      // Singular content
      repeat($._node),
      // Optional pluralize clause
      optional($.pluralize_clause),
      $.statement_begin,
      optional($._whitespace),
      $.keyword_endtrans,
    ),

    // Custom user-defined tags - must not conflict with known keywords
    custom_tag_statement: $ => prec.dynamic(-2, choice(
      // Paired: {% mycomponent a=1 %}...{% endmycomponent %}
      seq(
        field('name', $.identifier),
        optional(seq(
          optional($._whitespace),
          field('attributes', $.argument_list)
        )),
        $.statement_end,
        repeat($._node),
        $.statement_begin,
        optional($._whitespace),
        token(seq('end', /[a-zA-Z_][a-zA-Z0-9_]*/))
      ),
      // Self-closing: {% mycomponent a=1 %}
      seq(
        field('name', $.identifier),
        optional(seq(
          optional($._whitespace),
          field('attributes', $.argument_list)
        ))
      )
    )),

    // comments
    comment: $ => seq(
      $.comment_begin,
      optional($._whitespace),
      optional($.comment_content),
      optional($._whitespace),
      $.comment_end,
    ),
    comment_content: $ => /([^#]|#[^}])+/,
    identifier: $ => token(/[a-zA-Z_][a-zA-Z0-9_]*/),
  }
});
