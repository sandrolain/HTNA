
import { define } from "./index";

describe("define", () => {

  const externalStyles = `
    div {
      border: 1px solid #00FF00;
    }
  `;

  beforeAll(() => {
    (global as any).fetch = jest.fn((url) => {
      if(url.match(/style.css$/)) {
        return Promise.resolve({
          text: () => Promise.resolve(externalStyles)
        });
      }
    });
  });

  test("Define a element with HTML render", async () => {
    await define("test-html", {
      render: () => "<b>html test</b>"
    });
  });

  test("Create HTML rendered element", async () => {
    const el = document.createElement("test-html");
    document.body.appendChild(el);
  });

  test("Verify HTML rendered element shadow DOM", async () => {
    const el = document.createElement("test-html");
    document.body.appendChild(el);
    const b = el.shadowRoot.querySelector("b");
    expect(b).toBeInstanceOf(HTMLElement);
    expect(b.innerText).toStrictEqual("html test");
  });

  test("Define an element with DOM render", async () => {
    await define("test-dom", {
      render: () => {
        const $div = document.createElement("div");
        $div.appendChild(document.createTextNode("DOM test"));
        return $div;
      }
    });
  });

  test("Verify DOM rendered element shadow DOM", async () => {
    const el = document.createElement("test-dom");
    document.body.appendChild(el);
    const b = el.shadowRoot.querySelector("div");
    expect(b).toBeInstanceOf(HTMLElement);
    expect(b.innerText).toStrictEqual("DOM test");
  });

  test("Re-define an element with same name trigger Error", async () => {

    define("test-doubled", {
      render: () => "<div></div>"
    });

    try {
      define("test-doubled", {
        render: () => "<div></div>"
      });
    } catch(e) {
      return;
    }

    throw new Error("This should not pass!");
  });

  test("Define and verify an element with style", async () => {
    const styles = `
      em {
        color: #FF0000;
      }
    `;
    await define("test-style", {
      render: () => "<em>html test</em>",
      style: styles
    });

    const el = document.createElement("test-style");
    document.body.appendChild(el);
    const style = el.shadowRoot.querySelector("style");
    expect(style).toBeInstanceOf(HTMLElement);
    expect(style.innerHTML).toStrictEqual(styles);
  });

});
