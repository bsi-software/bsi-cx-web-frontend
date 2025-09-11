describe('FieldRules.ts', () => {

  let FieldRules;

  beforeEach(() => {
    FieldRules = window.bsiCxWebFrontend.FieldRules;
  });

  describe('JSON loading', () => {

    let fieldRules;

    beforeEach(() => {
      fieldRules = new FieldRules();
      document.body.replaceChildren();
    });

    it('parses rules from a form and caches them by form ID', () => {
      const rulesJson = {
        rules: [
          {
            source: 'field1',
            targets: [
              'field2',
              'field3'
            ],
            expression: 'source.value < 10',
            visibility: 'true',
            mandatory: 'true'
          }
        ]
      };

      const encodedRules = escapeJsonForHtmlAttribute(rulesJson);
      document.body.innerHTML = `
        <form id="test-form" data-bsi-json-document='${encodedRules}'>
          <input type="text" name="field1" />
          <input type="text" name="field2" />
        </form>
      `;

      fieldRules.init();
      const cached = fieldRules.cachedRulesJson.get('test-form');
      expect(cached).toBeDefined();
      expect(cached.rules).toBeDefined();
      expect(cached.rules.length).toBe(1);
    });

    it('logs an error for invalid JSON rules', () => {
      spyOn(console, 'error');
      document.body.innerHTML = '<form id="broken-form" data-bsi-json-document="not-a-json-string"></form>';
      fieldRules.init();
      expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching('Failed to get rules from JSON:'));
    });
  });

  describe('Application', () => {

    let fieldRules;

    beforeEach(() => {
      fieldRules = new FieldRules();
      document.body.replaceChildren();
    });

    it('should make field2 visible and required if field1 == "yes"', () => {
      const form = setupForm(`
        <input id="field1" type="text" />
        <input id="field2" type="text" style="display: none;" />
      `);

      const rules = {
        rules: [
          {
            source: 'field1',
            expression: 'source.value == "yes"',
            targets: ['field2'],
            required: 'true', // TODO [awe] 26.1 dynamic forms: hier wollen wir true ohne quotes schreiben können. ExprEval bypassen
            visible: 'false'
          }
        ]
      };
      fieldRules.cachedRulesJson.set('testForm', rules);
      const field1 = document.getElementById('field1');
      const field2 = document.getElementById('field2');

      // First run: expression does not apply
      field1.value = 'no';
      fieldRules.applyRules(form);
      expect(getComputedStyle(field2).display).toBe('none');
      expect(field2.required).toBeFalse();

      // Second run: expression does apply
      field1.value = 'yes';
      fieldRules.applyRules(form);
      expect(getComputedStyle(field2).display).toBe('none');
      expect(field2.required).toBeTrue();
    });

    it('should toggle visibility based on checkbox state', () => {
      const form = setupForm(`
          <input type="checkbox" id="checkbox" />
          <div id="target" style="display: none;"></div>
      `);

      const rules = {
        rules: [
          {
            source: 'checkbox',
            targets: ['target'],
            visible: 'source.checked'
          }
        ]
      };

      fieldRules.cachedRulesJson.set('testForm', rules);

      form.querySelector("#checkbox").checked = true;
      fieldRules.applyRules(form);
      expect(form.querySelector("#target").style.display).toBe("");

      form.querySelector("#checkbox").checked = false;
      fieldRules.applyRules(form);
      expect(form.querySelector("#target").style.display).toBe("none");
    });

    it('should set required attribute based on select value', () => {
      const form = setupForm(`
    <select id="select"><option value="a">a</option><option value="b">b</option></select>
    <input id="target" />
  `);

      const rules = {
        rules: [
          {
            source: 'select',
            targets: ['target'],
            required: 'source.value == "b"'
          }
        ]
      };

      fieldRules.cachedRulesJson.set('testForm', rules);

      const select = form.querySelector("#select");
      const target = form.querySelector("#target");

      select.value = 'a';
      fieldRules.applyRules(form);
      expect(target.required).toBe(false);

      select.value = 'b';
      fieldRules.applyRules(form);
      expect(target.required).toBe(true);
    });

    it('should set readonly and disabled correctly', () => {
      const form = setupForm(`
        <input id="source" value="enable" />
        <input id="readonlyTarget" />
        <input id="disabledTarget" />
      `);

      const rules = {
        rules: [
          {
            source: 'source',
            expression: 'source.value == "enable"',
            targets: ['readonlyTarget'],
            readonly: 'true'
          },
          {
            source: 'source',
            expression: 'source.value == "enable"',
            targets: ['disabledTarget'],
            disabled: 'true'
          }
        ]
      };

      fieldRules.cachedRulesJson.set('testForm', rules);
      fieldRules.applyRules(form);

      expect(form.querySelector('#readonlyTarget').readOnly).toBe(true);
      expect(form.querySelector('#disabledTarget').disabled).toBe(true);
    });

  });

  describe('Class and attribute adding/removing', () => {
    let fieldRules;
    let form;
    let sourceField;
    let targetField;

    beforeEach(async () => {
      const rulesJson = {
        rules: [
          {
            source: 'sourceField',
            expression: 'source.value == "apply"',
            targets: ['targetField'],
            addClasses: ['highlight', 'important'],
            removeClasses: ['dimmed'],
            addAttributes: {'data-status': 'active', title: 'Enabled'},
            removeAttributes: ['aria-disabled', 'data-bsi-remove'],
          },
        ],
      };

      const innerHtml = `
        <input id="sourceField" type="text" />
        <input id="targetField" type="text" class="dimmed" aria-disabled="true" data-bsi-remove />
      `;

      document.body.replaceChildren();
      form = setupForm(innerHtml);
      form.setAttribute('data-bsi-json-document', JSON.stringify(rulesJson));

      fieldRules = new FieldRules();
      await new Promise((r) => setTimeout(r, 0));
      console.warn('beforeGetRulesFormDocument ', form);
      fieldRules.init();
      console.warn('afterGetRulesFormDocument ', form);

      sourceField = form.querySelector('#sourceField');
      targetField = form.querySelector('#targetField');
    });

    it('should add/remove classes and attributes correctly', () => {
      sourceField.value = 'apply';
      fieldRules.applyRules(form);

      // Class
      expect(targetField.classList.contains('highlight')).toBeTrue();
      expect(targetField.classList.contains('important')).toBeTrue();
      expect(targetField.classList.contains('dimmed')).toBeFalse();

      // Attribute
      expect(targetField.getAttribute('data-status')).toBe('active');
      expect(targetField.getAttribute('title')).toBe('Enabled');
      expect(targetField.hasAttribute('aria-disabled')).toBeFalse();
      expect(targetField.hasAttribute('data-bsi-remove')).toBeFalse();

    });

    it('should revert classes and attributes when rule no longer applies', () => {
      sourceField.value = 'apply';
      fieldRules.applyRules(form);

      sourceField.value = 'ignore';
      fieldRules.applyRules(form);

      // Class
      expect(targetField.classList.contains('highlight')).toBeFalse();
      expect(targetField.classList.contains('important')).toBeFalse();
      expect(targetField.classList.contains('dimmed')).toBeTrue();

      // Attribute
      expect(targetField.hasAttribute('data-status')).toBeFalse();
      expect(targetField.hasAttribute('title')).toBeFalse();
      expect(targetField.hasAttribute('aria-disabled')).toBeTrue();
      expect(targetField.hasAttribute('data-bsi-remove')).toBeTrue();
    });
  });

});

function escapeJsonForHtmlAttribute(json) {
  const str = JSON.stringify(json);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setupForm(innerHTML) {
  const form = document.createElement('form');
  form.id = 'testForm';
  form.innerHTML = innerHTML;
  const container = document.createElement('div');
  container.appendChild(form);
  document.body.appendChild(container);
  return form;
}
