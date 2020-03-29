
export interface DefineAttributesSchema {
  [key: string]: (value: string) => any;
}

export type DefineTemplate = string | HTMLElement | DocumentFragment;
export type DefineAttributesMap = Map<string, any>;
export type DefineSlotContentAttribute = HTMLElement | DocumentFragment | Text | string | number;
export interface DefineControllerArguments {
  elementNode: HTMLElement;
  shadowDOMAccess: DefineShadowDOMAccess;
  attributesMap: DefineAttributesMap;
}
export interface DefineControllerResult {
  connectedCallback?: () => void;
  disconnectedCallback?: () => void;
  adoptedCallback?: () => void;
  attributeChangedCallback?: (name: string, oldValue: string, newValue: string) => void;
}

export type DefineRenderFunction = (controllerArguments: DefineControllerArguments) => DefineTemplate;
export type DefineControllerFunction = (controllerArguments: DefineControllerArguments) => DefineControllerResult;

export interface DefineConfig {
  /** Rendering function used to generate the custom element HTML content */
  render: DefineRenderFunction;
  style?: string;
  controller?: DefineControllerFunction;
  attributesSchema?: DefineAttributesSchema;
  attributes?: DefineAttributesMap;
  observedAttributes?: string[];
  listeners?: {
    [key: string]: EventListenerOrEventListenerObject;
  };
  // Shadow DOM
  mode?: "open" | "closed";
  // ElementDefinitionOptions
  extends?: string;
}

export type DefineType = (value: string) => any;

export const DefineTypes: {[key: string]: DefineType} = {
  JSON: function (value: string): any {
    return JSON.parse(value);
  },
  Boolean: Boolean
};

export const DefineTypesSerialize: Map<DefineType, (value: any) => string> = new Map();
DefineTypesSerialize.set(DefineTypes.JSON, function (value: any): string {
  return JSON.stringify(value);
});

export const DefineTypesUnserialize: Map<DefineType, (value: string) => any> = new Map();
DefineTypesUnserialize.set(Boolean, function (value: string): boolean {
  if(value === "false" || value === "off" || value === "") {
    return false;
  }
  return Boolean(value);
});

export class DefineShadowDOMAccess {
  #shadow: ShadowRoot;
  constructor (shadow: ShadowRoot) {
    this.#shadow = shadow;
  }

  $ (selector: string): HTMLElement {
    return this.#shadow.querySelector(selector);
  }

  $$ (selector: string): NodeList {
    return this.#shadow.querySelectorAll(selector);
  }
}

export function define (elementName: string, config: DefineConfig): typeof HTMLElement {

  if(customElements.get(elementName)) {
    throw new Error(`"${elementName}" element already defined`);
  }

  const attributesSchema: DefineAttributesSchema = config.attributesSchema || {};
  const observedAttributes: string[] = config.observedAttributes || [];

  const ElementClass = class extends HTMLElement {
    static get observedAttributes (): string[] {
      return observedAttributes;
    }

    #shadow: ShadowRoot;
    #shadowDOMAccess: DefineShadowDOMAccess;
    #controllerResult: DefineControllerResult = {};

    constructor () {
      super();

      this.#shadow = this.attachShadow({
        mode: config.mode || "closed"
      });

      if(config.attributes) {
        this.setAttributesMap(config.attributes);
      }

      this.#shadowDOMAccess = new DefineShadowDOMAccess(this.#shadow);

      const controllerArguments: DefineControllerArguments = {
        elementNode: this,
        shadowDOMAccess: this.#shadowDOMAccess,
        attributesMap: this.getAttributesMap()
      };

      if(config.render) {
        const renderResult = config.render(controllerArguments);

        if(typeof renderResult === "string") {
          this.#shadow.innerHTML = renderResult;
        } else if(renderResult instanceof HTMLTemplateElement) {
          this.#shadow.appendChild(
            renderResult.content.cloneNode(true)
          );
        } else if(renderResult instanceof HTMLElement || renderResult instanceof DocumentFragment) {
          this.#shadow.appendChild(renderResult);
        }
      }

      if(config.style) {
        const styleNode = document.createElement("style");
        styleNode.setAttribute("type", "text/css");
        styleNode.innerHTML = config.style;
        this.#shadow.appendChild(styleNode);
      }

      if(config.controller) {
        this.#controllerResult = config.controller(controllerArguments) || {};
      }
    }

    connectedCallback (): void {
      if(this.#controllerResult.connectedCallback) {
        this.#controllerResult.connectedCallback();
      }
      const event = new CustomEvent("connected");
      this.dispatchEvent(event);
    }

    disconnectedCallback (): void {
      if(this.#controllerResult.disconnectedCallback) {
        this.#controllerResult.disconnectedCallback();
      }
      const event = new CustomEvent("disconnected");
      this.dispatchEvent(event);
    }

    adoptedCallback (): void {
      if(this.#controllerResult.adoptedCallback) {
        this.#controllerResult.adoptedCallback();
      }
      const event = new CustomEvent("adopted");
      this.dispatchEvent(event);
    }

    attributeChangedCallback (name: string, oldValue: any, newValue: any): void {
      if(this.#controllerResult.attributeChangedCallback) {
        this.#controllerResult.attributeChangedCallback(name, oldValue, newValue);
      }
      const eventNames = ["attributechanged", `attributechanged:${name}`];
      for(const eventName of eventNames) {
        const event = new CustomEvent(eventName, { detail: { name, oldValue, newValue } });
        this.dispatchEvent(event);
      }
    }

    bubbleEvent (name: string, detail: any): boolean {
      return this.fireEvent(name, detail, true);
    }

    fireEvent (name: string, detail: any, bubbles: boolean = false): boolean {
      const event = new CustomEvent(name, {
        bubbles,
        composed: true,
        detail
      });
      return this.dispatchEvent(event);
    }

    when (name: string): Promise<Event> {
      return new Promise((resolve) => {
        const callback = (event: Event): void => {
          this.removeEventListener(name, callback);
          resolve(event);
        };
        this.addEventListener(name, callback);
      });
    }

    getAttributesMap (): DefineAttributesMap {
      const attributes = this.attributes;
      const attributesMap: DefineAttributesMap = new Map();

      for(let i = 0, len = attributes.length; i < len; i++) {
        const attributeName = attributes[i].name;
        attributesMap.set(attributeName, this.getAttributeValue(attributeName));
      }

      return attributesMap;
    }

    setAttributesMap (attributesMap: DefineAttributesMap): void {
      for(const [name, value] of attributesMap) {
        this.setAttributeValue(name, value);
      }
    }

    getAttributeValue (name: string): any {
      let   value  = this.getAttribute(name);
      const schema = attributesSchema[name];

      if(schema) {
        const unserializer = DefineTypesUnserialize.get(schema);
        if(unserializer) {
          value = unserializer(value);
        } else {
          value = schema(value);
        }
      }

      return value;
    }

    setAttributeValue (name: string, value: any): void {
      const schema = attributesSchema[name];

      if(schema && DefineTypesSerialize.has(schema)) {
        const serializer = DefineTypesSerialize.get(schema);
        value = serializer(value);
      }

      this.setAttribute(name, value.toString());
    }

    replaceSlot (slotName: string, node: DefineSlotContentAttribute, tagName: string = "div"): HTMLElement {
      this.removeSlot(slotName);
      return this.appendSlot(slotName, node, tagName);
    }

    appendSlot (slotName: string, node: DefineSlotContentAttribute, tagName: string = "div"): HTMLElement {
      const slotNode = document.createElement(tagName);
      slotNode.setAttribute("slot", slotName);
      if(["string", "number"].includes(typeof node)) {
        node = document.createTextNode(node.toString());
        slotNode.appendChild(node);
      } else {
        slotNode.appendChild(node as Node);
      }
      this.appendChild(slotNode);
      return slotNode;
    }

    removeSlot (slotName: string): HTMLElement {
      const slotNode = this.querySelector<HTMLElement>(`*[slot="${slotName}"]`);
      if(slotNode) {
        this.removeChild(slotNode);
      }
      return slotNode;
    }
  };

  const elementOptions: ElementDefinitionOptions = {};

  if(config.extends) {
    elementOptions.extends = config.extends;
  }

  customElements.define(elementName, ElementClass, elementOptions);

  return ElementClass;
};
