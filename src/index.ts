
export interface DefineStylesStructure {
  [key: string]: string | DefineStylesStructure;
}

export interface DefineAttributesSchema {
  [key: string]: (value: string) => any
}

export type DefineTemplate = string | HTMLElement | DocumentFragment;
export type DefineStyles = string | DefineStylesStructure;
export type DefineAttributesMap = Map<string, any>;
export type DefineSlotContentAttribute = HTMLElement | DocumentFragment | Text | string | number;

export interface DefineConfig {
  render?: (shadowDOMAccess: DefineShadowDOMAccess, attributes: DefineAttributesMap) => DefineTemplate;
  styles?: DefineStyles;
  stylesUrl?: string;
  controller?: (shadowDOMAccess: DefineShadowDOMAccess, attributes: DefineAttributesMap) => void;
  attributesSchema?: DefineAttributesSchema,
  attributes?: DefineAttributesMap,
  observedAttributes?: string[];
  listeners?: {
    [key: string]: EventListenerOrEventListenerObject
  },
  // Shadow DOM
  mode?: "open" | "closed";
  // ElementDefinitionOptions
  extends?: string;
}

export const DefineTypes = {
  JSON: function(value: string): any {
    return JSON.parse(value);
  }
};

export const DefineTypesSerialize = new Map([
  [DefineTypes.JSON, function(value: any): string {
    return JSON.stringify(value);
  }]
]);

export class DefineShadowDOMAccess {
  #shadow: ShadowRoot;
  constructor(shadow: ShadowRoot) {
    this.#shadow = shadow;
  }

  $(selector: string): HTMLElement {
    return this.#shadow.querySelector(selector);
  }

  $$(selector: string): NodeList {
    return this.#shadow.querySelectorAll(selector);
  }
}

export const define = async function(elementName: string, config: DefineConfig) {

  if(customElements.get(elementName)) {
    throw new Error(`"${elementName}" element already defined`);
  }

  let stylesCSS: string = "";

	if(config.stylesUrl) {
    stylesCSS = await (await fetch(config.stylesUrl)).text();
  } else if(config.styles) {
    if(typeof config.styles !== "string") {
      // TODO: convert styles structure to string
    } else {
      stylesCSS = config.styles;
    }
  }

  const attributesSchema: DefineAttributesSchema = config.attributesSchema || {};
  const observedAttributes: string[] = config.observedAttributes || [];

	const ElementClass = class extends HTMLElement {
    static get observedAttributes() {
      return observedAttributes;
    }

    #shadow: ShadowRoot;
    #shadowDOMAccess: DefineShadowDOMAccess;

		constructor() {
      super();

			this.#shadow = this.attachShadow({
				mode: config.mode || "closed"
			});

      if(config.attributes) {
        this.setAttributesMap(config.attributes);
      }

      this.#shadowDOMAccess = new DefineShadowDOMAccess(this.#shadow);

      if(config.render) {
        const renderResult = config.render.call(this, this, this.#shadowDOMAccess, this.getAttributesMap());

        if(typeof renderResult === "string") {
          this.#shadow.innerHTML = renderResult;
        } else if (renderResult instanceof HTMLTemplateElement) {
          this.#shadow.appendChild(
            renderResult.content.cloneNode(true)
          );
        } else if (renderResult instanceof HTMLElement || renderResult instanceof DocumentFragment) {
          this.#shadow.appendChild(
            renderResult.cloneNode(true)
          );
        }
      }

      if(stylesCSS) {
        const styleNode = document.createElement("style");
        styleNode.setAttribute("type", "text/css");
        styleNode.innerText = stylesCSS;
        this.#shadow.appendChild(styleNode);
      }

			if(config.controller) {
			    config.controller.call(this, this, this.#shadowDOMAccess, this.getAttributesMap());
			}
		}

		connectedCallback() {
			const event = new CustomEvent("connected");
      this.dispatchEvent(event);
		}

		disconnectedCallback() {
			const event = new CustomEvent("disconnected");
      this.dispatchEvent(event);
		}

		adoptedCallback() {
			const event = new CustomEvent("adopted");
      this.dispatchEvent(event);
		}

		attributeChangedCallback(name: string, oldValue: any, newValue: any) {
      const event = new CustomEvent("attributechanged", {
        detail: { name, oldValue, newValue }
      });
      this.dispatchEvent(event);
    }

    bubbleEvent(name: string, detail: any): boolean {
      return this.fireEvent(name, detail, true);
    }

    fireEvent(name: string, detail: any, bubbles: boolean = false): boolean {
      const event = new CustomEvent(name, {
        bubbles,
        composed: true,
        detail
      });
      return this.dispatchEvent(event);
    }

    when(name: string): Promise<Event> {
      return new Promise((resolve) => {
        const callback = (event: Event) => {
          this.removeEventListener(name, callback);
          resolve(event);
        }
        this.addEventListener(name, callback);
      });
    }

    getAttributesMap(): DefineAttributesMap {
      const attributes = this.attributes;
      const attributesMap: DefineAttributesMap = new Map();

      for(let i = 0, len = attributes.length; i < len; i++) {
        const attributeName = attributes[i].name;
        attributesMap.set(attributeName, this.getAttributeValue(attributeName));
      }

      return attributesMap;
    }

    setAttributesMap(attributesMap: DefineAttributesMap): void {
      for(const [name, value] of attributesMap) {
        this.setAttributeValue(name, value);
      }
    }

    getAttributeValue(name: string) {
      const value = this.getAttribute(name);

      if(attributesSchema[name]) {
        return attributesSchema[name](value);
      }

      return value;
    }

    setAttributeValue(name: string, value: any) {
      const schema = attributesSchema[name];

      if(schema && DefineTypesSerialize.has(schema)) {
        const serializer = DefineTypesSerialize.get(schema);
        value = serializer(value);
      }

      this.setAttribute(name, value.toString());
    }

    replaceSlot(slotName: string, node: DefineSlotContentAttribute, tagName: string = "div"): HTMLElement {
      this.removeSlot(slotName);
      return this.appendSlot(slotName, node, tagName);
    }

    appendSlot(slotName: string, node: DefineSlotContentAttribute, tagName: string = "div"): HTMLElement {
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

    removeSlot(slotName: string): HTMLElement {
      const slotNode = this.querySelector<HTMLElement>(`*[slot="${slotName}"]`);
      if(slotNode) {
        this.removeChild(slotNode);
      }
      return slotNode;
    }
	}

  const elementOptions: ElementDefinitionOptions = {};

  if(config.extends) {
    elementOptions.extends = config.extends;
  }

  customElements.define(elementName, ElementClass, elementOptions);

  return ElementClass;
}
