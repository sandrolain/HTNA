
/** Data type for the accepted result from the render() function as ShadowDOM content */
export type Template = string | HTMLElement | DocumentFragment;

/** Data type for the Map of attributes passed as arguments to functions render(), controller() and getAttributesMap() method */
export type AttributesMap = Map<string, any>;

/** Data type for the accepted content for slots */
export type SlotContent = HTMLElement | DocumentFragment | Text | string | number;

/** Interface of arguments for render() and controller() functions */
export interface ControllerArguments {
  /** DOM Element Node for the current instance */
  elementNode: HTMLElement;
  /** Instance of *ShadowDOMAccess* for the ShadowDOM of current Element */
  shadowDOMAccess: ShadowDOMAccess;
  /** Map with the freezed status of attributes  */
  attributesMap: AttributesMap;
}

/**
 * Base callback for ControllerResult
 */
export type BaseCallback = () => void;

/**
 * Attribute change callback callback for ControllerResult
 * @param name The name of the changed attribute
 */
export type AttributeChangedCallback = (name: string, oldValue: string, newValue: string) => void

/** Interface of expected result from controller() function invocation */
export interface ControllerResult {
  /** Executed at native custom element connectedCallback() */
  connectedCallback?: BaseCallback;
  /** Executed at native custom element disconnectedCallback() */
  disconnectedCallback?: BaseCallback;
  /** Executed at native custom element adoptedCallback() */
  adoptedCallback?: BaseCallback;
  /** Executed at native custom element attributeChangedCallback() */
  attributeChangedCallback?: AttributeChangedCallback;
  /** Record of event listeners to add to the Element */
  listeners?: Record<string, EventListenerOrEventListenerObject>;
}

/** Type of rendering function used to generate the custom element HTML content */
export type RenderFunction = (controllerArguments: ControllerArguments) => Template;
/** Type of controller function to apply Element logic */
export type ControllerFunction = (controllerArguments: ControllerArguments) => ControllerResult;

export interface DefineConfig {
  /** Rendering function used to generate the custom element HTML content */
  render: RenderFunction;
  /** Style CSS string for Element ShadowDOM */
  style?: string;
  /** Controller function to apply Element logic */
  controller?: ControllerFunction;
  /** Map with initial attributes values */
  attributes?: AttributesMap;
  /** Schema definition for types, observed and property attributes */
  attributesSchema?: AttributesSchema;
  // Shadow DOM mode
  mode?: "open" | "closed";
  // Tag name to extend
  extends?: string;
}

/** Type of Attribute type specification */
export type AttributeType = (value: string) => any;

/** Interface for the Attributes Schema */
export interface AttributesSchema {
  /** Attribute name specified as the key of schema item */
  [key: string]: {
    /** Specify the type of the attribute as parsing function.<br/>
     * The native primitive types classes could ben used (Boolean, String, Number, ecc)
     */
    type?: AttributeType;
    /** Flag to indicate if the current attribute should be observed and trigger the *attributeChangedCallback()* */
    observed?: boolean;
    /** Flag to indicate if the current attribute could be accessible as DOM Element Node property */
    property?: boolean;
  };
}

export const AttributeTypes: {[key: string]: AttributeType} = {
  JSON: (value: string): any => JSON.parse(value),
  Boolean: Boolean,
  String: String,
  Number: Number
};

/**
 * Map for the available attributes value serializer.<br/>
 * Map's items key must be the *AttributeType* class for the data type<br/>
 * Map's items value can be a serializer function that accept attribute value and return the serialized data as string
 */
export const AttributeTypesSerialize: Map<AttributeType, (value: any) => string> = new Map();

AttributeTypesSerialize.set(AttributeTypes.JSON, function (value: any): string {
  return JSON.stringify(value);
});

/**
 * Map for the available attributes value unserializer.<br/>
 * Map's items key must be the *AttributeType* class for the data type<br/>
 * Map's items value can be a unserializer function that accept attribute serialized value and return the correct schema type
 */
export const AttributeTypesUnserialize: Map<AttributeType, (value: string) => any> = new Map();

AttributeTypesUnserialize.set(Boolean, function (value: string): boolean {
  if(value === "false" || value === "off" || value === "") {
    return false;
  }
  return Boolean(value);
});

/**
 * Enable access to ShadowDOM nodes
 */
export class ShadowDOMAccess {
  #shadow: ShadowRoot;

  constructor (shadow: ShadowRoot) {
    this.#shadow = shadow;
  }

  /**
   * Alias for querySelector inside Element's ShadowDOM
   * @param selector CSS Selector
   */
  $ (selector: string): HTMLElement {
    return this.#shadow.querySelector(selector);
  }

  /**
   * Alias for querySelectorAll inside Element's ShadowDOM
   * @param selector CSS Selector
   */
  $$ (selector: string): NodeList {
    return this.#shadow.querySelectorAll(selector);
  }
}

/**
 * Extended HTMLElement for user defined elements with define() function
 * @noInheritDoc
 */
export interface DefinedHTMLElement extends HTMLElement {
  new(): HTMLElement;
  prototype: HTMLElement;

  /**
   * Permit to fire a custom event
   * @param name Event name
   * @param detail Optional detail for the event
   * @param bubbles Flag to enable event bubbles the DOM tree (default: false)
   */
  fireEvent (name: string, detail?: any, bubbles?: boolean): boolean;

  /**
   * Return a Promise that resolves the first time the specified event is fired
   * @param name The name of the event
   */
  when (name: string): Promise<Event>;

  /**
   * Returns the frozen state of the Element attributes
   */
  getAttributesMap (): AttributesMap;

  /**
   * Return the element's attribute value with the correct type as defined into the attributes schema
   * @param name The name of the attribute
   */
  getAttributeValue (name: string): any;

  /**
   * Allows to set the value of an Element attribute according to what is provided by the attributes schema
   * @param name The name of the attribute
   * @param value The value of the attribute
   */
  setAttributeValue (name: string, value: any): void;

  /**
   * Append into the Element the content for the slot specified by its name
   * @param slotName The name of the slot
   * @param node Content for the the slot as expected from *SlotContent*
   * @param tagName The tag name of the wrapper element for the slot content (default: "div")
   */
  appendSlot (slotName: string, content: SlotContent, tagName?: string): HTMLElement;

  /**
   * Replace into the Element the content for the slot specified by its name
   * @param slotName The name of the slot
   * @param node Content for the the slot as expected from *SlotContent*
   * @param tagName The tag name of the wrapper element for the slot content (default: "div")
   */
  replaceSlot (slotName: string, content: SlotContent, tagName?: string): HTMLElement;

  /**
   * Remove from the Element the content for the slot specified by its name
   * @param slotName The name of the slot
   */
  removeSlot (slotName: string): HTMLElement;

  /** Other properties of the node for accessing the values of the attributes in accordance with the *AttributesSchema* */
  [key: string]: any;
}


const elementsMap: Map<string, DefinedHTMLElement> = new Map();


export function define (elementName: string, config: DefineConfig): DefinedHTMLElement {

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
    static get TAG_NAME (): string {
      return elementName;
    }
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
      if(this.#controllerResult.listeners) {
        for(const name in this.#controllerResult.listeners) {
          this.addEventListener(name, this.#controllerResult.listeners[name]);
        }
      }

      if(this.#controllerResult.connectedCallback) {
        this.#controllerResult.connectedCallback();
      }
    }

    disconnectedCallback (): void {
      if(this.#controllerResult.listeners) {
        for(const name in this.#controllerResult.listeners) {
          this.removeEventListener(name, this.#controllerResult.listeners[name]);
        }
      }

      if(this.#controllerResult.disconnectedCallback) {
        this.#controllerResult.disconnectedCallback();
      }
    }

    adoptedCallback (): void {
      if(this.#controllerResult.adoptedCallback) {
        this.#controllerResult.adoptedCallback();
      }
    }

    attributeChangedCallback (name: string, oldValue: any, newValue: any): void {
      if(this.#controllerResult.attributeChangedCallback) {
        this.#controllerResult.attributeChangedCallback(name, oldValue, newValue);
      }
    }

    fireEvent (name: string, detail?: any, bubbles: boolean = false): boolean {
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

    appendSlot (slotName: string, node: SlotContent, tagName: string = "div"): HTMLElement {
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

    replaceSlot (slotName: string, node: SlotContent, tagName: string = "div"): HTMLElement {
      this.removeSlot(slotName);
      return this.appendSlot(slotName, node, tagName);
    }

    removeSlot (slotName: string): HTMLElement {
      const slotNode = this.querySelector<HTMLElement>(`*[slot="${slotName}"]`);
      if(slotNode) {
        this.removeChild(slotNode);
      }
      return slotNode;
    }
  } as unknown as DefinedHTMLElement;

  const elementOptions: ElementDefinitionOptions = {};

  if(config.extends) {
    elementOptions.extends = config.extends;
  }

  customElements.define(elementName, ElementClass, elementOptions);

  elementsMap.set(elementName, ElementClass);

  return ElementClass;
}

/**
 * Helper method for create
 * @param elementName Custom element Tag name
 * @param options Options for the document.createElement() method
 * @param targetDocument The Document instance over to create the new Element node
 */
export function create (elementName: string, options?: ElementCreationOptions, targetDocument: Document = document): DefinedHTMLElement {
  const elementType = elementsMap.get(elementName);
  if(!elementType) {
    throw new Error(`"${elementName}" is not a defined custom element`);
  }
  return targetDocument.createElement(elementName, options) as unknown as typeof elementType;
}

/**
 * The *Registry* permit access to the defined custom elements classes and
 */
export class Registry {
  static getType (elementName: string): DefinedHTMLElement {
    return elementsMap.get(elementName);
  }
}
