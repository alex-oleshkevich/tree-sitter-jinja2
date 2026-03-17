/**
  * @file Jinja grammar for tree-sitter
  * @author Alex Oleshkevich <alex.oleshkevich@gmail.com>
  * @license MIT
  */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// FIX: assignment_expression (a = value )
// FIX: unpacking_expression (a, b,c = value )

module.exports = grammar({
  name: "jinja2",
  extras: $ => [/\s/],
  conflicts: $ => [
    [$._primary_expression, $.unpacking],
    [$.function_call, $._primary_expression],
    [$.subscript, $._expression],
  ],
  rules: {
    source_file: $ => repeat($._node),
    _node: $ => choice($.print, $.if_statement, $.for_statement, $.extends_statement, $.include_statement, $.import_statement, $.from_statement, $.set_statement, $.set_block, $.call_block, $.with_statement, $.trans_statement, $.do_statement, $.autoescape_statement, $.raw_statement, $.debug_statement, $.filter_statement, $.block_statement, $.macro_statement, $.custom_close, $.custom_open, $.comment, $.text),
    _whitespace: $ => /\s+/,
    statement_begin: $ => token(choice('{%', '{%-')),
    statement_end: $ => token(choice('%}', '-%}')),
    comment_begin: $ => token(choice('{#', '{#-')),
    comment_end: $ => token(choice('#}', '-#}')),
    print_begin: $ => token(choice('{{', '{{-')),
    print_end: $ => token(choice('}}', '-}}')),
    identifier: $ => token(prec(-1, /[a-zA-Z_][a-zA-Z0-9_]*/)),
    string: $ => choice(
      seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),
      seq("'", repeat(choice(/[^'\\]/, /\\./)), "'"),
    ),
    number: $ => token(choice(
      /0[xX][0-9a-fA-F]+/,
      /0[oO][0-7]+/,
      /0[bB][01]+/,
      /\d+(\.\d+)?([eE][+-]?\d+)?/,
    )),
    boolean: $ => token(choice('true', 'false', 'True', 'False')),
    none: $ => token(choice('none', 'None')),
    keyword_argument: $ => seq(
      field('name', $.identifier),
      '=',
      field('value', $._expression),
    ),
    _argument: $ => choice(
      $.keyword_argument,
      field('positional_argument', $._expression),
    ),
    _argument_list: $ => seq(
      '(',
      optional(seq(
        $._argument,
        repeat(seq(',', $._argument)),
        optional(','),
      )),
      ')',
    ),
    function_call: $ => prec.left(seq(
      field('name', choice($.identifier, $.function_call)),
      $._argument_list,
    )),
    method_call: $ => prec.left(seq(
      field('object', $._primary_expression),
      '.',
      field('method', $.identifier),
      $._argument_list,
    )),
    attribute_access: $ => prec.left(seq(
      field('object', $._primary_expression),
      '.',
      field('attribute', choice($.identifier, $.number)),
    )),
    slice: $ => prec.right(seq(
      field('start', optional($._expression)),
      ':',
      field('stop', optional($._expression)),
      optional(seq(
        ':',
        field('step', optional($._expression)),
      )),
    )),
    subscript: $ => prec.left(seq(
      field('object', $._primary_expression),
      '[',
      choice(
        $.slice,
        field('index', $._expression),
      ),
      ']',
    )),
    list: $ => seq(
      '[',
      optional(seq(
        $._expression,
        repeat(seq(',', $._expression)),
        optional(','),
      )),
      ']'
    ),
    tuple: $ => seq(
      '(',
      optional(seq(
        $._expression,
        ',',
        optional(seq(
          $._expression,
          repeat(seq(',', $._expression)),
          optional(','),
        )),
      )),
      ')',
    ),
    pair: $ => seq(
      field('key', $._expression),
      ':',
      field('value', $._expression),
    ),
    dict: $ => seq(
      '{',
      optional(seq(
        $.pair,
        repeat(seq(',', $.pair)),
        optional(','),
      )),
      '}',
    ),
    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')',
    ),
    filter: $ => prec.left(10, seq(
      field('value', $._expression),
      '|',
      field('name', $.identifier),
      optional($._argument_list),
    )),
    _filter: $ => $.filter,
    _literal: $ => choice(
      $.boolean, $.none, $.list, $.tuple, $.dict, $.string, $.number,
    ),
    _primary_expression: $ => choice(
      $._literal,
      $.parenthesized_expression,
      $.subscript,
      $.method_call,
      $.attribute_access,
      $.function_call,
      $.identifier,
    ),
    binary_expression: $ => choice(
      prec.left(1, seq(field('left', $._expression), field('operator', 'or'), field('right', $._expression))),
      prec.left(2, seq(field('left', $._expression), field('operator', 'and'), field('right', $._expression))),
      prec.left(4, seq(field('left', $._expression), field('operator', choice('==', '!=', '<', '>', '<=', '>=')), field('right', $._expression))),
      prec.left(4, seq(field('left', $._expression), field('operator', 'in'), field('right', $._expression))),
      prec.left(4, seq(field('left', $._expression), field('operator', alias(seq('not', 'in'), 'not in')), field('right', $._expression))),

      prec.left(5, seq(field('left', $._expression), field('operator', '~'), field('right', $._expression))),
      prec.left(6, seq(field('left', $._expression), field('operator', '+'), field('right', $._expression))),
      prec.left(6, seq(field('left', $._expression), field('operator', '-'), field('right', $._expression))),
      prec.left(7, seq(field('left', $._expression), field('operator', '*'), field('right', $._expression))),
      prec.left(7, seq(field('left', $._expression), field('operator', '/'), field('right', $._expression))),
      prec.left(7, seq(field('left', $._expression), field('operator', '//'), field('right', $._expression))),
      prec.left(7, seq(field('left', $._expression), field('operator', '%'), field('right', $._expression))),
      prec.right(8, seq(field('left', $._expression), field('operator', '**'), field('right', $._expression))),
    ),
    _binary_expression: $ => $.binary_expression,
    unary_expression: $ => choice(
      prec.right(3, seq(field('operator', 'not'), field('operand', $._expression))),
      prec(9, seq(field('operator', '-'), field('operand', choice($._primary_expression, $.unary_expression)))),
      prec(9, seq(field('operator', '+'), field('operand', choice($._primary_expression, $.unary_expression)))),
    ),
    _unary_expression: $ => $.unary_expression,
    is_keyword: $ => token(prec(1, 'is')),
    not_keyword: $ => token(prec(1, 'not')),
    test_expression: $ => prec.left(4, seq(
      field('value', $._expression),
      $.is_keyword,
      optional($.not_keyword),
      field('test', choice($.function_call, $.identifier, $.none)),
    )),
    _test_expression: $ => $.test_expression,
    if_keyword: $ => token(prec(1, 'if')),
    elif_keyword: $ => token(prec(1, 'elif')),
    else_keyword: $ => token(prec(1, 'else')),
    endif_keyword: $ => token(prec(1, 'endif')),
    for_keyword: $ => token(prec(1, 'for')),
    in_keyword: $ => token(prec(1, 'in')),
    endfor_keyword: $ => token(prec(1, 'endfor')),
    recursive_keyword: $ => token(prec(1, 'recursive')),
    extends_keyword: $ => token(prec(1, 'extends')),
    block_keyword: $ => token(prec(1, 'block')),
    endblock_keyword: $ => token(prec(1, 'endblock')),
    scoped_keyword: $ => token(prec(1, 'scoped')),
    required_keyword: $ => token(prec(1, 'required')),
    include_keyword: $ => token(prec(1, 'include')),
    ignore_keyword: $ => token(prec(1, 'ignore')),
    missing_keyword: $ => token(prec(1, 'missing')),
    with_keyword: $ => token(prec(1, 'with')),
    without_keyword: $ => token(prec(1, 'without')),
    context_keyword: $ => token(prec(1, 'context')),
    macro_keyword: $ => token(prec(1, 'macro')),
    endmacro_keyword: $ => token(prec(1, 'endmacro')),
    import_keyword: $ => token(prec(1, 'import')),
    from_keyword: $ => token(prec(1, 'from')),
    as_keyword: $ => token(prec(1, 'as')),
    set_keyword: $ => token(prec(1, 'set')),
    endset_keyword: $ => token(prec(1, 'endset')),
    call_keyword: $ => token(prec(1, 'call')),
    endcall_keyword: $ => token(prec(1, 'endcall')),
    endwith_keyword: $ => token(prec(1, 'endwith')),
    trans_keyword: $ => token(prec(1, 'trans')),
    endtrans_keyword: $ => token(prec(1, 'endtrans')),
    pluralize_keyword: $ => token(prec(1, 'pluralize')),
    trimmed_keyword: $ => token(prec(1, 'trimmed')),
    do_keyword: $ => token(prec(1, 'do')),
    autoescape_keyword: $ => token(prec(1, 'autoescape')),
    endautoescape_keyword: $ => token(prec(1, 'endautoescape')),
    raw_keyword: $ => token(prec(1, 'raw')),
    endraw_keyword: $ => token(prec(1, 'endraw')),
    debug_keyword: $ => token(prec(1, 'debug')),
    filter_keyword: $ => token(prec(1, 'filter')),
    endfilter_keyword: $ => token(prec(1, 'endfilter')),
    ternary_expression: $ => prec.right(0, seq(
      field('value', $._expression),
      $.if_keyword,
      field('condition', $._expression),
      optional(seq(
        $.else_keyword,
        field('alternative', $._expression),
      )),
    )),
    _expression: $ => choice(
      $._primary_expression,
      $._binary_expression,
      $._unary_expression,
      $._test_expression,
      $.ternary_expression,
      $._filter,
    ),
    print: $ => seq(
      $.print_begin,
      $._expression,
      $.print_end,
    ),

    if_open: $ => seq(
      $.statement_begin,
      $.if_keyword,
      field('condition', $._expression),
      $.statement_end,
    ),
    elif_clause: $ => seq(
      $.statement_begin,
      $.elif_keyword,
      field('condition', $._expression),
      $.statement_end,
    ),
    else_clause: $ => seq(
      $.statement_begin,
      $.else_keyword,
      $.statement_end,
    ),
    if_close: $ => seq(
      $.statement_begin,
      $.endif_keyword,
      $.statement_end,
    ),
    if_statement: $ => seq(
      $.if_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.comment, $.text, $.elif_clause, $.else_clause))),
      $.if_close,
    ),

    unpacking: $ => seq(
      optional('('),
      $.identifier,
      repeat1(seq(',', $.identifier)),
      optional(','),
      optional(')'),
    ),
    _for_target: $ => choice(
      $.identifier,
      $.unpacking,
    ),
    for_condition: $ => prec(1, seq(
      $.if_keyword,
      field('filter', $._expression),
    )),
    for_open: $ => seq(
      $.statement_begin,
      $.for_keyword,
      field('target', $._for_target),
      $.in_keyword,
      field('iterable', $._expression),
      optional($.for_condition),
      optional($.recursive_keyword),
      $.statement_end,
    ),
    for_close: $ => seq(
      $.statement_begin,
      $.endfor_keyword,
      $.statement_end,
    ),
    for_statement: $ => seq(
      $.for_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.comment, $.text, $.else_clause))),
      $.for_close,
    ),

    extends_statement: $ => seq(
      $.statement_begin,
      $.extends_keyword,
      field('template', $._expression),
      $.statement_end,
    ),

    ignore_missing: $ => seq($.ignore_keyword, $.missing_keyword),
    with_context: $ => seq($.with_keyword, $.context_keyword),
    without_context: $ => seq($.without_keyword, $.context_keyword),
    include_statement: $ => seq(
      $.statement_begin,
      $.include_keyword,
      field('template', $._expression),
      optional($.ignore_missing),
      optional(choice($.with_context, $.without_context)),
      $.statement_end,
    ),

    block_open: $ => seq(
      $.statement_begin,
      $.block_keyword,
      field('name', $.identifier),
      optional($.scoped_keyword),
      optional($.required_keyword),
      $.statement_end,
    ),
    block_close: $ => seq(
      $.statement_begin,
      $.endblock_keyword,
      optional(field('name', $.identifier)),
      $.statement_end,
    ),
    block_statement: $ => seq(
      $.block_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.block_statement, $.comment, $.text))),
      $.block_close,
    ),

    parameter: $ => seq(
      field('name', $.identifier),
      optional(seq('=', field('default', $._expression))),
    ),
    _parameter_list: $ => seq(
      '(',
      optional(seq(
        $.parameter,
        repeat(seq(',', $.parameter)),
        optional(','),
      )),
      ')',
    ),
    macro_open: $ => seq(
      $.statement_begin,
      $.macro_keyword,
      field('name', $.identifier),
      $._parameter_list,
      $.statement_end,
    ),
    macro_close: $ => seq(
      $.statement_begin,
      $.endmacro_keyword,
      optional(field('name', $.identifier)),
      $.statement_end,
    ),
    macro_statement: $ => seq(
      $.macro_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.block_statement, $.comment, $.text))),
      $.macro_close,
    ),

    import_statement: $ => seq(
      $.statement_begin,
      $.import_keyword,
      field('template', $._expression),
      $.as_keyword,
      field('alias', $.identifier),
      optional(choice($.with_context, $.without_context)),
      $.statement_end,
    ),

    import_name: $ => seq(
      field('name', $.identifier),
      optional(seq($.as_keyword, field('alias', $.identifier))),
    ),
    from_statement: $ => seq(
      $.statement_begin,
      $.from_keyword,
      field('template', $._expression),
      $.import_keyword,
      $.import_name,
      repeat(seq(',', $.import_name)),
      optional(choice($.with_context, $.without_context)),
      $.statement_end,
    ),

    set_statement: $ => seq(
      $.statement_begin,
      $.set_keyword,
      $.assignment,
      $.statement_end,
    ),
    set_block_open: $ => seq(
      $.statement_begin,
      $.set_keyword,
      field('target', $.identifier),
      optional(seq('|', field('filter', choice($.function_call, $.identifier)))),
      $.statement_end,
    ),
    set_block_close: $ => seq(
      $.statement_begin,
      $.endset_keyword,
      $.statement_end,
    ),
    set_block: $ => seq(
      $.set_block_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.comment, $.text))),
      $.set_block_close,
    ),

    caller_args: $ => seq(
      '(',
      optional(seq(
        field('name', $.identifier),
        repeat(seq(',', field('name', $.identifier))),
        optional(','),
      )),
      ')',
    ),
    _call_target: $ => prec.left(seq(
      field('object', $.identifier),
      '.',
      field('method', $.identifier),
      $._argument_list,
    )),
    call_open: $ => seq(
      $.statement_begin,
      $.call_keyword,
      optional($.caller_args),
      field('call', choice($.function_call, alias($._call_target, $.method_call))),
      $.statement_end,
    ),
    call_close: $ => seq(
      $.statement_begin,
      $.endcall_keyword,
      $.statement_end,
    ),
    call_block: $ => seq(
      $.call_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.comment, $.text))),
      $.call_close,
    ),

    _assignment_target: $ => choice(
      $.identifier,
      $.unpacking,
      $.attribute_access,
    ),
    assignment: $ => seq(
      field('name', $._assignment_target),
      '=',
      field('value', $._expression),
    ),
    with_open: $ => seq(
      $.statement_begin,
      $.with_keyword,
      optional(seq(
        $.assignment,
        repeat(seq(',', $.assignment)),
      )),
      $.statement_end,
    ),
    with_close: $ => seq(
      $.statement_begin,
      $.endwith_keyword,
      $.statement_end,
    ),
    with_statement: $ => seq(
      $.with_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.comment, $.text))),
      $.with_close,
    ),

    variable: $ => seq(
      field('name', $.identifier),
      optional(seq('=', field('value', $._expression))),
    ),
    trans_open: $ => seq(
      $.statement_begin,
      $.trans_keyword,
      optional($.trimmed_keyword),
      optional(seq(
        $.variable,
        repeat(seq(',', $.variable)),
      )),
      $.statement_end,
    ),
    pluralize_clause: $ => seq(
      $.statement_begin,
      $.pluralize_keyword,
      $.statement_end,
    ),
    trans_close: $ => seq(
      $.statement_begin,
      $.endtrans_keyword,
      $.statement_end,
    ),
    trans_statement: $ => seq(
      $.trans_open,
      repeat(prec.right(choice($.print, $.text))),
      optional(seq(
        $.pluralize_clause,
        repeat(prec.right(choice($.print, $.text))),
      )),
      $.trans_close,
    ),

    do_statement: $ => seq(
      $.statement_begin,
      $.do_keyword,
      field('expression', $._expression),
      $.statement_end,
    ),

    autoescape_open: $ => seq(
      $.statement_begin,
      $.autoescape_keyword,
      field('value', $._expression),
      $.statement_end,
    ),
    autoescape_close: $ => seq(
      $.statement_begin,
      $.endautoescape_keyword,
      $.statement_end,
    ),
    autoescape_statement: $ => seq(
      $.autoescape_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.comment, $.text))),
      $.autoescape_close,
    ),

    raw_content: $ => /([^{]|\{[^%])+/,
    raw_open: $ => seq(
      $.statement_begin,
      $.raw_keyword,
      $.statement_end,
    ),
    raw_close: $ => seq(
      $.statement_begin,
      $.endraw_keyword,
      $.statement_end,
    ),
    raw_statement: $ => seq(
      $.raw_open,
      optional($.raw_content),
      $.raw_close,
    ),

    debug_statement: $ => seq(
      $.statement_begin,
      $.debug_keyword,
      $.statement_end,
    ),

    filter_open: $ => seq(
      $.statement_begin,
      $.filter_keyword,
      field('name', choice($.function_call, $.identifier)),
      $.statement_end,
    ),
    filter_close: $ => seq(
      $.statement_begin,
      $.endfilter_keyword,
      $.statement_end,
    ),
    filter_statement: $ => seq(
      $.filter_open,
      repeat(prec.right(choice($.print, $.if_statement, $.for_statement, $.set_statement, $.set_block, $.include_statement, $.custom_open, $.custom_close, $.comment, $.text))),
      $.filter_close,
    ),

    _custom_argument: $ => choice(
      $.keyword_argument,
      $._expression,
    ),
    custom_open: $ => prec(-2, seq(
      $.statement_begin,
      field('name', $.identifier),
      repeat(field('argument', $._custom_argument)),
      $.statement_end,
    )),
    custom_close: $ => prec(-1, seq(
      $.statement_begin,
      field('name', alias(/end[a-zA-Z_][a-zA-Z0-9_]*/, $.identifier)),
      $.statement_end,
    )),

    comment: $ => seq(
      $.comment_begin,
      optional(field('body', $.comment_content)),
      $.comment_end,
    ),
    comment_content: $ => /([^#-]|#[^}]|-[^#])+/,
    text: $ => choice(
      /[^{]+/,
      /\{[^{%#]/,
    ),
  }
});
