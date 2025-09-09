export class FieldRules {

  static FIELD_RULES_ATTRIBUTE_ID = 'data-bsi-formfield-rules';
  static DEBOUNCE_DELAY = 100;
  static OR_OPERATOR = '||';
  static AND_OPERATOR = '&&';
  static EQUALS_OPERATOR = '==';
  static UNEQUALS_OPERATOR = '!=';
  static LESS_OPERATOR = '<';
  static MORE_OPERATOR = '>';
  static LESS_EQUALS_OPERATOR = '<=';
  static MORE_EQUALS_OPERATOR = '>=';

  cachedRulesJson = new Map<string, any>();
  originalSelectOptions = new WeakMap<HTMLSelectElement, HTMLOptionElement[]>();
  originalClassLists = new WeakMap<HTMLElement, Set<string>>();
  originalAttributes = new WeakMap<HTMLElement, Map<string, string | null>>();
  attachedListeners: WeakSet<Element> = new WeakSet();
  debounceTimers: WeakMap<HTMLFormElement, number> = new WeakMap();

  constructor() {
  }

  /**
   * Public function to be called to initialize the field rules framework on all forms in the document.
   */
  init() {
    const forms = document.querySelectorAll<HTMLFormElement>('form');
    forms.forEach((form) => {
      const formId = form.id;
      if (!formId) {
        console.warn('Skipping form without ID attribute:', form);
        return;
      }

      const rulesAttr = form.getAttribute(FieldRules.FIELD_RULES_ATTRIBUTE_ID);
      if (rulesAttr) {
        this.initRules(formId, rulesAttr);
        this.applyRules(form);
      }
    });
  }

  protected initRules(formId: string, rulesAttr: string) {
    try {
      const rulesJson = JSON.parse(this.unescapeHtmlEntities(rulesAttr));
      if (Array.isArray(rulesJson.rules)) {
        this.cachedRulesJson.set(formId, rulesJson);
      }
      const form = document.getElementById(formId) as HTMLFormElement;
      for (const rule of rulesJson.rules as Rule[]) {
        const sourceElement = document.getElementById(rule.source) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (!sourceElement) {
          console.warn(`Source element "${rule.source}" not found for form "${formId}"`);
          continue;
        }

        if (this.attachedListeners.has(sourceElement)) {
          continue;
        }

        const handler = () => this.debouncedApplyRules(form);
        sourceElement.addEventListener('input', handler);
        sourceElement.addEventListener('change', handler);
        this.attachedListeners.add(sourceElement);
      }
    } catch (error: any) {
      console.error('Failed to get rules from JSON', error.message);
    }
  }

  protected evaluateExpression(sourceValue: string, expression: string): boolean {
    const isPureNumber = (s: string) => /^-?\d+(\.\d+)?$/.test(s); // TODO [awe] 26.1 dynamic forms: localized number formats could be a problem?
    // https://stackoverflow.com/questions/3143070/regex-to-match-an-iso-8601-datetime-string
    const isISODate = (s: string) => /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?)?Z?$/.test(s);

    const compare = (a: string, b: string, cmp: (x: any, y: any) => boolean): boolean => {
      const isANum = isPureNumber(a);
      const isBNum = isPureNumber(b);
      const isBooleanString = (s: string) => /^(true|false)$/i.test(s);
      const toBoolean = (s: string) => s.toLowerCase() === "true";

      if (isANum && isBNum) {
        return cmp(parseFloat(a), parseFloat(b));
      }

      const isADate = isISODate(a);
      const isBDate = isISODate(b);
      if (isADate && isBDate) {
        const aDate = Date.parse(this.normalizeDateInput(a));
        const bDate = Date.parse(this.normalizeDateInput(b));
        return cmp(aDate, bDate);
      }

      const isABool = isBooleanString(a);
      const isBBool = isBooleanString(b);
      if (isABool && isBBool) {
        return cmp(toBoolean(a), toBoolean(b));
      }

      return cmp(a, b); // Fallback to string
    };

    if (expression.includes(FieldRules.AND_OPERATOR)) {
      const expressions = expression.split(FieldRules.AND_OPERATOR);
      if (expressions.length > 1) {
        return expressions.reduce((acc, expr) => acc && this.evaluateExpression(sourceValue, expr), true);
      }
    }

    if (expression.includes(FieldRules.OR_OPERATOR)) {
      const expressions = expression.split(FieldRules.OR_OPERATOR);
      if (expressions.length > 1) {
        return expressions.reduce((acc, expr) => acc || this.evaluateExpression(sourceValue, expr), false);
      }
    }

    if (expression.startsWith(FieldRules.LESS_EQUALS_OPERATOR)) {
      const target = expression.slice(FieldRules.LESS_EQUALS_OPERATOR.length);
      return compare(sourceValue, target, (a, b) => a <= b);
    }

    if (expression.startsWith(FieldRules.MORE_EQUALS_OPERATOR)) {
      const target = expression.slice(FieldRules.MORE_EQUALS_OPERATOR.length);
      return compare(sourceValue, target, (a, b) => a >= b);
    }

    if (expression.startsWith(FieldRules.LESS_OPERATOR)) {
      const target = expression.slice(FieldRules.LESS_OPERATOR.length);
      return compare(sourceValue, target, (a, b) => a < b);
    }

    if (expression.startsWith(FieldRules.MORE_OPERATOR)) {
      const target = expression.slice(FieldRules.MORE_OPERATOR.length);
      return compare(sourceValue, target, (a, b) => a > b);
    }

    if (expression.startsWith(FieldRules.UNEQUALS_OPERATOR)) {
      const comp = expression.slice(FieldRules.UNEQUALS_OPERATOR.length);
      return sourceValue !== comp;
    }

    if (expression.startsWith(FieldRules.EQUALS_OPERATOR)) {
      const comp = expression.slice(FieldRules.EQUALS_OPERATOR.length);
      return sourceValue === comp;
    }

    console.error('Failed to recognize expression: ' + expression);
    return false;
  }

  protected applyRules(form: HTMLFormElement) {
    const formId = form.id;
    if (!formId) return;

    const rulesObj = this.cachedRulesJson.get(formId);
    if (!rulesObj || !Array.isArray(rulesObj.rules)) return;

    for (const rule of rulesObj.rules) {
      const sourceInput = form.querySelector<HTMLInputElement>(`#${rule.source}`);
      if (!sourceInput) continue;

      const value = this.getSourceValue(sourceInput);
      const applies = this.evaluateExpression(value, rule.expression);

      for (const targetId of rule.targets) {
        // Use document.getElement because
        const targetElement = document.getElementById(targetId);
        if (!targetElement) {
          continue;
        }
        console.debug("Target %o, applies %o, rule %o, targetId %o, value %o", targetElement, applies, rule, targetId, value);

        // Apply each rule type if defined
        if (rule.visible) {
          this.ruleDispatcher.visible(targetElement, applies, rule.visible);
        }
        if (rule.required) {
          this.ruleDispatcher.required(targetElement, applies, rule.required);
        }
        if (rule.disabled) {
          this.ruleDispatcher.disabled(targetElement, applies, rule.disabled);
        }
        if (rule.readonly) {
          this.ruleDispatcher.readonly(targetElement, applies, rule.readonly);
        }
        if (rule.availableValues) {
          this.ruleDispatcher.availableValues(targetElement, applies, rule.availableValues);
        }
        if (rule.addAttributes) {
          this.ruleDispatcher.addAttributes(targetElement, applies, rule.addAttributes);
        }
        if (rule.removeAttributes) {
          this.ruleDispatcher.removeAttributes(targetElement, applies, rule.removeAttributes);
        }
        if (rule.addClasses) {
          this.ruleDispatcher.addClasses(targetElement, applies, rule.addClasses);
        }
        if (rule.removeClasses) {
          this.ruleDispatcher.removeClasses(targetElement, applies, rule.removeClasses);
        }
      }
    }
  }

  protected getSourceValue(sourceInput: HTMLInputElement): string {
    if (!sourceInput) return "";

    if (sourceInput.type === "checkbox") {
      return sourceInput.checked ? "true" : "false";
    }
    return sourceInput.value;
  }

  ruleDispatcher = {
    visible: (el: HTMLElement, apply: boolean, value: string) => {
      const visible = value === "visible";
      const display = (apply === visible) ? "" : "none";
      el.style.display = display;
      // Also change the visibility of the associated label
      const label = document.querySelector(`label[for="${el.id}"]`) as HTMLElement;
      if (label) {
        label.style.display = display;
      }
    },
    required: (el: HTMLElement, apply: boolean, value: string) => {
      console.debug("required: Target %o, applies %o, value %o", el, apply, value);
      if ('required' in el) {
        (el as HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement).required = apply && value === "required";
      }
    },
    disabled: (el: HTMLElement, apply: boolean, value: string) => {
      if ("disabled" in el) {
        (el as HTMLInputElement
          | HTMLTextAreaElement
          | HTMLButtonElement
          | HTMLFieldSetElement
          | HTMLOptGroupElement
          | HTMLOptionElement
          | HTMLSelectElement).disabled = apply && value === "disabled";
      }
    },
    readonly: (el: HTMLElement, apply: boolean, value: string) => {
      if ("readOnly" in el) {
        (el as HTMLInputElement
          | HTMLTextAreaElement).readOnly = apply && value === "readonly";
      }
    },
    availableValues: (el: HTMLElement, apply: boolean, value: any[]) => { // TODO [awe] 26.1 dynamic forms: für Wertelisten anpassen
      if (!(el instanceof HTMLSelectElement)) return;

      if (apply) {
        if (!this.originalSelectOptions.has(el)) {
          this.originalSelectOptions.set(el, Array.from(el.options).map(opt => opt.cloneNode(true) as HTMLOptionElement));
        }

        el.innerHTML = "";
        value.forEach(v => {
          const option = document.createElement("option");
          option.value = v;
          option.textContent = v;
          el.appendChild(option);
        });

      } else if (this.originalSelectOptions.has(el)) {
        el.innerHTML = ""; // clear current options
        this.originalSelectOptions.get(el)?.forEach(opt => el.appendChild(opt.cloneNode(true)));
        this.originalSelectOptions.delete(el);
      }
    },
    addAttributes: (el: HTMLElement, apply: boolean, attrs: Record<string, string>) => {
      if (!this.originalAttributes.has(el)) {
        this.originalAttributes.set(el, new Map());
      }
      const original = this.originalAttributes.get(el)!;
      for (const [key, value] of Object.entries(attrs)) {
        if (!original.has(key)) {
          original.set(key, el.getAttribute(key));
        }
      }

      if (apply) {
        for (const [key, value] of Object.entries(attrs)) {
          el.setAttribute(key, value);
        }
      } else {
        const original = this.originalAttributes.get(el)!;
        for (const key of Object.keys(attrs)) {
          const originalValue = original.get(key);
          if (originalValue == null) {// == instead of === to catch unknown
            el.removeAttribute(key);
          } else {
            el.setAttribute(key, originalValue);
          }
        }
      }
    },

    removeAttributes: (el: HTMLElement, apply: boolean, attrs: string[]) => {
      if (!this.originalAttributes.has(el)) {
        this.originalAttributes.set(el, new Map());
      }
      const original = this.originalAttributes.get(el)!;
      for (const key of attrs) {
        if (!original.has(key)) {
          original.set(key, el.getAttribute(key));
        }
      }

      if (apply) {
        for (const key of attrs) {
          el.removeAttribute(key);
        }
      } else {
        const original = this.originalAttributes.get(el)!;
        for (const key of attrs) {
          const originalValue = original.get(key);
          if (originalValue == null) { // == instead of === to catch unknown
            el.removeAttribute(key);
          } else {
            el.setAttribute(key, originalValue);
          }
        }
      }
    },

    addClasses: (el: HTMLElement, apply: boolean, classes: string[]) => {
      if (!this.originalClassLists.has(el)) {
        this.originalClassLists.set(el, new Set(Array.from(el.classList)));
      }

      if (apply) {
        classes.forEach(cls => el.classList.add(cls));
      } else {
        const original = this.originalClassLists.get(el)!;
        el.className = '';
        original.forEach(cls => el.classList.add(cls));
      }
    },

    removeClasses: (el: HTMLElement, apply: boolean, classes: string[]) => {
      if (!this.originalClassLists.has(el)) {
        this.originalClassLists.set(el, new Set(Array.from(el.classList)));
      }

      if (apply) {
        classes.forEach(cls => el.classList.remove(cls));
      } else {
        const original = this.originalClassLists.get(el)!;
        el.className = '';
        original.forEach(cls => el.classList.add(cls));
      }
    }
  };

  protected debouncedApplyRules(form: HTMLFormElement, delay = FieldRules.DEBOUNCE_DELAY) {
    if (this.debounceTimers.has(form)) {
      clearTimeout(this.debounceTimers.get(form));
    }

    const timer = window.setTimeout(() => {
      this.applyRules(form);
      this.debounceTimers.delete(form);
    }, delay);

    this.debounceTimers.set(form, timer);
  }

  protected normalizeDateInput(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Only a date
      return `${value}T00:00:00.000Z`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      // Local datetime without seconds
      return `${value}:00.000Z`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
      return `${value}.000Z`;
    }
    return value;
  }

  protected unescapeHtmlEntities(encoded: string): string {
    return encoded
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}

/**
 * Definition for 'Rule' object.
 */
interface Rule {
  source: string;
  targets: string[];
  expression: string;
  // If property is not present in the rule it is neither set nor removed on the target element(s) when applying the rule
  visible?: "visible" | "not-visible"; // Not true or false to allow for a tertiary operator
  required?: "required" | "not-required";
  disabled?: "disabled" | "not-disabled";
  readonly?: "readonly" | "not-readonly";
  availableValues?: string[]; // For value lists
  addAttributes?: Record<string, string>;
  removeAttributes: string[];
  addClasses: string[];
  removeClasses: string[];
}

