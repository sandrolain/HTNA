import { element, htmlEntities } from "./tools";

describe("tools", () => {

  test("element() simple", async () => {
    const node = element("div");
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.outerHTML).toEqual("<div></div>");
  });

  test("element() with attributes", async () => {
    const node = element("div", {
      style: "border: 1px solid #FF0000; padding: 1em",
      title: "My new div element"
    });
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.outerHTML).toEqual(`<div style="border: 1px solid #FF0000; padding: 1em" title="My new div element"></div>`);
  });

  test("element() with children", async () => {
    const node = element("div", null, [
      "Simple text and",
      element("br"),
      element("strong", null, ["Bold text"])
    ]);
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.outerHTML).toEqual(`<div>Simple text and<br /><strong>Bold text</strong></div>`);
  });

  test("element() with attributes and children", async () => {
    const node = element("div", {
      style: "border: 1px solid #FF0000; padding: 1em",
      title: "My new div element"
    }, [
      "Simple text and",
      element("br"),
      ["strong", null, ["Bold text"]]
    ]);
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.outerHTML).toEqual(`<div style="border: 1px solid #FF0000; padding: 1em" title="My new div element">Simple text and<br /><strong>Bold text</strong></div>`);
  });

  test("htmlEntities()", async () => {
    const escaped = htmlEntities(` " ' & < > `);
    expect(escaped).toStrictEqual(` &quot; &#39; &amp; &lt; &gt; `);
  });

});
