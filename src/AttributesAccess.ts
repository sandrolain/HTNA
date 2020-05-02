/** Data type for the Map of attributes passed as arguments to functions render(), controller() and getAttributesMap() method */
export type AttributesMap = Map<string, any>;

/** Type of Attribute type specification */
export type AttributeType = (value: string) => any;

// TODO: docs
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

    /** The initial default value for the current attribute */
    value?: any;
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
  if(value === name || value === "true" || value === "on") {
    return true;
  }
  if(value === "false" || value === "off" || value === "") {
    return false;
  }
  return Boolean(value);
});


/**
 * Allows access and management of element attributes
 */
export class AttributesAccess {
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
   * Checks whether the element's attribute has already been defined
   * @param name The name of the attribute
   */
  has (name: string): boolean {
    return this.elementNode.hasAttribute(name);
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
