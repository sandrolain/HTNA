/** Data type for the accepted content for slots */
export type SlotContent = HTMLElement | DocumentFragment | Text | string | number;

/**
 * Allows access and manAttributesTypesagement of slot content
 */
export class SlotAccess {
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
