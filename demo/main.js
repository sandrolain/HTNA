import { Storage } from "./storage.js";
import { App } from "./components/App.js";
import { List } from "./components/List.js";
import { Item } from "./components/Item.js";
import { Detail } from "./components/Detail.js";

const model = new Storage();

model.on("update", () => {
  window.dispatchEvent(new CustomEvent("list:update", {
    detail: model.getList()
  }));
});

window.addEventListener("load", () => {
  window.dispatchEvent(new CustomEvent("list:update", {
    detail: model.getList()
  }));
});

window.addEventListener("update:request", (e) => {
  if(e.detail[0]) {
    model.replace(e.detail[0], e.detail[1]);
  } else {
    model.add(e.detail[1]);
  }
});
