import { DOMAccess } from "./DOMAccess";
import { AttributesAccess, AttributesMap, AttributesSchema, AttributesTypes } from "./AttributesAccess";
import { SlotAccess } from "./SlotAccess";
import { camelCase } from "./utils";


/** Data type for the accepted result from the render() function as ShadowDOM content */
export type Template = string | HTMLElement | DocumentFragment;

/** Interface of arguments for render() and controller() functions */
export interface ControllerArguments {
  /** DOM Element Node for the current instance */
  element: DefinedHTMLElement;
  /** Instance of *DOMAccess* for access the LightDOM of current Element */
  light: DOMAccess;
  /** Instance of *DOMAccess* for access the ShadowDOM of current Element */
  shadow: DOMAccess;
  /** Instance of *HTNAAttributesAccess* for access the attributes of current element with Schema */
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
  /** The tag name of the custom element */
  elementName?: string;
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


/**
 * Extended HTMLElement for user defined elements with define() function
 * @noInheritDoc
 */
export interface DefinedHTMLElement extends HTNAElement {
  new(): HTNAElement;
  prototype: HTNAElement;
  /** Other properties of the node for accessing the values of the attributes in accordance with the *AttributesSchema* */
  [key: string]: any;
}


const definedObservedAttributes: Map<typeof HTNAElement, string[]> = new Map();


export class HTNAElement extends HTMLElement {
  static get observedAttributes (): string[] {
    return definedObservedAttributes.get(this) || [];
  }

  #shadow: ShadowRoot;
  #controllerResult: ControllerResult = {};
  #controllerArguments: ControllerArguments;
  #defaultAttributes: Map<string, any> = new Map();
  #initied: boolean = false;

  constructor (private config: DefineConfig) {
    super();

    const attributesSchema: AttributesTypes   = {};
    const observedAttributes: string[] = [];
    const propertyAttributes: string[] = [];

    if(config.attributesSchema) {
      for(const name in config.attributesSchema) {
        const attribute = config.attributesSchema[name];
        if(attribute.type) {
          attributesSchema[name] = attribute.type;
        }
        if(attribute.property) {
          propertyAttributes.push(name);
        }
        if(attribute.observed) {
          observedAttributes.push(name);
        }
        if(attribute.value !== undefined) {
          this.#defaultAttributes.set(name, attribute.value);
        }
      }
    }

    const constructor = this.constructor as typeof HTNAElement;

    if(!definedObservedAttributes.has(constructor)) {
      definedObservedAttributes.set(constructor, observedAttributes);
    }

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
  }

  private defineProperties (properties: PropertiesDescriptorsRecord): void {
    for(const name in properties) {
      Object.defineProperty(this, name, properties[name]);
    }
  }

  connectedCallback (): void {

    if(!this.#initied) {
      this.#initied = true;
      const attributesAccess = this.#controllerArguments.attributes;
      // Set the initial attributes values
      this.#defaultAttributes.forEach((value: any, name: string) => {
        if(!attributesAccess.has(name)) {
          attributesAccess.set(name, value);
        }
      });

      if(this.config.controller) {
        this.#controllerResult = this.config.controller(this.#controllerArguments) || {};

        if(this.#controllerResult.properties) {
          this.defineProperties(this.#controllerResult.properties);
        }
      }
    }

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
}
