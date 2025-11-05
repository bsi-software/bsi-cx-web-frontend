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
    let parser = new Parser();
    this.registerCustomFunctions(parser);
    return parser.evaluate(this.expression, {
      source: source
    });
  }

  protected registerCustomFunctions(parser: Parser) {
    /**
     * Used to convert ISO date and date/time strings into a numeric value that can be compared in an expression.
     * <br>
     * Example for an ISO date: 2025-07-05<br>
     * Example for an ISO date/time: 2025-07-04T12:00
     */
    parser.functions.toDate = (isoDate: string)=> {
      return new Date(isoDate).getTime();
    };

    /**
     * Returns a timestamp of the current date/time as a numeric value that can be compared in an expression.
     */
    parser.functions.now = ()=> {
      return new Date().getTime();
    };

    /**
     * Returns <code>true</code> if the given haystack string starts with the needle string.
     */
    parser.functions.startsWith = (haystack: string, needle: string)=> {
      return haystack && haystack.startsWith(needle);
    };

    /**
     * Returns <code>true</code> if the given haystack string ends with the needle string.
     */
    parser.functions.endsWith = (haystack: string, needle: string)=> {
      return haystack && haystack.endsWith(needle);
    };

    /**
     * Returns <code>true</code> if the given haystack string contains the needle string.
     */
    parser.functions.contains = (haystack: string, needle: string)=> {
      return haystack && haystack.indexOf(needle) > -1;
    };
  }
}
