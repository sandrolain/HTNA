import { Storage } from "./storage.js";
import { define } from "../dist/index.js";

const model = new Storage();

define("demo-app", {
  render: () => /*html*/`<slot></slot>`
});

define("demo-item", {
  observedAttributes: ["selected"],
  attributesSchema: {
    selected: Boolean
  },
  style: /*css*/`
    div {
      padding: 0.5em 1em;
      line-height: 1em;
    }
    .selected {
      background: #336699;
      color: #FFFFFF;
    }
  `,
  render: () => {
    const itemNode = document.createElement("div");
    itemNode.appendChild(document.createElement("slot"));
    return itemNode;
  },
  controller: ({ elementNode, shadowDOMAccess }) => {

    const updateSelected = () => {
      shadowDOMAccess.$("div").classList.toggle("selected", elementNode.getAttributeValue("selected"));
    };

    elementNode.addEventListener("attributechanged:selected", () => {
      updateSelected();
    });

    updateSelected();
  }
});

define("demo-list", {
  style: /*css*/`
    #list {
      width: 100%;
      height: 100%;
      overflow: auto;
    }
  `,
  render: () => /*html*/`<div id="list"><slot></slot></div>`,
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
          elementNode.fireEvent("itemSelected", item);
          updateList();
        });
        $f.appendChild(itemNode);
      });
      elementNode.innerHTML = "";
      elementNode.appendChild($f);
    };
    model.on("update", () => {
        updateList();
    });

    updateList();
  }
});

define("demo-detail", {
  style: /*css*/`
    * {
      box-sizing: border-box;
    }
    div {
      padding: 0em 1em;
      margin: 1em 0em;
    }
    input, textarea {
      width: 100%;
      border: 1px solid #999999;
      padding: 1em;
      height: 3em;
      line-height: 1em;
      font-size: 14px;
    }
    input:focus, textarea:focus {
      border-color: #336699;
    }
    textarea {
      height: 10em;
    }
  `,
  render: () => /*html*/`
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
    let selectedData;
    const $form = shadowDOMAccess.$("#form");
    $form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData($form);
      const dataObj = Object.fromEntries(data);

      if(selectedData) {
        model.replace(selectedData, dataObj);
      } else {
        model.add(dataObj);
      }

      selectedData = null;
      $form.reset();
    });

    const demoList = document.querySelector("demo-list");
    demoList.addEventListener("itemSelected", (event) => {
      selectedData = event.detail;
      shadowDOMAccess.$(`[name="title"]`).value = selectedData.title;
      shadowDOMAccess.$(`[name="body"]`).value = selectedData.body;
    });
  }
});
