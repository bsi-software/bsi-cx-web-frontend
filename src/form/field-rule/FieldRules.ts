import {ExprEval} from '../../index';

export class FieldRules {

  /**
   * See Java code: BsiHtmlAttributes#JSON_DOCUMENT.
   */
  static JSON_DOCUMENT_ATTRIBUTE = 'data-bsi-json-document';
  static DEBOUNCE_DELAY = 100;

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

      const jsonDocAttr = form.getAttribute(FieldRules.JSON_DOCUMENT_ATTRIBUTE);
      if (jsonDocAttr) {
        this.initRules(formId, jsonDocAttr);
        this.applyRules(form);
      }
    });
  }

  protected initRules(formId: string, jsonDocAttr: string) {
    try {
      const rulesJson = JSON.parse(this.unescapeHtmlEntities(jsonDocAttr));
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

  protected expressionEval(source: HTMLElement, expression: string): any {
    return new ExprEval(expression).eval(source);
  }

  protected expressionMatches(source: HTMLElement, expression: string): boolean {
    return new ExprEval(expression).matches(source);
  }

  protected applyRules(form: HTMLFormElement) {
    const formId = form.id;
    if (!formId) return;

    const rulesObj = this.cachedRulesJson.get(formId);
    if (!rulesObj || !Array.isArray(rulesObj.rules)) return;

    for (const rule of rulesObj.rules) {
      const sourceEl = form.querySelector<HTMLInputElement>(`#${rule.source}`);
      if (!sourceEl) continue;

      // If no 'expression' is set, the rule is always applied - this makes sense if the rule works with dynamic values.
      let applies = rule.expression ? this.expressionMatches(sourceEl, rule.expression) : true;

      for (const targetId of rule.targets) {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) {
          continue;
        }
        console.debug('Target %o, applies %o, rule %o, targetId %o, value %o', targetEl, applies, rule, targetId);

        // Apply each rule type if defined
        if (rule.visible) {
          this.ruleDispatcher.visible(sourceEl, targetEl, applies, rule.visible);
        }
        if (rule.required) {
          this.ruleDispatcher.required(sourceEl, targetEl, applies, rule.required);
        }
        if (rule.disabled) {
          this.ruleDispatcher.disabled(sourceEl, targetEl, applies, rule.disabled);
        }
        if (rule.readonly) {
          this.ruleDispatcher.readonly(sourceEl, targetEl, applies, rule.readonly);
        }
        if (rule.availableValues) {
          this.ruleDispatcher.availableValues(targetEl, applies, rule.availableValues);
        }
        if (rule.addAttributes) {
          this.ruleDispatcher.addAttributes(targetEl, applies, rule.addAttributes);
        }
        if (rule.removeAttributes) {
          this.ruleDispatcher.removeAttributes(targetEl, applies, rule.removeAttributes);
        }
        if (rule.addClasses) {
          this.ruleDispatcher.addClasses(targetEl, applies, rule.addClasses);
        }
        if (rule.removeClasses) {
          this.ruleDispatcher.removeClasses(targetEl, applies, rule.removeClasses);
        }
      }
    }
  }

  ruleDispatcher = {
    visible: (source: HTMLElement, target: HTMLElement, apply: boolean, value: string) => {
      let display = this.booleanToVisible(this.expressionEval(source, value));
      target.style.display = display;
      // Also change the visibility of the associated label
      const label = document.querySelector(`label[for="${target.id}"]`) as HTMLElement;
      if (label) {
        label.style.display = display;
      }
    },
    required: (source: HTMLElement, target: HTMLElement, apply: boolean, value: string) => {
      if ('required' in target) {
        (target as any).required = this.expressionMatches(source, value);
      }
    },
    disabled: (source: HTMLElement, target: HTMLElement, apply: boolean, value: string) => {
      if ('disabled' in target) {
        (target as any).disabled = this.expressionMatches(source, value);
      }
    },
    readonly: (source: HTMLElement, target: HTMLElement, apply: boolean, value: string) => {
      if ('readOnly' in target) {
        (target as any).readOnly = this.expressionMatches(source, value);
      }
    },
    availableValues: (target: HTMLElement, apply: boolean, value: any[]) => { // TODO [awe] 26.1 dynamic forms: für Wertelisten anpassen
      if (!(target instanceof HTMLSelectElement)) return;

      if (apply) {
        if (!this.originalSelectOptions.has(target)) {
          this.originalSelectOptions.set(target, Array.from(target.options).map(opt => opt.cloneNode(true) as HTMLOptionElement));
        }

        target.innerHTML = '';
        value.forEach(v => {
          const option = document.createElement('option');
          option.value = v;
          option.textContent = v;
          target.appendChild(option);
        });

      } else if (this.originalSelectOptions.has(target)) {
        target.innerHTML = ''; // Clear current options
        this.originalSelectOptions.get(target)?.forEach(opt => target.appendChild(opt.cloneNode(true)));
        this.originalSelectOptions.delete(target);
      }
    },
    addAttributes: (el: HTMLElement, apply: boolean, attrs: Record<string, string>) => {
      if (!this.originalAttributes.has(el)) {
        this.originalAttributes.set(el, new Map());
      }
      const original = this.originalAttributes.get(el)!;
      for (const [key] of Object.entries(attrs)) {
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

  protected unescapeHtmlEntities(encoded: string): string {
    return encoded
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&lbrace/g, '{')
      .replace(/&rbrace;/g, '}');
  }

  protected booleanToVisible(value: any): '' | 'none' {
    return !!value ? '' : 'none';
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
  visible?: 'visible' | 'not-visible'; // Not true or false to allow for a tertiary operator
  required?: 'required' | 'not-required';
  disabled?: 'disabled' | 'not-disabled';
  readonly?: 'readonly' | 'not-readonly';
  availableValues?: string[]; // For value lists
  addAttributes?: Record<string, string>;
  removeAttributes: string[];
  addClasses: string[];
  removeClasses: string[];
}

