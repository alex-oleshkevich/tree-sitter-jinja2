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
  word: $ => $.identifier,
  extras: $ => [/\s/],
  supertypes: $ => [
    $._expression,
    $._primary_expression,
    $._literal,
    $._node,
  ],
  externals: $ => [$.raw_content],
  conflicts: $ => [
    [$._primary_expression, $.unpacking],
    [$.function_call, $._primary_expression],

    [$.subscript, $._expression],
    [$.trans_open, $._literal],
    [$.filter_name],
  ],
  rules: {
    source_file: $ => repeat($._node),
    _node: $ => choice($.print, $.if_statement, $.for_statement, $.extends_statement, $.include_statement, $.import_statement, $.from_statement, $.set_statement, $.set_block, $.call_block, $.with_statement, $.trans_statement, $.do_statement, $.autoescape_statement, $.raw_statement, $.debug_statement, $.filter_statement, $.block_statement, $.macro_statement, $.custom_statement, $.comment, $.text),
    statement_begin: $ => token(choice('{%', '{%-')),
    statement_end: $ => token(choice('%}', '-%}')),
    comment_begin: $ => token(choice('{#', '{#-')),
    comment_end: $ => token(choice('#}', '-#}')),
    print_begin: $ => token(choice('{{', '{{-')),
    print_end: $ => token(choice('}}', '-}}')),
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
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
    boolean: $ => choice('true', 'false', 'True', 'False'),
    none: $ => choice('none', 'None'),
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
    filter_name: $ => seq(
      field('name', $.identifier),
      optional($._argument_list),
    ),
    filter: $ => prec.left(10, seq(
      field('value', choice($._primary_expression, $.unary_expression)),
      repeat1(seq(
        token(prec(11, seq(optional(/\s+/), '|'))),
        field('filter', $.filter_name),
      )),
    )),
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
    unary_expression: $ => choice(
      prec.right(3, seq(field('operator', 'not'), field('operand', $._expression))),
      prec(9, seq(field('operator', '-'), field('operand', choice($._primary_expression, $.unary_expression)))),
      prec(9, seq(field('operator', '+'), field('operand', choice($._primary_expression, $.unary_expression)))),
    ),
    is_keyword: $ => 'is',
    not_keyword: $ => 'not',
    test_call: $ => seq(
      field('name', $.identifier),
      field('argument', choice($.boolean, $.none, $.string, $.number, $.identifier)),
    ),
    test_expression: $ => prec.left(4, seq(
      field('value', $._expression),
      $.is_keyword,
      optional($.not_keyword),
      field('test', choice($.function_call, $.test_call, $.identifier, $.none, $.boolean)),
    )),
    if_keyword: $ => 'if',
    elif_keyword: $ => 'elif',
    else_keyword: $ => 'else',
    endif_keyword: $ => 'endif',
    for_keyword: $ => 'for',
    in_keyword: $ => 'in',
    endfor_keyword: $ => 'endfor',
    recursive_keyword: $ => 'recursive',
    extends_keyword: $ => 'extends',
    block_keyword: $ => 'block',
    endblock_keyword: $ => 'endblock',
    scoped_keyword: $ => 'scoped',
    required_keyword: $ => 'required',
    include_keyword: $ => 'include',
    ignore_keyword: $ => 'ignore',
    missing_keyword: $ => 'missing',
    with_keyword: $ => 'with',
    without_keyword: $ => 'without',
    context_keyword: $ => 'context',
    macro_keyword: $ => 'macro',
    endmacro_keyword: $ => 'endmacro',
    import_keyword: $ => 'import',
    from_keyword: $ => 'from',
    as_keyword: $ => 'as',
    set_keyword: $ => 'set',
    endset_keyword: $ => 'endset',
    call_keyword: $ => 'call',
    endcall_keyword: $ => 'endcall',
    endwith_keyword: $ => 'endwith',
    trans_keyword: $ => 'trans',
    endtrans_keyword: $ => 'endtrans',
    pluralize_keyword: $ => 'pluralize',
    trimmed_keyword: $ => 'trimmed',
    do_keyword: $ => 'do',
    autoescape_keyword: $ => 'autoescape',
    endautoescape_keyword: $ => 'endautoescape',
    raw_keyword: $ => 'raw',
    endraw_keyword: $ => 'endraw',
    debug_keyword: $ => 'debug',
    filter_keyword: $ => 'filter',
    endfilter_keyword: $ => 'endfilter',
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
      $.binary_expression,
      $.unary_expression,
      $.test_expression,
      $.ternary_expression,
      $.filter,
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
    _body_node: $ => choice(
      $.print, $.if_statement, $.for_statement, $.set_statement, $.set_block,
      $.include_statement, $.import_statement, $.from_statement,
      $.call_block, $.with_statement, $.block_statement,
      $.macro_statement, $.trans_statement, $.autoescape_statement,
      $.raw_statement, $.do_statement, $.debug_statement, $.filter_statement,
      $.custom_statement, $.comment, $.text,
    ),
    if_statement: $ => seq(
      $.if_open,
      repeat(prec.right(choice($._body_node, $.elif_clause, $.else_clause))),
      $.if_close,
    ),

    unpacking: $ => choice(
      seq(
        '(',
        $.identifier,
        repeat1(seq(',', $.identifier)),
        optional(','),
        ')',
      ),
      seq(
        $.identifier,
        repeat1(seq(',', $.identifier)),
        optional(','),
      ),
    ),
    _for_target: $ => choice(
      $.identifier,
      $.unpacking,
    ),
    for_condition: $ => prec(1, seq(
      $.if_keyword,
      field('condition', $._expression),
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
      repeat(prec.right($._body_node)),
      optional(seq(
        $.else_clause,
        repeat(prec.right($._body_node)),
      )),
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
      optional(choice(
        seq($.scoped_keyword, optional($.required_keyword)),
        $.required_keyword,
      )),
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
      repeat(prec.right($._body_node)),
      $.block_close,
    ),

    parameter: $ => choice(
      seq(field('name', $.identifier), optional(seq('=', field('default', $._expression)))),
      seq('*', field('name', $.identifier)),
      seq('**', field('name', $.identifier)),
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
      repeat(prec.right($._body_node)),
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
      optional(seq(
        '|',
        field('filter', $.filter_name),
        repeat(seq('|', field('filter', $.filter_name))),
      )),
      $.statement_end,
    ),
    set_block_close: $ => seq(
      $.statement_begin,
      $.endset_keyword,
      $.statement_end,
    ),
    set_block: $ => seq(
      $.set_block_open,
      repeat(prec.right($._body_node)),
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
    _call_attr_chain: $ => prec.left(seq(
      field('object', choice($.identifier, alias($._call_attr_chain, $.attribute_access))),
      '.',
      field('attribute', $.identifier),
    )),
    _call_target: $ => prec.left(seq(
      field('object', choice($.identifier, alias($._call_attr_chain, $.attribute_access))),
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
      repeat(prec.right($._body_node)),
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
    with_arguments: $ => seq(
      $.assignment,
      repeat(seq(',', $.assignment)),
    ),
    with_open: $ => seq(
      $.statement_begin,
      $.with_keyword,
      optional(field('arguments', $.with_arguments)),
      $.statement_end,
    ),
    with_close: $ => seq(
      $.statement_begin,
      $.endwith_keyword,
      $.statement_end,
    ),
    with_statement: $ => seq(
      $.with_open,
      repeat(prec.right($._body_node)),
      $.with_close,
    ),

    trans_arguments: $ => seq(
      $.assignment,
      repeat(seq(',', $.assignment)),
    ),
    trans_open: $ => seq(
      $.statement_begin,
      $.trans_keyword,
      optional(field('context', $.string)),
      optional($.trimmed_keyword),
      optional(field('arguments', $.trans_arguments)),
      $.statement_end,
    ),
    pluralize_clause: $ => seq(
      $.statement_begin,
      $.pluralize_keyword,
      optional(field('variable', $.identifier)),
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
      optional(field('value', $._expression)),
      $.statement_end,
    ),
    autoescape_close: $ => seq(
      $.statement_begin,
      $.endautoescape_keyword,
      $.statement_end,
    ),
    autoescape_statement: $ => seq(
      $.autoescape_open,
      repeat(prec.right($._body_node)),
      $.autoescape_close,
    ),

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
      field('filter', $.filter_name),
      repeat(seq('|', field('filter', $.filter_name))),
      $.statement_end,
    ),
    filter_close: $ => seq(
      $.statement_begin,
      $.endfilter_keyword,
      $.statement_end,
    ),
    filter_statement: $ => seq(
      $.filter_open,
      repeat(prec.right($._body_node)),
      $.filter_close,
    ),

    _custom_argument: $ => choice(
      $.keyword_argument,
      $._expression,
    ),
    custom_statement: $ => seq(
      $.custom_open,
      repeat(prec.right($._body_node)),
      $.custom_close,
    ),
    custom_open: $ => prec(-2, seq(
      $.statement_begin,
      field('name', $.identifier),
      repeat(field('argument', $._custom_argument)),
      $.statement_end,
    )),
    custom_close: $ => prec(-1, seq(
      $.statement_begin,
      field('name', alias(token(prec(1, /end[a-zA-Z_][a-zA-Z0-9_]*/)), $.identifier)),
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
