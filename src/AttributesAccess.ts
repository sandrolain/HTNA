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


let richDataCounter: number = 0;
const generateRichDataId = (): string => {
  return `$htna${++richDataCounter}$`;
};
const isRichDataId = (value: string): boolean => {
  return value && !!value.match(/^\$htna[0-9]+\$$/);
};
const richDataStorage: Map<string, any> = new Map();

// TODO: docs
export class AttributesRichData {
  // TODO: docs
  static get (key: string): string {
    return richDataStorage.get(key);
  }
}


/**
 * Dictionary with the list of supported types as element attribute values
 */
export const AttributeTypes: Record<string, AttributeType> = {
  // TODO: test
  JSON: (value: string): any => JSON.parse(value),
  // TODO: test
  CSVString: (value: string): string[] => value.split(","),
  // TODO: test
  CSVNumber: (value: string): number[] => value.split(",").map((str) => Number(str)),
  // TODO: test
  CSVDate: (value: string): Date[] => value.split(",").map((str) => new Date(str)),
  // TODO: test
  Entries: (value: string): [string, string][] => value.split(";").map((str) => {
    const parts = str.split(":");
    const key   = parts.shift();
    const value = parts.join(":");
    return [key, value];
  }),
  // TODO: test
  RichData: (value: string): any => {
    return richDataStorage.get(value);
  },
  Date: (value: string): Date => {
    return new Date(value);
  },
  Boolean: Boolean,
  String: String,
  Number: Number
};



/**
 * Map for the available attributes value serializer.<br/>
 * Map's items key must be the *AttributeType* class for the data type<br/>
 * Map's items value can be a serializer function that accept attribute value and return the serialized data as string
 */
export const AttributeTypesSerialize: Map<AttributeType, (value: any, oldValue: string, name: string) => string> = new Map();

// TODO: test
AttributeTypesSerialize.set(AttributeTypes.JSON, function (value: any): string {
  return JSON.stringify(value);
});

// TODO: test
AttributeTypesSerialize.set(AttributeTypes.CSVString, function (value: string[]): string {
  return value.join(",");
});

// TODO: test
AttributeTypesSerialize.set(AttributeTypes.CSVNumber, function (value: number[]): string {
  return value.map((num) => String(num)).join(",");
});

// TODO: test
AttributeTypesSerialize.set(AttributeTypes.CSVDate, function (value: Date[]): string {
  return value.map((date) => date.toISOString()).join(",");
});

// TODO: test
AttributeTypesSerialize.set(AttributeTypes.Entries, function (value: [string, string][]): string {
  return value.map((entry) => entry.join(":")).join(";");
});

// TODO: test
AttributeTypesSerialize.set(AttributeTypes.RichData, function (value: any, oldRawValue: string): string {
  const richDataId = isRichDataId(oldRawValue) ? oldRawValue : generateRichDataId();
  richDataStorage.set(richDataId, value);
  return richDataId;
});

// TODO: test
AttributeTypesSerialize.set(AttributeTypes.Date, function (value: Date): string {
  return value.toISOString();
});

// TODO: test
AttributeTypesSerialize.set(AttributeTypes.Boolean, function (value: boolean, oldRawValue: string, name: string): string {
  return value ? name : null;
});

/**
 * Map for the available attributes value unserializer.<br/>
 * Map's items key must be the *AttributeType* class for the data type<br/>
 * Map's items value can be a unserializer function that accept attribute serialized value and return the correct schema type
 */
export const AttributeTypesUnserialize: Map<AttributeType, (value: string, name: string) => any> = new Map();

AttributeTypesUnserialize.set(Boolean, function (value: string): boolean {
  return (value !== null);
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
  get <T=any> (name: string): T | string {
    const value  = this.elementNode.getAttribute(name);
    const schema = this.attributesSchema[name];
    if(schema) {
      const unserializer = AttributeTypesUnserialize.get(schema);
      if(unserializer) {
        return unserializer(value, name);
      }
      return value !== null ? schema(value) : null;
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
      const oldValue   = this.elementNode.getAttribute(name);
      value = serializer(value, oldValue, name);
    }
    if(value !== null) {
      this.elementNode.setAttribute(name, value.toString());
    } else {
      this.elementNode.removeAttribute(name);
    }
  }

  remove (name: string): void {
    this.elementNode.removeAttribute(name);
  }
}
