import { define } from "../../dist/esm/index.js";

export const Item = define("demo-item", {
  attributesSchema: {
    selected: {
      type: Boolean,
      observed: true,
      value: false
    }
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
  controller: ({ attributes, shadow }) => {
    const updateSelected = () => {
      shadow.$("div").classList.toggle("selected", attributes.get("selected"));
    };
    return {
      connectedCallback: updateSelected,
      attributeChangedCallback: {
        selected: updateSelected
      }
    };
  }
});
