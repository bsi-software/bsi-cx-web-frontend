import {FieldRules} from '../../src/form/field-rule/FieldRules.js'

describe('evaluateExpression', () => {
  const fieldRules = new FieldRules();

  it('returns true for numeric less than comparison', () => {
    expect(fieldRules.evaluateExpression("5", "<10")).toBe(true);
  });

  it('returns false for numeric less than comparison', () => {
    expect(fieldRules.evaluateExpression("15", "<10")).toBe(false);
  });

  it('returns true for numeric between comparison with &&', () => {
    expect(fieldRules.evaluateExpression("5", "<10||>0")).toBe(true);
  });

  it('returns true for numeric float between comparison with &&', () => {
    expect(fieldRules.evaluateExpression("5", "<10||>0.0")).toBe(true);
  });

  it('returns false for numeric between comparison with &&', () => {
    expect(fieldRules.evaluateExpression("-5", "<10||>0")).toBe(true);
  });

  it('returns true for string comparison among two strings with ||', () => {
    expect(fieldRules.evaluateExpression("foo", "==foo||==bar")).toBe(true);
  });

  it('returns false for string comparison among two strings with ||', () => {
    expect(fieldRules.evaluateExpression("baz", "==foo||==bar")).toBe(false);
  });

  it('treats numeric strings as numbers for < comparison', () => {
    expect(fieldRules.evaluateExpression("2.5", "<3")).toBe(true);
    expect(fieldRules.evaluateExpression("3.5", "<3")).toBe(false);
  });

  it('treats numeric strings as numbers for > comparison', () => {
    expect(fieldRules.evaluateExpression("2.5", ">2")).toBe(true);
    expect(fieldRules.evaluateExpression("1.5", ">2")).toBe(false);
  });

  it('treats non-numeric strings as strings for < comparison', () => {
    expect(fieldRules.evaluateExpression("apple", "<banana")).toBe(true);
    expect(fieldRules.evaluateExpression("zebra", "<banana")).toBe(false);
  });

  it('treats mixed numeric and non-numeric as strings', () => {
    expect(fieldRules.evaluateExpression("abc", "<123")).toBe(false);
    expect(fieldRules.evaluateExpression("123", "<abc")).toBe(true);
  });

  it('treats numeric-looking but invalid number strings as strings', () => {
    expect(fieldRules.evaluateExpression("12abc", "<12")).toBe(false);
    expect(fieldRules.evaluateExpression("12abc", ">11")).toBe(true);
  });

  it('returns false for invalid expressions', () => {
    spyOn(console, 'error');
    expect(fieldRules.evaluateExpression("5", "??10")).toBe(false);
    expect(console.error).toHaveBeenCalledWith("Didn't recognize expression: ??10");
  });

  it('handles == and != with numbers as strings', () => {
    expect(fieldRules.evaluateExpression("5", "==5")).toBe(true);
    expect(fieldRules.evaluateExpression("5", "!=5")).toBe(false);
  });

  it('compares float strings properly with mixed operators', () => {
    expect(fieldRules.evaluateExpression("2.5", ">1.0&&<3.0")).toBe(true);
    expect(fieldRules.evaluateExpression("3.5", ">1.0&&<3.0")).toBe(false);
  });

  it('treats numeric strings as strings for == with leading zeros', () => {
    expect(fieldRules.evaluateExpression("005", "==5")).toBe(false);  // string match, not numeric
  });

  it('handles empty expression gracefully', () => {
    spyOn(console, 'error');
    expect(fieldRules.evaluateExpression("5", "")).toBe(false);
    expect(console.error).toHaveBeenCalledWith("Didn't recognize expression: ");
  });

  it('compares ISO dates correctly with <', () => {
    expect(fieldRules.evaluateExpression("2023-01-01", "<2024-01-01")).toBe(true);
  });

  it('compares ISO dates correctly with >', () => {
    expect(fieldRules.evaluateExpression("2025-01-01", ">2024-01-01")).toBe(true);
  });

  it('compares datetime strings correctly with <', () => {
    expect(fieldRules.evaluateExpression("2025-01-01T10:00", "<2025-01-01T11:00")).toBe(true);
  });

  it('handles date equality with ==', () => {
    expect(fieldRules.evaluateExpression("2023-12-25", "==2023-12-25")).toBe(true);
  });

  it('normalizes and compares local date values correctly', () => {
    expect(fieldRules.evaluateExpression("2025-07-04", "<2025-07-05")).toBe(true);
  });

  it('normalizes and compares datetime-local values correctly', () => {
    expect(fieldRules.evaluateExpression("2025-07-04T10:00", "<2025-07-04T12:00")).toBe(true);
  });

});
describe('FieldRules JSON loading', () => {
  let fieldRules: FieldRules;

  beforeEach(() => {
    fieldRules = new FieldRules();
    document.body.replaceChildren();
  });

  it('parses rules from a form and caches them by form ID', () => {
    const rulesJson = {
      rules: [
        {
          "source": "field1",
          "targets": [
            "field2",
            "field3"
          ],
          "expression": "<10",
          "visibility": "visible",
          "mandatory": "required"
        }
      ]
    };

    const encodedRules = escapeJsonForHtmlAttribute(rulesJson);

    document.body.innerHTML = `
      <form id="test-form" data-bsi-formfield-rules='${encodedRules}'>
        <input type="text" name="field1" />
        <input type="text" name="field2" />
      </form>
    `;

    fieldRules.getRulesFromDocument();

    const cached = fieldRules.cachedRulesJson.get("test-form");

    expect(cached).toBeDefined();
    expect(cached!.rules).toBeDefined();
    expect(cached!.rules!.length).toBe(1);
  });

  it('logs an error for invalid JSON rules', () => {
    spyOn(console, 'error');
    document.body.innerHTML = `
      <form id="broken-form" data-bsi-formfield-rules='not-a-json-string'></form>
    `;
    fieldRules.getRulesFromDocument();
    expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching("Failed to get rules from JSON:"));
  });
});

describe('FieldRules application', () => {
  let fieldRules: FieldRules;

  beforeEach(() => {
    fieldRules=new FieldRules();
    document.body.replaceChildren();
  });

  it('should make field2 visible and required if field1 == "yes"', () => {
    const form = setupForm(`
        <input id="field1" type="text" />
        <input id="field2" type="text" />
  `);

    const rules = {
      "rules": [
        {
          "source": "field1",
          "targets": ["field2"],
          "expression": "==yes",
          "required": "required",
          "visible": "visible"
        }
      ]
    };
    fieldRules["cachedRulesJson"].set("testForm", rules);
    const field1 = document.getElementById('field1') as HTMLInputElement;
    const field2 = document.getElementById('field2') as HTMLInputElement;
    field1.value = "yes";
    fieldRules.applyRules(form);
    expect(getComputedStyle(field2).display).not.toBe("none"); // visible
    expect(field2.required).toBeTrue();
  });

  it('should hide and un-require field2 if field1 != "yes"', () => {
    const form = setupForm(`
        <input id="field1" type="text" />
        <input id="field2" type="text" />
  `);

    const rules = {
      "rules": [
        {
          "source": "field1",
          "targets": ["field2"],
          "expression": "==yes",
          "required": "required",
          "visible": "visible"
        }
      ]
    };
    fieldRules["cachedRulesJson"].set("testForm", rules);
    const field1 = document.getElementById('field1') as HTMLInputElement;
    const field2 = document.getElementById('field2') as HTMLInputElement;
    field1.value = "no";
    fieldRules.applyRules(form);
    expect(getComputedStyle(field2).display).toBe("none"); // hidden
    expect(field2.required).toBeFalse();
  });

  it("should toggle visibility based on checkbox state", () => {
    const form = setupForm(`
    <input type="checkbox" id="checkbox" />
    <div id="target" style="display: none;"></div>
  `);

    const rules = {
      rules: [
        {
          source: "checkbox",
          targets: ["target"],
          visible: "visible",
          expression: "==true"
        }
      ]
    };

    fieldRules["cachedRulesJson"].set("testForm", rules);

    (form.querySelector("#checkbox") as HTMLInputElement)!.checked = true;
    fieldRules.applyRules(form);
    expect((form.querySelector("#target") as HTMLElement)!.style.display).toBe("");

    (form.querySelector("#checkbox") as HTMLInputElement)!.checked = false;
    fieldRules.applyRules(form);
    expect((form.querySelector("#target") as HTMLElement)!.style.display).toBe("none");
  });

  it("should set required attribute based on select value", () => {
    const form = setupForm(`
    <select id="select"><option value="a">a</option><option value="b">b</option></select>
    <input id="target" />
  `);

    const rules = {
      rules: [
        {
          source: "select",
          targets: ["target"],
          required: "required",
          expression: "==b"
        }
      ]
    };

    fieldRules.cachedRulesJson.set("testForm", rules);

    const select = form.querySelector("#select") as HTMLSelectElement;
    const target = form.querySelector("#target") as HTMLInputElement;

    select.value = "a";
    fieldRules.applyRules(form);
    expect(target.required).toBe(false);

    select.value = "b";
    fieldRules.applyRules(form);
    expect(target.required).toBe(true);
  });

  it("should set readonly and disabled correctly", () => {
    const form = setupForm(`
    <input id="source" value="enable" />
    <input id="readonlyTarget" />
    <input id="disabledTarget" />
  `);

    const rules = {
      rules: [
        {
          source: "source",
          targets: ["readonlyTarget"],
          readonly: "readonly",
          expression: "==enable"
        },
        {
          source: "source",
          targets: ["disabledTarget"],
          disabled: "disabled",
          expression: "==enable"
        }
      ]
    };

    fieldRules["cachedRulesJson"].set("testForm", rules);

    fieldRules.applyRules(form);

    expect((form.querySelector("#readonlyTarget") as HTMLInputElement).readOnly).toBe(true);
    expect((form.querySelector("#disabledTarget") as HTMLInputElement).disabled).toBe(true);
  });

});

describe('Class and attribute adding/removing', () => {
  let rules: FieldRules;
  let form: HTMLFormElement;
  let sourceField: HTMLInputElement;
  let targetField: HTMLInputElement;

  beforeEach(async () => {
    const rulesJson = {
      rules: [
        {
          source: "sourceField",
          targets: ["targetField"],
          expression: "==apply",
          addClasses: ["highlight", "important"],
          removeClasses: ["dimmed"],
          addAttributes: { "data-status": "active", title: "Enabled" },
          removeAttributes: ["aria-disabled", "bsi-remove"],
        },
      ],
    };

    const innerHtml = `
    <input id="sourceField" type="text" />
    <input id="targetField" type="text" class="dimmed" aria-disabled="true" bsi-remove />
  `;

    document.body.replaceChildren();
    form = setupForm(innerHtml);
    form.setAttribute("data-bsi-formfield-rules", JSON.stringify(rulesJson));

    rules = new FieldRules();
    await new Promise((r) => setTimeout(r, 0));
    console.warn("beforeGetRulesFormDocument ", form);
    rules.getRulesFromDocument();
    console.warn("afterGetRulesFormDocument ", form);

    sourceField = form.querySelector("#sourceField") as HTMLInputElement;
    targetField = form.querySelector("#targetField") as HTMLInputElement;

  });

  it('should add/remove classes and attributes correctly', () => {
    sourceField.value = "apply";
    rules.applyRules(form);

    // Class
    expect(targetField.classList.contains('highlight')).toBeTrue();
    expect(targetField.classList.contains('important')).toBeTrue();
    expect(targetField.classList.contains('dimmed')).toBeFalse();

    // Attribute
    expect(targetField.getAttribute('data-status')).toBe('active');
    expect(targetField.getAttribute('title')).toBe('Enabled');
    expect(targetField.hasAttribute('aria-disabled')).toBeFalse();
    expect(targetField.hasAttribute('bsi-remove')).toBeFalse();

  });

  it('should revert classes and attributes when rule no longer applies', () => {
    sourceField.value = "apply";
    rules.applyRules(form);

    sourceField.value = "ignore";
    rules.applyRules(form);

    // Class
    expect(targetField.classList.contains('highlight')).toBeFalse();
    expect(targetField.classList.contains('important')).toBeFalse();
    expect(targetField.classList.contains('dimmed')).toBeTrue();

    // Attribute
    expect(targetField.hasAttribute('data-status')).toBeFalse();
    expect(targetField.hasAttribute('title')).toBeFalse();
    expect(targetField.hasAttribute('aria-disabled')).toBeTrue();
    expect(targetField.hasAttribute('bsi-remove')).toBeTrue();
  });
});

function escapeJsonForHtmlAttribute(json: any): string {
  const str = JSON.stringify(json);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setupForm(innerHTML: string): HTMLFormElement {
    const form = document.createElement("form");
    form.id = "testForm";
    form.innerHTML = innerHTML;
    const container = document.createElement("div");
    container.appendChild(form);
    document.body.appendChild(container);
    return form;
}
