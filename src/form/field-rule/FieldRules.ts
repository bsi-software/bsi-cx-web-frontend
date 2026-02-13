import {ExprEval} from '../../index';

export class FieldRules {

  /**
   * See Java code: BsiHtmlAttributes#JSON_DOCUMENT.
   */
  static JSON_DOCUMENT_ATTRIBUTE = 'data-bsi-json-document';
  static DEBOUNCE_DELAY = 100;

  cachedRulesJson = new Map<string, Rules>();
  attachedListeners: WeakSet<Element> = new WeakSet();
  debounceTimers: WeakMap<HTMLFormElement, number> = new WeakMap();

  constructor() {
  }

  /**
   * Public function to be called to initialize the field rules framework on all forms in the document.
   *
   * @throws Error if content of attribute <code>data-bsi-json-document</code> is not a valid JSON document.
   */
  init() {
    const forms = document.querySelectorAll<HTMLFormElement>('form');
    forms.forEach((form) => {
      const formId = form.id;
      if (!formId) {
        console.warn('Skipping form without ID attribute', form);
        return;
      }

      const jsonDocAttr = form.getAttribute(FieldRules.JSON_DOCUMENT_ATTRIBUTE);
      if (jsonDocAttr) {
        this.initRules(formId, jsonDocAttr);
        this.applyRules(form);
      }
    });
  }

  /**
   * @throws Error if content of attribute <code>data-bsi-json-document</code> is not a valid JSON document.
   */
  protected initRules(formId: string, jsonDocAttr: string) {
    const rulesJson = JSON.parse(this.unescapeHtmlEntities(jsonDocAttr));
    if (Array.isArray(rulesJson.rules)) {
      this.cachedRulesJson.set(formId, rulesJson);
    }

    let registeredRadios: HTMLElement[] = [];
    const form = document.getElementById(formId) as HTMLFormElement;
    for (const rule of rulesJson.rules as Rule[]) {
      const sourceEl = document.getElementById(rule.source) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (!sourceEl) {
        console.warn(`Source element "${rule.source}" not found for form "${formId}"`);
        continue;
      }
      this.attachEventListeners(form, sourceEl);
      if (this.isRadio(sourceEl)) {
        registeredRadios.push(sourceEl);
      }
    }

    // Because radios do not trigger a 'change' event when they become unselected, we must register
    // a change event on every radio in the form, that does not already have a registered event handler
    // because of a form rule.
    for (const radioEl of registeredRadios) {
      const name = radioEl.getAttribute('name');
      if (!name) {
        console.warn('Found a radio element but name attribute is missing or empty. Cannot attach event listeners.', radioEl);
        continue;
      }
      const query = `input[type="radio"][name="${CSS.escape(name)}"]`;
      const radios = form.querySelectorAll<HTMLInputElement>(query);
      radios.forEach(otherRadioEl => {
        if (otherRadioEl !== radioEl) {
          this.attachEventListeners(form, otherRadioEl);
        }
      });
    }
  }

  protected attachEventListeners(form: HTMLFormElement, element: HTMLElement) {
    if (this.attachedListeners.has(element)) {
      return;
    }
    const eventHandler = () => this.debouncedApplyRules(form);
    element.addEventListener('input', eventHandler);
    element.addEventListener('change', eventHandler);
    this.attachedListeners.add(element);
  }

  protected isRadio(element: HTMLElement): boolean {
    return element instanceof HTMLInputElement && element.type === 'radio';
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
      if (!sourceEl) {
        continue;
      }

      // If no 'condition' is set, the rule is always applied - this makes sense if the rule works with dynamic values.
      // In case an exception occurs, we try to process the other rules anyway.
      let apply = false;
      if (rule.condition) {
        try {
          apply = this.expressionMatches(sourceEl, rule.condition);
        } catch (e) {
          console.warn('Failed to evaluate rule condition (1). Maybe there is a syntax error in the expression ' +
            'or the source or some targets are invalid, or use an invalid ID. The exception was (2)', rule, e);
          continue;
        }
      } else {
        apply = true;
      }

      if (!apply) {
        console.debug('Skipping rule (1) for source element (2) because expression (3) does not apply.',
          rule, sourceEl, rule.condition);
        continue;
      }

      for (const targetId of rule.targets) {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) {
          continue;
        }
        console.debug('Applying rule (1) for source element (2) for target (3)', rule, sourceEl, targetEl);

        // In case an exception occurs, we try to process the other rules anyway.
        try {
          this.applyRule(rule, sourceEl, targetEl);
        } catch (e) {
          console.warn('Failed to process rule actions (1). Maybe there is a syntax error in the expression ' +
            'or the source or some targets are invalid, or use an invalid ID. The exception was (2)', rule, e);
        }
      }
    }
  }

  protected applyRule(rule: Rule, sourceEl: HTMLInputElement, targetEl: HTMLElement) {
    if (rule.visible) {
      this.ruleDispatcher.visible(sourceEl, targetEl, rule.visible);
    }
    if (rule.required) {
      this.ruleDispatcher.required(sourceEl, targetEl, rule.required);
    }
    if (rule.disabled) {
      this.ruleDispatcher.disabled(sourceEl, targetEl, rule.disabled);
    }
    if (rule.readonly) {
      this.ruleDispatcher.readonly(sourceEl, targetEl, rule.readonly);
    }
    if (rule.addAttributes) {
      this.ruleDispatcher.addAttributes(targetEl, rule.addAttributes);
    }
    if (rule.removeAttributes) {
      this.ruleDispatcher.removeAttributes(targetEl, rule.removeAttributes);
    }
    if (rule.addClasses) {
      this.ruleDispatcher.addClasses(targetEl, rule.addClasses);
    }
    if (rule.removeClasses) {
      this.ruleDispatcher.removeClasses(targetEl, rule.removeClasses);
    }
  }

  ruleDispatcher = {
    visible: (source: HTMLElement, target: HTMLElement, value: string) => {
      let display = this.booleanToDisplayValue(this.expressionEval(source, value));
      target.style.display = display;
      // Also change the visibility of the associated label
      const label = document.querySelector(`label[for="${target.id}"]`) as HTMLElement;
      if (label) {
        label.style.display = display;
      }
    },
    required: (source: HTMLElement, target: HTMLElement, value: string) => {
      if ('required' in target) {
        (target as any).required = this.expressionMatches(source, value);
      }
    },
    disabled: (source: HTMLElement, target: HTMLElement, value: string) => {
      if ('disabled' in target) {
        (target as any).disabled = this.expressionMatches(source, value);
      }
    },
    readonly: (source: HTMLElement, target: HTMLElement, value: string) => {
      if ('readOnly' in target) {
        (target as any).readOnly = this.expressionMatches(source, value);
      }
    },
    addAttributes: (el: HTMLElement, attrs: Record<string, string>) => {
      for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
      }
    },
    removeAttributes: (el: HTMLElement, attrs: string[]) => {
      for (const key of attrs) {
        el.removeAttribute(key);
      }
    },
    addClasses: (el: HTMLElement, classes: string[]) => {
      classes.forEach(cls => el.classList.add(cls));
    },
    removeClasses: (el: HTMLElement, classes: string[]) => {
      classes.forEach(cls => el.classList.remove(cls));
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

  protected booleanToDisplayValue(value: any): '' | 'none' {
    return !!value ? '' : 'none';
  }
}

interface Rules {
  rules: Rule[];
}

/**
 * Definition for 'Rule' object.
 */
interface Rule {
  source: string;
  targets: string[];
  /**
   * This optional property defines an expression which must evaluate to a boolean.
   * If the condition is <code>true</code>, the rule is applied. Otherwise, the rule is ignored.
   * If no condition is defined, the rule is always applied. In that case you should use a dynamic
   * value for the properties or functions to be set or executed on the targets.
   * <br>
   * For instance, you can define a rule for a checkbox without an expression. And set the visible state
   * of the target like this:
   * <pre>
   * visible: 'source.checked'
   * </pre>
   */
  condition?: string;
  /**
   * Optional property to control the <em>visibility</em> of the target elements (DOM property 'display').
   * If set, the string contains an expression which is evaluated to a boolean.
   */
  visible?: string;
  /**
   * Optional property to control the <em>required</em> state of the target elements.
   * If set, the string contains an expression which is evaluated to a boolean.
   */
  required?: string;
  /**
   * Optional property to control the <em>disabled</em> state of the target elements.
   * If set, the string contains an expression which is evaluated to a boolean.
   */
  disabled?: string;
  /**
   * Optional property to control the <em>readonly</em> state of the target elements.
   * If set, the string contains an expression which is evaluated to a boolean.
   */
  readonly?: string;
  addAttributes?: Record<string, string>;
  removeAttributes: string[];
  addClasses: string[];
  removeClasses: string[];
}

