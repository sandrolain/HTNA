
export type ElementAttributesMap = Map<string, any>;

export const element = (tagName: string, attributes: ElementAttributesMap) => {
  const node = document.createElement(tagName);
  for(const [name, value] of attributes.entries()) {
    node.setAttribute(name, String(value));
  }
  return node;
};

export const htmlentities = (str: string): string => {
  return str.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

