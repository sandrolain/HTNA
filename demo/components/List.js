import { define } from "../../dist/esm/index.js";

export const List = define("demo-list", {
  style: /*css*/`
    #list {
      width: 100%;
      height: 100%;
      overflow: auto;
    }
  `,
  render: () => /*html*/`<div id="list"><slot></slot></div>`,
  controller: ({ element, light }) => {
    let selectedItem;
    const updateList = (list) => {
      const $f = document.createDocumentFragment();
      list.forEach((item) => {
        const itemNode = document.createElement("demo-item");
        itemNode.appendChild(document.createTextNode(item.title));
        itemNode.setAttribute("selected", (selectedItem === item));
        itemNode.addEventListener("click", () => {
          selectedItem = item;
          light.dispatch("itemSelected", item);
          updateList(list);
        });
        $f.appendChild(itemNode);
      });
      element.innerHTML = "";
      element.appendChild($f);
    };
    window.addEventListener("list:update", (e) => {
      updateList(e.detail);
    });
  }
});
