
import { define, DefinedHTMLElement } from "./index";

describe("define()", () => {

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
    define("test-html", {
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

  test("define() an element with DOM render", async () => {
    define("test-dom", {
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

  test("define() element style", async () => {
    const styles = `
      em {
        color: #FF0000;
      }
    `;
    define("test-style", {
      render: () => "<em>html test</em>",
      style: styles
    });

    const el = document.createElement("test-style");
    document.body.appendChild(el);
    const style = el.shadowRoot.querySelector("style");
    expect(style).toBeInstanceOf(HTMLElement);
    expect(style.innerHTML).toStrictEqual(styles);
  });

  test("define() attributes as property", async () => {
    define("test-property", {
      render: () => "<em>html test</em>",
      attributesSchema: {
        foo: {
          property: true
        }
      }
    });

    const el = document.createElement("test-property") as DefinedHTMLElement;
    el.setAttribute("foo", "bar");
    expect(el.foo).toStrictEqual("bar");

    el.foo = "test";
    expect(el.getAttribute("foo")).toStrictEqual("test");
  });

  test("define() attributes as property with camelCase translation", async () => {
    define("test-property-cc", {
      render: () => "<em>html test</em>",
      attributesSchema: {
        "foo-bar": {
          property: true
        }
      }
    });

    const el = document.createElement("test-property-cc") as DefinedHTMLElement;
    el.setAttribute("foo-bar", "bar");
    expect(el.fooBar).toStrictEqual("bar");

    el.fooBar = "test";
    expect(el.getAttribute("foo-bar")).toStrictEqual("test");
  });

  test("define() generic attributeChangedCallback", (done) => {
    define("test-property-atc", {
      render: () => "<em>html test</em>",
      attributesSchema: {
        "foo-bar": {
          observed: true,
          value: "foo"
        }
      },
      controller: () => ({
        attributeChangedCallback: (name: string, oldValue: string, newValue: string): void => {
          expect(name).toEqual("foo-bar");
          expect(oldValue).toEqual("foo");
          expect(newValue).toEqual("bar");
          done();
        }
      })
    });

    const el = document.createElement("test-property-atc");
    el.setAttribute("foo-bar", "bar");
  });

  test("define() specific attributeChangedCallback", (done) => {
    define("test-property-atcs", {
      render: () => "<em>html test</em>",
      attributesSchema: {
        "foo-bar": {
          observed: true,
          value: "foo"
        }
      },
      controller: () => ({
        attributeChangedCallback: {
          "foo-bar": (name: string, oldValue: string, newValue: string): void => {
            expect(name).toEqual("foo-bar");
            expect(oldValue).toEqual("foo");
            expect(newValue).toEqual("bar");
            done();
          }
        }
      })
    });

    const el = document.createElement("test-property-atcs");
    el.setAttribute("foo-bar", "bar");
  });

});


