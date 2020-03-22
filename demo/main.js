import { Storage } from "./storage.js";
import { define, DefineTypes } from "../dist/index.js";

const model = new Storage();

define("demo-app", {
  render: () => `<slot></slot>`
});


define("demo-item", {
  observedAttributes: ["selected"],
  attributesSchema: {
    selected: Boolean
  },
  styles: `
    .selected {
      background: #336699;
      color: #FFFFFF;
    }
  `,
  render: ({ elementNode, attributesMap }) => {
    const itemNode = document.createElement('div');
    itemNode.appendChild(document.createElement("slot"));
    elementNode.addEventListener("attributechanged", (event) => {
      if(event.detail.name === "selected") {
        itemNode.classList.toggle("selected", elementNode.getAttributeValue("selected"));
        console.log("itemNode", itemNode)
      }
    })

    return itemNode;
  }
});

define("demo-list", {
  render: () => `<div id="list"><slot></slot></div>`,
  controller: ({ elementNode }) => {
    let selectedItem;
    const updateList = () => {
      const $f = document.createDocumentFragment();
      model.getList().forEach((item) => {
        const itemNode = document.createElement("demo-item");
        itemNode.appendChild(document.createTextNode(item.title));
        itemNode.setAttributeValue("selected", (selectedItem === item));
        itemNode.addEventListener("click", () => {
          selectedItem = item;
          updateList();
        });
        $f.appendChild(itemNode);
      });
      elementNode.innerHTML = '';
      elementNode.appendChild($f);
    };
    model.on("update", () => {
        updateList();
    });

    updateList();
  }
});



define("demo-detail", {
  render: () => `
    <form id="form">
      <div>
        <input type="text" name="title" placeholder="Title" />
      </div>
      <div>
        <textarea name="body" placeholder="Body"></textarea>
      </div>
      <div>
        <button type="submit">Save</button>
      </div>
    </form>
  `,
  controller:({ shadowDOMAccess }) => {
    const $form = shadowDOMAccess.$("#form");
    $form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData($form);
      if(model.add(Object.fromEntries(data))) {
        $form.reset();
      }
    });

    const demoList = document.querySelector("demo-list");
    demoList.addEventListener("itemSelected", (event) => {
      console.log("event.detail", event.detail)
    })
  }
})
