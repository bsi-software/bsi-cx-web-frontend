import {FieldRules} from '../../src'


describe('FieldRules.ts', () => {

  it('dummy', () => {
    expect(true).toBe(true);
  })

  // describe('JSON loading', () => {
  //   let fieldRules: FieldRules;
  //
  //   beforeEach(() => {
  //     fieldRules = new FieldRules();
  //     document.body.replaceChildren();
  //   });
  //
  //   it('parses rules from a form and caches them by form ID', () => {
  //     const rulesJson = {
  //       rules: [
  //         {
  //           "source": "field1",
  //           "targets": [
  //             "field2",
  //             "field3"
  //           ],
  //           "expression": "<10",
  //           "visibility": "visible",
  //           "mandatory": "required"
  //         }
  //       ]
  //     };
  //
  //     const encodedRules = escapeJsonForHtmlAttribute(rulesJson);
  //
  //     document.body.innerHTML = `
  //     <form id="test-form" data-bsi-formfield-rules='${encodedRules}'>
  //       <input type="text" name="field1" />
  //       <input type="text" name="field2" />
  //     </form>
  //   `;
  //
  //     fieldRules.getRulesFromDocument();
  //
  //     const cached = fieldRules.cachedRulesJson.get("test-form");
  //
  //     expect(cached).toBeDefined();
  //     expect(cached!.rules).toBeDefined();
  //     expect(cached!.rules!.length).toBe(1);
  //   });
  //
  //   it('logs an error for invalid JSON rules', () => {
  //     spyOn(console, 'error');
  //     document.body.innerHTML = `
  //     <form id="broken-form" data-bsi-formfield-rules='not-a-json-string'></form>
  //   `;
  //     fieldRules.getRulesFromDocument();
  //     expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching("Failed to get rules from JSON:"));
  //   });
  // });
  //
  // describe('Application', () => {
  //   let fieldRules: FieldRules;
  //
  //   beforeEach(() => {
  //     fieldRules=new FieldRules();
  //     document.body.replaceChildren();
  //   });
  //
  //   it('should make field2 visible and required if field1 == "yes"', () => {
  //     const form = setupForm(`
  //       <input id="field1" type="text" />
  //       <input id="field2" type="text" />
  // `);
  //
  //     const rules = {
  //       "rules": [
  //         {
  //           "source": "field1",
  //           "targets": ["field2"],
  //           "expression": "==yes",
  //           "required": "required",
  //           "visible": "visible"
  //         }
  //       ]
  //     };
  //     fieldRules["cachedRulesJson"].set("testForm", rules);
  //     const field1 = document.getElementById('field1') as HTMLInputElement;
  //     const field2 = document.getElementById('field2') as HTMLInputElement;
  //     field1.value = "yes";
  //     fieldRules.applyRules(form);
  //     expect(getComputedStyle(field2).display).not.toBe("none"); // visible
  //     expect(field2.required).toBeTrue();
  //   });
  //
  //   it('should hide and un-require field2 if field1 != "yes"', () => {
  //     const form = setupForm(`
  //       <input id="field1" type="text" />
  //       <input id="field2" type="text" />
  // `);
  //
  //     const rules = {
  //       "rules": [
  //         {
  //           "source": "field1",
  //           "targets": ["field2"],
  //           "expression": "==yes",
  //           "required": "required",
  //           "visible": "visible"
  //         }
  //       ]
  //     };
  //     fieldRules["cachedRulesJson"].set("testForm", rules);
  //     const field1 = document.getElementById('field1') as HTMLInputElement;
  //     const field2 = document.getElementById('field2') as HTMLInputElement;
  //     field1.value = "no";
  //     fieldRules.applyRules(form);
  //     expect(getComputedStyle(field2).display).toBe("none"); // hidden
  //     expect(field2.required).toBeFalse();
  //   });
  //
  //   it("should toggle visibility based on checkbox state", () => {
  //     const form = setupForm(`
  //   <input type="checkbox" id="checkbox" />
  //   <div id="target" style="display: none;"></div>
  // `);
  //
  //     const rules = {
  //       rules: [
  //         {
  //           source: "checkbox",
  //           targets: ["target"],
  //           visible: "visible",
  //           expression: "==true"
  //         }
  //       ]
  //     };
  //
  //     fieldRules["cachedRulesJson"].set("testForm", rules);
  //
  //     (form.querySelector("#checkbox") as HTMLInputElement)!.checked = true;
  //     fieldRules.applyRules(form);
  //     expect((form.querySelector("#target") as HTMLElement)!.style.display).toBe("");
  //
  //     (form.querySelector("#checkbox") as HTMLInputElement)!.checked = false;
  //     fieldRules.applyRules(form);
  //     expect((form.querySelector("#target") as HTMLElement)!.style.display).toBe("none");
  //   });
  //
  //   it("should set required attribute based on select value", () => {
  //     const form = setupForm(`
  //   <select id="select"><option value="a">a</option><option value="b">b</option></select>
  //   <input id="target" />
  // `);
  //
  //     const rules = {
  //       rules: [
  //         {
  //           source: "select",
  //           targets: ["target"],
  //           required: "required",
  //           expression: "==b"
  //         }
  //       ]
  //     };
  //
  //     fieldRules.cachedRulesJson.set("testForm", rules);
  //
  //     const select = form.querySelector("#select") as HTMLSelectElement;
  //     const target = form.querySelector("#target") as HTMLInputElement;
  //
  //     select.value = "a";
  //     fieldRules.applyRules(form);
  //     expect(target.required).toBe(false);
  //
  //     select.value = "b";
  //     fieldRules.applyRules(form);
  //     expect(target.required).toBe(true);
  //   });
  //
  //   it("should set readonly and disabled correctly", () => {
  //     const form = setupForm(`
  //   <input id="source" value="enable" />
  //   <input id="readonlyTarget" />
  //   <input id="disabledTarget" />
  // `);
  //
  //     const rules = {
  //       rules: [
  //         {
  //           source: "source",
  //           targets: ["readonlyTarget"],
  //           readonly: "readonly",
  //           expression: "==enable"
  //         },
  //         {
  //           source: "source",
  //           targets: ["disabledTarget"],
  //           disabled: "disabled",
  //           expression: "==enable"
  //         }
  //       ]
  //     };
  //
  //     fieldRules["cachedRulesJson"].set("testForm", rules);
  //
  //     fieldRules.applyRules(form);
  //
  //     expect((form.querySelector("#readonlyTarget") as HTMLInputElement).readOnly).toBe(true);
  //     expect((form.querySelector("#disabledTarget") as HTMLInputElement).disabled).toBe(true);
  //   });
  //
  // });
  //
  // describe('Class and attribute adding/removing', () => {
  //   let rules: FieldRules;
  //   let form: HTMLFormElement;
  //   let sourceField: HTMLInputElement;
  //   let targetField: HTMLInputElement;
  //
  //   beforeEach(async () => {
  //     const rulesJson = {
  //       rules: [
  //         {
  //           source: "sourceField",
  //           targets: ["targetField"],
  //           expression: "==apply",
  //           addClasses: ["highlight", "important"],
  //           removeClasses: ["dimmed"],
  //           addAttributes: { "data-status": "active", title: "Enabled" },
  //           removeAttributes: ["aria-disabled", "bsi-remove"],
  //         },
  //       ],
  //     };
  //
  //     const innerHtml = `
  //   <input id="sourceField" type="text" />
  //   <input id="targetField" type="text" class="dimmed" aria-disabled="true" bsi-remove />
  // `;
  //
  //     document.body.replaceChildren();
  //     form = setupForm(innerHtml);
  //     form.setAttribute("data-bsi-formfield-rules", JSON.stringify(rulesJson));
  //
  //     rules = new FieldRules();
  //     await new Promise((r) => setTimeout(r, 0));
  //     console.warn("beforeGetRulesFormDocument ", form);
  //     rules.getRulesFromDocument();
  //     console.warn("afterGetRulesFormDocument ", form);
  //
  //     sourceField = form.querySelector("#sourceField") as HTMLInputElement;
  //     targetField = form.querySelector("#targetField") as HTMLInputElement;
  //
  //   });
  //
  //   it('should add/remove classes and attributes correctly', () => {
  //     sourceField.value = "apply";
  //     rules.applyRules(form);
  //
  //     // Class
  //     expect(targetField.classList.contains('highlight')).toBeTrue();
  //     expect(targetField.classList.contains('important')).toBeTrue();
  //     expect(targetField.classList.contains('dimmed')).toBeFalse();
  //
  //     // Attribute
  //     expect(targetField.getAttribute('data-status')).toBe('active');
  //     expect(targetField.getAttribute('title')).toBe('Enabled');
  //     expect(targetField.hasAttribute('aria-disabled')).toBeFalse();
  //     expect(targetField.hasAttribute('bsi-remove')).toBeFalse();
  //
  //   });
  //
  //   it('should revert classes and attributes when rule no longer applies', () => {
  //     sourceField.value = "apply";
  //     rules.applyRules(form);
  //
  //     sourceField.value = "ignore";
  //     rules.applyRules(form);
  //
  //     // Class
  //     expect(targetField.classList.contains('highlight')).toBeFalse();
  //     expect(targetField.classList.contains('important')).toBeFalse();
  //     expect(targetField.classList.contains('dimmed')).toBeTrue();
  //
  //     // Attribute
  //     expect(targetField.hasAttribute('data-status')).toBeFalse();
  //     expect(targetField.hasAttribute('title')).toBeFalse();
  //     expect(targetField.hasAttribute('aria-disabled')).toBeTrue();
  //     expect(targetField.hasAttribute('bsi-remove')).toBeTrue();
  //   });
  // });

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
