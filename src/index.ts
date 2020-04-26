// Utils
function camelCase (str: string): string {
  return str.replace(/-\D/g, function (m: string): string {
    return m.charAt(1).toUpperCase();
  });
}

/** Data type for the accepted result from the render() function as ShadowDOM content */
export type Template = string | HTMLElement | DocumentFragment;

/** Data type for the Map of attributes passed as arguments to functions render(), controller() and getAttributesMap() method */
export type AttributesMap = Map<string, any>;

/** Data type for the accepted content for slots */
export type SlotContent = HTMLElement | DocumentFragment | Text | string | number;

/** Interface of arguments for render() and controller() functions */
export interface ControllerArguments {
  /** DOM Element Node for the current instance */
  element: DefinedHTMLElement;
  /** Instance of *DOMAccess* for access the LightDOM of current Element */
  light: DOMAccess;
  /** Instance of *DOMAccess* for access the ShadowDOM of current Element */
  shadow: DOMAccess;
  /** Instance of *AttributesAccess* for access the attributes of current element with Schema */
  attributes: AttributesAccess;
  /** Instance of *SlotAccess* for access to the slots utilities  */
  slot: SlotAccess;
}

/**
 * Base callback for ControllerResult
 */
export type BaseCallback = () => void;

/**
 * Attribute change callback for ControllerResult
 * @param name The name of the changed attribute
 */
export type AttributeChangedCallback = (name: string, oldValue: string, newValue: string) => void

/** Attribute change Name-Callback dictionary for ControllerResult */
export type AttributeChangesCallbackRecord = Record<string, AttributeChangedCallback>;

/** Properties Name-Descriptor dictionary for ControllerResult */
export type PropertiesDescriptorsRecord = Record<string, PropertyDescriptor>;

/** Interface of expected result from controller() function invocation */
export interface ControllerResult {
  /** Executed at native custom element connectedCallback() */
  connectedCallback?: BaseCallback;
  /** Executed at native custom element disconnectedCallback() */
  disconnectedCallback?: BaseCallback;
  /** Executed at native custom element adoptedCallback() */
  adoptedCallback?: BaseCallback;
  /** Executed at native custom element attributeChangedCallback() */
  attributeChangedCallback?: AttributeChangedCallback | AttributeChangesCallbackRecord;
  /** Record of event listeners to add to the Element */
  listeners?: Record<string, EventListenerOrEventListenerObject>;
  /** Record of descriptors to define getters and setters of DOM node properties */
  properties?: PropertiesDescriptorsRecord;
}

/** Type of rendering function used to generate the custom element HTML content */
export type RenderFunction = (controllerArguments: ControllerArguments) => Template;
/** Type of controller function to apply Element logic */
export type ControllerFunction = (controllerArguments: ControllerArguments) => ControllerResult | void;

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

export type AttributesTypes = Record<string, AttributeType>;

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

/**
 * Dictionary with the list of supported types as element attribute values
 */
export const AttributeTypes: Record<string, AttributeType> = {
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
export const AttributeTypesUnserialize: Map<AttributeType, (value: string, name: string) => any> = new Map();

AttributeTypesUnserialize.set(Boolean, function (value: string, name: string): boolean {
  if(value === name) {
    return true;
  }
  if(value === "false" || value === "off" || value === "") {
    return false;
  }
  return Boolean(value);
});


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
   * Permit to fire a custom event
   * @param name Event name
   * @param detail Optional detail for the event
   * @param bubbles Flag to enable event bubbles the DOM tree (default: false)
   */
  fire (name: string, detail?: any, bubbles: boolean = false): boolean {
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
}


/**
 * Allows access and management of element attributes
 */
class AttributesAccess {
  constructor (
    private elementNode: HTMLElement,
    private attributesSchema: AttributesTypes
  ) {}

  /**
   * Returns the frozen state of the Element attributes
   */
  getMap (): AttributesMap {
    const attributes = this.elementNode.attributes;
    const attributesMap: AttributesMap = new Map();
    for(let i = 0, len = attributes.length; i < len; i++) {
      const attributeName = attributes[i].name;
      attributesMap.set(attributeName, this.get(attributeName));
    }
    return attributesMap;
  }

  /**
   * Allows you to set the attributes of the element through a Map instance
   * @param attributesMap The Map of attributes
   */
  setMap (attributesMap: AttributesMap): void {
    for(const [name, value] of attributesMap) {
      this.set(name, value);
    }
  }

  /**
   * Return the element's attribute value with the correct type as defined into the attributes schema
   * @param name The name of the attribute
   */
  get (name: string): any {
    let   value  = this.elementNode.getAttribute(name);
    const schema = this.attributesSchema[name];
    if(schema) {
      const unserializer = AttributeTypesUnserialize.get(schema);
      if(unserializer) {
        value = unserializer(value, name);
      } else {
        value = schema(value);
      }
    }
    return value;
  }

  /**
   * Allows to set the value of an Element attribute according to what is provided by the attributes schema
   * @param name The name of the attribute
   * @param value The value of the attribute
   */
  set (name: string, value: any): void {
    const schema = this.attributesSchema[name];
    if(schema && AttributeTypesSerialize.has(schema)) {
      const serializer = AttributeTypesSerialize.get(schema);
      value = serializer(value);
    }
    this.elementNode.setAttribute(name, value.toString());
  }

  remove (name: string): void {
    this.elementNode.removeAttribute(name);
  }
}


/**
 * Allows access and management of slot content
 */
class SlotAccess {
  constructor (private elementNode: HTMLElement) {}

  /**
   * Returns the Light DOM node of the indicated slot
   * @param slotName The name of the slot
   */
  get (slotName: string): HTMLElement {
    return this.elementNode.querySelector<HTMLElement>(`*[slot="${slotName}"]`);
  }

  /**
   * Append into the Element the content for the slot specified by its name
   * @param slotName The name of the slot
   * @param node Content for the the slot as expected from *SlotContent*
   * @param tagName The tag name of the wrapper element for the slot content (default: "div")
   */
  append (slotName: string, node: SlotContent, tagName: string = "div"): HTMLElement {
    const slotNode = document.createElement(tagName);
    slotNode.setAttribute("slot", slotName);
    if(["string", "number"].includes(typeof node)) {
      node = document.createTextNode(node.toString());
      slotNode.appendChild(node);
    } else {
      slotNode.appendChild(node as Node);
    }
    this.elementNode.appendChild(slotNode);
    return slotNode;
  }

  /**
   * Replace into the Element the content for the slot specified by its name
   * @param slotName The name of the slot
   * @param node Content for the the slot as expected from *SlotContent*
   * @param tagName The tag name of the wrapper element for the slot content (default: "div")
   */
  replace (slotName: string, node: SlotContent, tagName: string = "div"): HTMLElement {
    this.remove(slotName);
    return this.append(slotName, node, tagName);
  }

  /**
   * Remove from the Element the content for the slot specified by its name
   * @param slotName The name of the slot
   */
  remove (slotName: string): HTMLElement {
    const slotNode = this.get(slotName);
    if(slotNode) {
      this.elementNode.removeChild(slotNode);
    }
    return slotNode;
  }
}


/**
 * Extended HTMLElement for user defined elements with define() function
 * @noInheritDoc
 */
export interface DefinedHTMLElement extends HTMLElement {
  new(): HTMLElement;
  prototype: HTMLElement;
  /** Other properties of the node for accessing the values of the attributes in accordance with the *AttributesSchema* */
  [key: string]: any;
}


const elementsMap: Map<string, DefinedHTMLElement> = new Map();


export function define (elementName: string, config: DefineConfig): DefinedHTMLElement {

  if(customElements.get(elementName)) {
    throw new Error(`"${elementName}" element already defined`);
  }

  const attributesSchema: AttributesTypes = {};
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
    #controllerResult: ControllerResult = {};
    #controllerArguments: ControllerArguments;

    constructor () {
      super();

      this.#shadow = this.attachShadow({
        mode: config.mode || "closed"
      });

      this.#controllerArguments = Object.freeze({
        element: this as unknown as DefinedHTMLElement,
        shadow: new DOMAccess(this.#shadow),
        light: new DOMAccess(this as HTMLElement),
        attributes: new AttributesAccess(this, attributesSchema),
        slot: new SlotAccess(this)
      });

      const attributesAccess = this.#controllerArguments.attributes;

      // Add getter / setter for properties
      for(const attributeName of propertyAttributes) {
        const propertyName = camelCase(attributeName);
        Object.defineProperty(this, propertyName, {
          get: () => attributesAccess.get(attributeName),
          set: (value: any) => attributesAccess.set(attributeName, value)
        });
      }

      if(config.render) {
        const renderResult = config.render(this.#controllerArguments);
        if(typeof renderResult === "string") {
          this.#shadow.innerHTML = renderResult;
        } else if(renderResult instanceof HTMLTemplateElement) {
          this.#shadow.appendChild(
            renderResult.content.cloneNode(true)
          );
        } else if(renderResult instanceof HTMLElement || renderResult instanceof DocumentFragment) {
          this.#shadow.appendChild(renderResult);
        }
      } else {
        this.#shadow.innerHTML = "<slot></slot>";
      }

      if(config.style) {
        const styleNode = document.createElement("style");
        styleNode.setAttribute("type", "text/css");
        styleNode.innerHTML = config.style;
        this.#shadow.appendChild(styleNode);
      }

      if(config.controller) {
        this.#controllerResult = config.controller(this.#controllerArguments) || {};

        if(this.#controllerResult.properties) {
          this.defineProperties(this.#controllerResult.properties);
        }
      }
    }

    private defineProperties (properties: PropertiesDescriptorsRecord): void {
      for(const name in properties) {
        Object.defineProperty(this, name, properties[name]);
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
        if(typeof this.#controllerResult.attributeChangedCallback === "function") {
          this.#controllerResult.attributeChangedCallback(name, oldValue, newValue);
        } else if(this.#controllerResult.attributeChangedCallback[name]) {
          this.#controllerResult.attributeChangedCallback[name](name, oldValue, newValue);
        }
      }
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
 * The *Registry* permit access to the defined custom elements classes and
 */
export class Registry {
  static getType (elementName: string): DefinedHTMLElement {
    return elementsMap.get(elementName);
  }
}
