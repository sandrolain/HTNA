/**
 * Enable access to inner DOM Styles
 */
export class StyleAccess<E extends ShadowRoot | HTMLElement> {

  constructor (readonly node: E) {}

  removeAllStyles (): void {
    const styles = this.node.querySelectorAll(`style, link[rel="stylesheet"]`);
    for(const node of Array.from(styles)) {
      node.parentElement.removeChild(node);
    }
  }

  addStyle (style: string): void {
    const styleNode = document.createElement("style");
    styleNode.classList.add("htna-scoped-style");
    styleNode.setAttribute("type", "text/css");
    styleNode.innerHTML = style;
    this.node.appendChild(styleNode);
  }

  addExternalStyle (url: string): void {
    const linkNode = document.createElement("link");
    linkNode.classList.add("htna-scoped-style");
    linkNode.setAttribute("rel", "stylesheet");
    linkNode.setAttribute("type", "text/css");
    linkNode.setAttribute("href", url);
    this.node.appendChild(linkNode);
  }

}
