

export type AttributeParseFunction = (value: string) => any;
export interface AttributesSchema {
  [key: string]: {
    type?: AttributeParseFunction;
    observed?: boolean;
    property?: boolean;
  };
}

export type Template = string | HTMLElement | DocumentFragment;
export type AttributesMap = Map<string, any>;
export type SlotContentAttribute = HTMLElement | DocumentFragment | Text | string | number;
export interface ControllerArguments {
  elementNode: HTMLElement;
  shadowDOMAccess: ShadowDOMAccess;
  attributesMap: AttributesMap;
}
export interface ControllerResult {
  connectedCallback?: () => void;
  disconnectedCallback?: () => void;
  adoptedCallback?: () => void;
  attributeChangedCallback?: (name: string, oldValue: string, newValue: string) => void;
  listeners?: Record<string, (event: Event) => any>;
}

export type RenderFunction = (controllerArguments: ControllerArguments) => Template;
export type ControllerFunction = (controllerArguments: ControllerArguments) => ControllerResult;

export interface DefineConfig {
  /** Rendering function used to generate the custom element HTML content */
  render: RenderFunction;
  style?: string;
  controller?: ControllerFunction;
  attributes?: AttributesMap;
  attributesSchema?: AttributesSchema;
  listeners?: {
    [key: string]: EventListenerOrEventListenerObject;
  };
  // Shadow DOM
  mode?: "open" | "closed";
  // ElementDefinitionOptions
  extends?: string;
}

export type AttributeType = (value: string) => any;

export const AttributeTypes: {[key: string]: AttributeType} = {
  JSON: function (value: string): any {
    return JSON.parse(value);
  },
  Boolean: Boolean,
  String: String,
  Number: Number
};

export const AttributeTypesSerialize: Map<AttributeType, (value: any) => string> = new Map();

AttributeTypesSerialize.set(AttributeTypes.JSON, function (value: any): string {
  return JSON.stringify(value);
});



export const AttributeTypesUnserialize: Map<AttributeType, (value: string) => any> = new Map();

AttributeTypesUnserialize.set(Boolean, function (value: string): boolean {
  if(value === "false" || value === "off" || value === "") {
    return false;
  }
  return Boolean(value);
});

export class ShadowDOMAccess {
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

export type DefinedElement = typeof HTMLElement;

const elementsMap: Map<string, DefinedElement> = new Map();


export function define (elementName: string, config: DefineConfig): DefinedElement {

  if(customElements.get(elementName)) {
    throw new Error(`"${elementName}" element already defined`);
  }

  const attributesSchema: Record<string, AttributeType> = {};
  const observedAttributes: string[] = [];
  const propertyAttributes: string[] = [];

  if(config.attributesSchema) {
    for(const name in config.attributesSchema) {
      const attribute = config.attributesSchema[name];
      if(attribute.type) {
        attributesSchema[name] = attribute.type;
      }
      if(attribute.observed) {
        observedAttributes.push(name);
      }
      if(attribute.property) {
        propertyAttributes.push(name);
      }
    }
  }

  const ElementClass = class extends HTMLElement {
    static get observedAttributes (): string[] {
      return observedAttributes;
    }

    #shadow: ShadowRoot;
    #shadowDOMAccess: ShadowDOMAccess;
    #controllerResult: ControllerResult = {};

    constructor () {
      super();

      this.#shadow = this.attachShadow({
        mode: config.mode || "closed"
      });

      if(config.attributes) {
        this.setAttributesMap(config.attributes);
      }

      // Add getter / setter for properties
      for(const attributeName of propertyAttributes) {
        Object.defineProperty(this, attributeName, {
          get: () => this.getAttributeValue(attributeName),
          set: (value: any) => this.setAttributeValue(attributeName, value)
        });
      }

      this.#shadowDOMAccess = new ShadowDOMAccess(this.#shadow);

      const controllerArguments: ControllerArguments = {
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
      // TODO: Add listeners

      if(this.#controllerResult.connectedCallback) {
        this.#controllerResult.connectedCallback();
      }
      const event = new CustomEvent("connected");
      this.dispatchEvent(event);
    }

    disconnectedCallback (): void {
      // TODO: Remove listeners

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
        detail,
        bubbles,
        composed: true,
        cancelable: true
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

    getAttributesMap (): AttributesMap {
      const attributes = this.attributes;
      const attributesMap: AttributesMap = new Map();

      for(let i = 0, len = attributes.length; i < len; i++) {
        const attributeName = attributes[i].name;
        attributesMap.set(attributeName, this.getAttributeValue(attributeName));
      }

      return attributesMap;
    }

    setAttributesMap (attributesMap: AttributesMap): void {
      for(const [name, value] of attributesMap) {
        this.setAttributeValue(name, value);
      }
    }

    getAttributeValue (name: string): any {
      let   value  = this.getAttribute(name);
      const schema = attributesSchema[name];

      if(schema) {
        const unserializer = AttributeTypesUnserialize.get(schema);
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

      if(schema && AttributeTypesSerialize.has(schema)) {
        const serializer = AttributeTypesSerialize.get(schema);
        value = serializer(value);
      }

      this.setAttribute(name, value.toString());
    }

    replaceSlot (slotName: string, node: SlotContentAttribute, tagName: string = "div"): HTMLElement {
      this.removeSlot(slotName);
      return this.appendSlot(slotName, node, tagName);
    }

    appendSlot (slotName: string, node: SlotContentAttribute, tagName: string = "div"): HTMLElement {
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
}

export class Registry {
  static getType (elementName: string): DefinedElement {
    return elementsMap.get(elementName);
  }
}
