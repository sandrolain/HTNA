import { forEach } from "./utils";

export type ElementAttributesMap = Map<string, any> | Record<string, any>;
export type ElementChildrenArray = (Node | string | ElementParamsArray)[];
export type ElementParamsArray   = [string, ElementAttributesMap?, ElementChildrenArray?, ElementCreationOptions?];

/**
 * Create a new HTMLElement DOM Node with specified attributes
 * ```typescript
 * // Create a plain HTMLDivElement DOM node
 * const divNode = element("div");
 * ```
 * <br/>
 *
 * ```typescript
 * // Create a HTMLDivElement DOM node with attributes and children
 * const divStyledNode = create("div", {
 *   style: "border: 1px solid #FF0000; padding: 1em",
 *   title: "My new div element"
 * }, [
 *   "Simple text and",
 *   element("br"),
 *   element("strong", null, ["Bold text"])
 * ]);
 * ```
 *
 * Result:<br/>
 * <div style="border: 1px solid #FF0000; padding: 1em" title="My new div element">Simple text and<br/><strong>Bold text</strong></div>
 * <br/>
 *
 * @param tagName The tag name of the element
 * @param attributes A Map with pairs name-value of the attributes to set to the element. Function values will be added as listeners
 * @param children An Array of DOM Node or string to be appended as Element's children
 * @param options
 * @param targetDocument
 * @returns The new DOM HTMLElement node for the specified tag name
 */
export function create<T=HTMLElement> (
  tagName: string,
  attributes?: ElementAttributesMap,
  children?: ElementChildrenArray,
  options?: ElementCreationOptions,
  targetDocument: Document = document
): T {
  const node = targetDocument.createElement(tagName, options);
  if(attributes) {
    forEach(attributes, (value, name) => {
      if(typeof value === "function") {
        node.addEventListener(name, value);
      } else {
        node.setAttribute(name, String(value));
      }
    });
  }
  if(children) {
    for(let child of children) {
      if(["string", "number"].includes(typeof child)) {
        child = document.createTextNode(child.toString());
        node.appendChild(child);
      } else if(child instanceof Node) {
        node.appendChild(child);
      } else if(Array.isArray(child)) {
        child = create(child[0], child[1], child[2], child[3], targetDocument) as HTMLElement;
        node.appendChild(child);
      }
    }
  }
  return node as unknown as T;
}

// TODO: docs
export function $<T=HTMLElement> (selector: string, targetElement: Document | HTMLElement = document): T {
  return targetElement.querySelector(selector) as unknown as T;
}

// TODO: docs
export function $$<T=HTMLElement> (selector: string, targetElement: Document | HTMLElement = document): T[] {
  return Array.from(targetElement.querySelectorAll(selector)) as unknown as T[];
}

// TODO: docs
export function at (selector: string | HTMLElement, eventName: string, listener: EventListenerOrEventListenerObject): boolean {
  const node = (typeof selector === "string") ? $(selector) : selector;
  if(node) {
    node.addEventListener(eventName, listener);
    return true;
  }
  return false;
}


/**
 * Escape HTML entities
 * @param string The string to escape
 * @returns The escaped HTML string
 */
export function htmlEntities (string: string): string {
  return string.replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
