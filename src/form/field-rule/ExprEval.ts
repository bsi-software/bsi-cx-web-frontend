import {Parser} from 'expr-eval';

/**
 * Wrapper around the external 'expr-eval' library.
 * <br>
 * In order to reference the <i>source</i> HTML element in your expression, use the 'source' variable. Example:
 *
 * <pre>not source.checked</pre>
 *
 * This example will return a boolean value, which is the negated value of the 'checked' property from the
 * HTML element passed as <i>source</i> (which is a checkbox/input in this example).
 */
export class ExprEval {

  expression: string;

  constructor(expression: string) {
    this.expression = expression;
  }

  /**
   * Evaluates the expressions and performs a check to ensure the result is of type boolean.
   */
  matches(source: any): boolean {
    let result = this.eval(source);
    if (typeof result !== 'boolean') {
      throw new Error('Result type of expression is not a boolean: ' + this.expression);
    }
    return result;
  }

  /**
   * Evaluates the expression. The result may be of any type.
   */
  eval(source: any): any {
    return Parser.evaluate(this.expression, {
      source: source
    });
  }
}
