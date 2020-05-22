
import { create, DefinedHTMLElement } from "./index";

describe("create()", () => {

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

  test("create() a element with HTML render", async () => {
    const TestHtml = create({
      elementName: "test-html",
      render: () => "<b>html test</b>"
    });
    TestHtml.register();
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

  test("create() an element with DOM render", async () => {
    const TestDom = create({
      elementName: "test-dom",
      render: () => {
        const $div = document.createElement("div");
        $div.appendChild(document.createTextNode("DOM test"));
        return $div;
      }
    });
    TestDom.register();
  });

  test("Verify DOM rendered element shadow DOM", async () => {
    const el = document.createElement("test-dom");
    document.body.appendChild(el);
    const b = el.shadowRoot.querySelector("div");
    expect(b).toBeInstanceOf(HTMLElement);
    expect(b.innerText).toStrictEqual("DOM test");
  });

  test("Re-define an element with same name trigger Error", async () => {

    const TestDoubled = create({
      elementName: "test-doubled",
      render: () => "<div></div>"
    });
    TestDoubled.register();

    try {
      const TestDoubled = create({
        elementName: "test-doubled",
        render: () => "<div></div>"
      });
      TestDoubled.register();
    } catch(e) {
      return;
    }

    throw new Error("This should not pass!");
  });

  test("create() element style", async () => {
    const styles = `
      em {
        color: #FF0000;
      }
    `;
    const TestStyle = create({
      elementName: "test-style",
      render: () => "<em>html test</em>",
      style: styles
    });
    TestStyle.register();

    const el = document.createElement("test-style");
    document.body.appendChild(el);
    const style = el.shadowRoot.querySelector("style");
    expect(style).toBeInstanceOf(HTMLElement);
    expect(style.innerHTML).toStrictEqual(styles);
  });

  test("create() attributes as property", async () => {
    create({
      elementName: "test-property",
      render: () => "<em>html test</em>",
      attributesSchema: {
        foo: {
          property: true
        }
      }
    }).register();

    const el = document.createElement("test-property") as DefinedHTMLElement;
    document.body.appendChild(el);
    el.setAttribute("foo", "bar");
    expect(el.foo).toStrictEqual("bar");

    el.foo = "test";
    expect(el.getAttribute("foo")).toStrictEqual("test");
  });

  test("create() attributes as property with camelCase translation", async () => {
    create({
      elementName: "test-property-cc",
      render: () => "<em>html test</em>",
      attributesSchema: {
        "foo-bar": {
          property: true
        }
      }
    }).register();

    const el = document.createElement("test-property-cc") as DefinedHTMLElement;
    document.body.appendChild(el);
    el.setAttribute("foo-bar", "bar");
    expect(el.fooBar).toStrictEqual("bar");

    el.fooBar = "test";
    expect(el.getAttribute("foo-bar")).toStrictEqual("test");
  });

  test("create() generic attributeChangedCallback", (done) => {
    create({
      elementName: "test-property-atc",
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
    }).register();

    const el = document.createElement("test-property-atc");
    document.body.appendChild(el);
    el.setAttribute("foo-bar", "bar");
  });

  test("create() specific attributeChangedCallback", (done) => {
    create({
      elementName: "test-property-atcs",
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
    }).register();

    const el = document.createElement("test-property-atcs");
    document.body.appendChild(el);
    el.setAttribute("foo-bar", "bar");
  });

});


