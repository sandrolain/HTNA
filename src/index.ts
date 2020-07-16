import { HTNAElement, HTNAElementConfig, DefinedHTMLElement } from "./HTNAElement";

export * from "./HTNAElement";
export * from "./HTNAInputElement";
export * from "./DOMAccess";
export * from "./AttributesAccess";
export * from "./SlotAccess";


/**
 * The *create()* function provides a simple method to create a new type of Custom Element
 * @param config
 */
export function create (config: HTNAElementConfig): DefinedHTMLElement {
  return class extends HTNAElement {
    static config = config;
  } as unknown as DefinedHTMLElement;
}
