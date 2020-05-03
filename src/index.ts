import { HTNAElement, DefineConfig, DefinedHTMLElement } from "./HTNAElement";

export * from "./HTNAElement";
export * from "./DOMAccess";
export * from "./AttributesAccess";
export * from "./SlotAccess";


/** The *Registry* permit access to the defined custom elements classes */
export class Registry {

  static add (elementName: string, constructor: CustomElementConstructor, extend?: string): void {
    if(window.customElements.get(elementName)) {
      throw new Error(`"${elementName}" element already defined`);
    }
    const elementOptions: ElementDefinitionOptions = {};
    if(extend) {
      elementOptions.extends = extend;
    }
    window.customElements.define(elementName, constructor, elementOptions);
  }

  static exists (elementName: string): boolean {
    return !!window.customElements.get(elementName);
  }

  static get (elementName: string): DefinedHTMLElement {
    return window.customElements.get(elementName);
  }

  static upgrade (node: Node): void {
    window.customElements.upgrade(node);
  }
}

/**
 * The *create()* function provides a simple method to create a new type of Custom Element
 * @param config
 */
export function create (config: DefineConfig): DefinedHTMLElement {
  return class extends HTNAElement {
    static config = config;
  } as unknown as DefinedHTMLElement;
}

/**
 * The *define()* function provides a simple method to create a new type of Custom Element and to define it globally
 * @param elementName The tag name of the new Custom Element
 * @param config The configuration, render, controller and callback used by the new Custom Element
 */
export function define (elementName: string, config: DefineConfig): DefinedHTMLElement {
  const CustomElementClass = create(config);
  Registry.add(elementName, CustomElementClass);
  return CustomElementClass;
}
