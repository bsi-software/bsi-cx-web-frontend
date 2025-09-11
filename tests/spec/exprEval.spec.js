/**
 * This Spec basically test the underlying expr-eval library.
 */
describe('ExprEval.ts', () => {

  let ExprEval;

  beforeEach(() => {
    ExprEval = window.bsiCxWebFrontend.ExprEval;
  });

  function runEval(expression, source) {
    let exprEval = new ExprEval(expression);
    return exprEval.eval(source);
  }

  function runMatches(expression, source) {
    let exprEval = new ExprEval(expression);
    return exprEval.matches(source);
  }

  // ---- Tests for matches method ---- //
  describe('matches method', () => {
    it('simple test case with static values', () => {
      expect(runMatches('(1 + 2) == 3', null)).toBe(true);
    });

    it('simple test case with dynamic value', () => {
      expect(runMatches('(1 + source.value) == 3', {value: 2})).toBe(true);
    });
  });

  // ---- Tests for eval method ---- //
  describe('eval method', () => {
    it('simple test case with static values', () => {
      expect(runEval('1 + 2', null)).toBe(3);
    });

    it('simple test case with dynamic value', () => {
      expect(runEval('1 + source.value', {value: 2})).toBe(3);
    });

    it('returns true for numeric less than comparison', () => {
      expect(runEval('source.value < 10', {value: 5})).toBe(true);
    });

    it('returns false for numeric less than comparison', () => {
      expect(runEval('source.value < 10', {value: 15})).toBe(false);
    });

    it('returns true for numeric between comparison with -or-', () => {
      expect(runEval('source.value < 10 or source.value > 0', {value: 5})).toBe(true);
    });

    it('returns true for numeric float between comparison with -or-', () => {
      expect(runEval('source.value < 10 or source.value > 0.0', {value: 5})).toBe(true);
    });

    it('returns false for numeric between comparison with -or-', () => {
      expect(runEval('source.value < 10 or source.value > 0', {value: -5})).toBe(true);
    });

    it('returns true for string comparison among two strings with -or-', () => {
      expect(runEval('source.value == "foo" or source.value == "bar"', {value: 'foo'})).toBe(true);
    });

    it('returns false for string comparison among two strings with -or-', () => {
      expect(runEval('source.value == "foo" or source.value == "bar"', {value: 'baz'})).toBe(false);
    });

    it('treats numeric strings as numbers for < comparison', () => {
      expect(runEval('source.value < 3', {value: '2.5'})).toBe(true);
      expect(runEval('source.value < 3', {value: '3.5'})).toBe(false);
    });

    it('treats numeric strings as numbers for > comparison', () => {
      expect(runEval('source.value > 2', {value: '2.5'})).toBe(true);
      expect(runEval('source.value > 2', {value: '1.5'})).toBe(false);
    });

    it('treats non-numeric strings as strings for < comparison', () => { // Yes, but why!? :-o
      expect(runEval('source.value < "banana"', {value: 'apple'})).toBe(true);
      expect(runEval('source.value < "banana"', {value: 'zebra'})).toBe(false);
    });

    it('treats mixed numeric and non-numeric as strings', () => {
      expect(runEval('source.value < 123', {value: 'abc'})).toBe(false);
      expect(runEval('source.value < "abc"', {value: '123'})).toBe(true);
    });

    it('treats numeric-looking but invalid number strings as strings', () => {
      expect(runEval('source.value < 12', {value: '12abc'})).toBe(false);
      expect(runEval('source.value > 11', {value: '12abc'})).toBe(false);
    });

    it('throw an error if expression is invalid', () => {
      expect(() => runEval('source.value > ??10', {value: 5})).toThrowError();
    });

    it('handles == and != with numbers as strings', () => {
      expect(runEval('source.value == 5', {value: '5'})).toBe(false);
      expect(runEval('source.value != 5', {value: '5'})).toBe(true);
    });

    it('compares float strings properly with mixed operators', () => {
      expect(runEval('source.value > 1.0 and source.value < 3.0', {value: '2.5'})).toBe(true);
      expect(runEval('source.value > 1.0 and source.value < 3.0', {value: '3.5'})).toBe(false);
    });

    it('treats numeric strings as strings for == with leading zeros', () => {
      expect(runEval('source.value == 5', {value: '005'})).toBe(false); // string match, not numeric
    });

    it('handles empty expression gracefully', () => {
      expect(() => runEval('', {value: 5})).toThrowError();
    });

    it('compares ISO dates correctly with <', () => {
      expect(runEval('toDate(source.value) < toDate("2024-01-01")', {value: '2023-01-01'})).toBe(true);
    });

    it('compares ISO dates correctly with >', () => {
      expect(runEval('toDate(source.value) > toDate("2024-01-01")', {value: '2025-01-01'})).toBe(true);
    });

    it('compares datetime strings correctly with <', () => {
      expect(runEval('toDate(source.value) < toDate("2025-01-01T11:00")', {value: '2025-01-01T10:00'})).toBe(true);
    });

    it('handles date equality with ==', () => {
      expect(runEval('toDate(source.value) == toDate("2023-12-25")', {value: '2023-12-25'})).toBe(true);
    });

    it('normalizes and compares local date values correctly', () => {
      expect(runEval('toDate(source.value) < toDate("2025-07-05")', {value: '2025-07-04'})).toBe(true);
    });

    it('normalizes and compares datetime-local values correctly', () => {
      expect(runEval('toDate(source.value) < toDate("2025-07-04T12:00")', {value: '2025-07-04T10:00'})).toBe(true);
    });
  });
});
