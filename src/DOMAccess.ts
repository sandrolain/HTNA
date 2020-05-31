
/**
 * Enable access to Element or ShadowDOM nodes
 */
export class DOMAccess {

  constructor (private node: ShadowRoot | HTMLElement) {}

  /**
   * Alias for querySelector inside Element or ShadowDOM
   * @param selector CSS Selector
   */
  $<T=HTMLElement> (selector: string): T {
    return this.node.querySelector(selector) as unknown as T;
  }

  /**
   * Alias for querySelectorAll inside Element or ShadowDOM
   * @param selector CSS Selector
   */
  $$<T=HTMLElement> (selector: string): T[] {
    return Array.from(this.node.querySelectorAll(selector)) as unknown as T[];
  }

  // TODO: docs
  on (source: HTMLElement | string, type: string, listener: (event: Event) => void, options?: AddEventListenerOptions): void {
    const node: HTMLElement = (typeof source === "string") ? this.node.querySelector(source) : source;
    node.addEventListener(type, listener, options);
  }

  // TODO: docs
  delegate (source: HTMLElement | string, type: string, target: string, listener: (event: Event) => void, options?: AddEventListenerOptions): void {
    const node: HTMLElement = (typeof source === "string") ? this.node.querySelector(source) : source;
    node.addEventListener(type, (event: Event) => {
      const eventTarget = event.target as HTMLElement;
      if(eventTarget && eventTarget.matches(target)) {
        listener.call(eventTarget, event);
      }
    }, options);
  }

  /**
   * Permit to dispatch a custom event
   * @param name Event name
   * @param detail Optional detail for the event
   * @param bubbles Flag to enable event bubbles the DOM tree (default: false)
   */
  dispatch (name: string, detail?: any, bubbles: boolean = false): boolean {
    const event = new CustomEvent(name, {
      detail,
      bubbles,
      composed: true,
      cancelable: true
    });
    return this.node.dispatchEvent(event);
  }

  /**
   * Return a Promise that resolves the first time the specified event is fired
   * @param name The name of the event
   */
  when (name: string): Promise<Event> {
    return new Promise((resolve) => {
      const callback = (event: Event): void => {
        this.node.removeEventListener(name, callback);
        resolve(event);
      };
      this.node.addEventListener(name, callback);
    });
  }

  // TODO: test
  // TODO: docs
  empty (): void {
    for(const child of Array.from(this.node.childNodes)) {
      if(child instanceof HTMLStyleElement && child.id === "htna-shadow-style") {
        continue;
      }
      this.node.removeChild(child);
    }
  }

  // TODO: test
  // TODO: docs
  append (value: string | HTMLElement | DocumentFragment): void {
    if(typeof value === "string") {
      const template = document.createElement("template");
      template.innerHTML = value;
      this.node.appendChild(
        template.content.cloneNode(true)
      );
    } else if(value instanceof HTMLTemplateElement) {
      this.node.appendChild(
        value.content.cloneNode(true)
      );
    } else if(value instanceof HTMLElement || value instanceof DocumentFragment) {
      this.node.appendChild(value);
    }
  }
}
