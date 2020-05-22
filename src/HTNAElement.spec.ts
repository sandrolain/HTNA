import { HTNAElement, DefineConfig } from "./HTNAElement";
import { Registry } from "./Registry";

describe("HTNAElement", () => {

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

  test("define() a element with HTML render", async () => {
    class TestClassHtml extends HTNAElement {
      static config: DefineConfig = {
        render: () => "<b>html test</b>"
      };
    }

    Registry.add("test-class-html", TestClassHtml);
  });

  test("Verify HTML rendered element shadow DOM", async () => {
    const el = document.createElement("test-class-html");
    document.body.appendChild(el);
    const b = el.shadowRoot.querySelector("b");
    expect(b).toBeInstanceOf(HTMLElement);
    expect(b.innerText).toStrictEqual("html test");
  });

});
