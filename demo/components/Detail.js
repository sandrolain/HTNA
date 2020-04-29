import { define } from "../../dist/esm/index.js";

export const Detail = define("demo-detail", {
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
  controller:({ shadow }) => {
    let selectedData;
    const $form = shadow.$("#form");
    $form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData($form);
      const dataObj = Object.fromEntries(data);

      window.dispatchEvent(new CustomEvent("update:request", {
        detail: [selectedData, dataObj]
      }));

      selectedData = null;
      $form.reset();
    });

    const demoList = document.querySelector("demo-list");
    demoList.addEventListener("itemSelected", (event) => {
      selectedData = event.detail;
      shadow.$(`[name="title"]`).value = selectedData.title;
      shadow.$(`[name="body"]`).value = selectedData.body;
    });
  }
});
