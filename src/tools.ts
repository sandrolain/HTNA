
export type ElementAttributesMap = Map<string, any>;

/**
 * Create a new HTMLElement DOM Node with specified attributes
 * ```typescript
 * // Create a plain HTMLDivElement DOM node
 * element("div");
 * ```
 * ```typescript
 * // Create a HTMLDivElement DOM node with attributes and children
 * element("div", {
 *   style: "border: 1px solid #FF0000; padding: 1em",
 *   title: "My new div element"
 * }, [
 *   "Simple text and",
 *   element("br"),
 *   element("strong", null, ["Bold text"])
 * ]);
 * ```
 * @param tagName The tag name of the element
 * @param attributes A Map with pairs name-value of the attributes to set to the element. Function values will be added as listeners
 * @param children An Array of DOM Node or string to be appended as Element's children
 * @returns The new DOM HTMLElement node for the specied tag name
 */
export const element = (tagName: string, attributes?: ElementAttributesMap, children?: (Node | string)[]): HTMLElement => {
  const node = document.createElement(tagName);
  if(attributes) {
    for(const [name, value] of attributes.entries()) {
      if(typeof value === "function") {
        node.addEventListener(name, value)
      } else {
        node.setAttribute(name, String(value));
      }
    }
  }
  if(children) {
    node.append(...children);
  }
  return node;
};


/**
 * Escape HTML entities
 * @param string The string to escape
 * @returns The escaped HTML string
 */
export const htmlentities = (string: string): string => {
  return string.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export type ForEachIterable =
  | Map<any, any>
  | Array<any>
  | Set<any>
  | Record<string, any>;

/**
 *
 * @param obj
 * @param cb
 */
export function forEach(
  obj: ForEachIterable,
  cb: (value: any, key: any) => any
): void {
  if (obj) {
    if (obj instanceof Map || obj instanceof Array || obj instanceof Set) {
      obj.forEach(cb);
    } else if (typeof obj === "object") {
      for (const key in obj) {
        cb.call(obj, obj[key], key);
      }
    }
  }
}
