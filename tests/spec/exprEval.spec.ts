import {ExprEval, FieldRules} from '../../src'

describe('ExprEval.ts', () => {

  function runEval(expression: string, source: any): any {
    let exprEval = new ExprEval(expression);
    return exprEval.eval(source);
  }

  function runMatches(expression: string, source: any): boolean {
    let exprEval = new ExprEval(expression);
    return exprEval.matches(source);
  }

  it('runEval', () => {
    const result = runEval('1 + 2', null);
    expect(result).toBe(5);
  });

  describe('evaluateExpression', () => {
    const fieldRules = new FieldRules();

    it('returns true for numeric less than comparison', () => {
      expect(runEval("source.value < 10", {value: 5})).toBe(true);
    });

    // it('returns false for numeric less than comparison', () => {
    //   expect(fieldRules.evaluateExpression("15", "<10")).toBe(false);
    // });
    //
    // it('returns true for numeric between comparison with &&', () => {
    //   expect(fieldRules.evaluateExpression("5", "<10||>0")).toBe(true);
    // });
    //
    // it('returns true for numeric float between comparison with &&', () => {
    //   expect(fieldRules.evaluateExpression("5", "<10||>0.0")).toBe(true);
    // });
    //
    // it('returns false for numeric between comparison with &&', () => {
    //   expect(fieldRules.evaluateExpression("-5", "<10||>0")).toBe(true);
    // });
    //
    // it('returns true for string comparison among two strings with ||', () => {
    //   expect(fieldRules.evaluateExpression("foo", "==foo||==bar")).toBe(true);
    // });
    //
    // it('returns false for string comparison among two strings with ||', () => {
    //   expect(fieldRules.evaluateExpression("baz", "==foo||==bar")).toBe(false);
    // });
    //
    // it('treats numeric strings as numbers for < comparison', () => {
    //   expect(fieldRules.evaluateExpression("2.5", "<3")).toBe(true);
    //   expect(fieldRules.evaluateExpression("3.5", "<3")).toBe(false);
    // });
    //
    // it('treats numeric strings as numbers for > comparison', () => {
    //   expect(fieldRules.evaluateExpression("2.5", ">2")).toBe(true);
    //   expect(fieldRules.evaluateExpression("1.5", ">2")).toBe(false);
    // });
    //
    // it('treats non-numeric strings as strings for < comparison', () => {
    //   expect(fieldRules.evaluateExpression("apple", "<banana")).toBe(true);
    //   expect(fieldRules.evaluateExpression("zebra", "<banana")).toBe(false);
    // });
    //
    // it('treats mixed numeric and non-numeric as strings', () => {
    //   expect(fieldRules.evaluateExpression("abc", "<123")).toBe(false);
    //   expect(fieldRules.evaluateExpression("123", "<abc")).toBe(true);
    // });
    //
    // it('treats numeric-looking but invalid number strings as strings', () => {
    //   expect(fieldRules.evaluateExpression("12abc", "<12")).toBe(false);
    //   expect(fieldRules.evaluateExpression("12abc", ">11")).toBe(true);
    // });
    //
    // it('returns false for invalid expressions', () => {
    //   spyOn(console, 'error');
    //   expect(fieldRules.evaluateExpression("5", "??10")).toBe(false);
    //   expect(console.error).toHaveBeenCalledWith("Didn't recognize expression: ??10");
    // });
    //
    // it('handles == and != with numbers as strings', () => {
    //   expect(fieldRules.evaluateExpression("5", "==5")).toBe(true);
    //   expect(fieldRules.evaluateExpression("5", "!=5")).toBe(false);
    // });
    //
    // it('compares float strings properly with mixed operators', () => {
    //   expect(fieldRules.evaluateExpression("2.5", ">1.0&&<3.0")).toBe(true);
    //   expect(fieldRules.evaluateExpression("3.5", ">1.0&&<3.0")).toBe(false);
    // });
    //
    // it('treats numeric strings as strings for == with leading zeros', () => {
    //   expect(fieldRules.evaluateExpression("005", "==5")).toBe(false);  // string match, not numeric
    // });
    //
    // it('handles empty expression gracefully', () => {
    //   spyOn(console, 'error');
    //   expect(fieldRules.evaluateExpression("5", "")).toBe(false);
    //   expect(console.error).toHaveBeenCalledWith("Didn't recognize expression: ");
    // });
    //
    // it('compares ISO dates correctly with <', () => {
    //   expect(fieldRules.evaluateExpression("2023-01-01", "<2024-01-01")).toBe(true);
    // });
    //
    // it('compares ISO dates correctly with >', () => {
    //   expect(fieldRules.evaluateExpression("2025-01-01", ">2024-01-01")).toBe(true);
    // });
    //
    // it('compares datetime strings correctly with <', () => {
    //   expect(fieldRules.evaluateExpression("2025-01-01T10:00", "<2025-01-01T11:00")).toBe(true);
    // });
    //
    // it('handles date equality with ==', () => {
    //   expect(fieldRules.evaluateExpression("2023-12-25", "==2023-12-25")).toBe(true);
    // });
    //
    // it('normalizes and compares local date values correctly', () => {
    //   expect(fieldRules.evaluateExpression("2025-07-04", "<2025-07-05")).toBe(true);
    // });
    //
    // it('normalizes and compares datetime-local values correctly', () => {
    //   expect(fieldRules.evaluateExpression("2025-07-04T10:00", "<2025-07-04T12:00")).toBe(true);
    // });

  });
});
