import { DefinedHTMLElement } from "./HTNAElement";

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
