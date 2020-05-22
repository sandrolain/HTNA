import { HTNAElement, DefineConfig, DefinedHTMLElement } from "./HTNAElement";

export * from "./HTNAElement";
export * from "./DOMAccess";
export * from "./AttributesAccess";
export * from "./SlotAccess";


/**
 * The *create()* function provides a simple method to create a new type of Custom Element
 * @param config
 */
export function create (config: DefineConfig): DefinedHTMLElement {
  return class extends HTNAElement {
    static config = config;
  } as unknown as DefinedHTMLElement;
}
