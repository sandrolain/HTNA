import { create, htmlEntities } from "./tools";

describe("tools", () => {

  test("create() simple", async () => {
    const node = create("div");
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.outerHTML).toEqual("<div></div>");
  });

  test("create() with attributes", async () => {
    const node = create("div", {
      style: "border: 1px solid #FF0000; padding: 1em",
      title: "My new div element"
    });
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.outerHTML).toEqual(`<div style="border: 1px solid #FF0000; padding: 1em" title="My new div element"></div>`);
  });

  test("create() with children", async () => {
    const node = create("div", null, [
      "Simple text and",
      create("br"),
      create("strong", null, ["Bold text"])
    ]);
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.outerHTML).toEqual(`<div>Simple text and<br /><strong>Bold text</strong></div>`);
  });

  test("create() with attributes and children", async () => {
    const node = create("div", {
      style: "border: 1px solid #FF0000; padding: 1em",
      title: "My new div element"
    }, [
      "Simple text and",
      create("br"),
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
