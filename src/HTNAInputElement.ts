import { HTNAElement, HTNAElementConfig } from "./HTNAElement";


export type HTNAInputElementConfig = HTNAElementConfig & {
  /** Enable the Element to behave implicitly as a form input field **/
  formInputType?: "checkbox" | "radio";
};

export class HTNAInputElement extends HTNAElement {
  static config: HTNAInputElementConfig;

  static get observedAttributes (): string[] {
    return ["name", "value", ...super.observedAttributes];
  }

  private formInputType: "text" | "checkbox" | "radio" = "text";
  private formInputChangeITV: number;

  constructor () {
    super();

    const constructor = this.constructor as typeof HTNAInputElement;
    const config      = constructor.config;

    if(config.formInputType) {
      this.formInputType = config.formInputType;
    }
  }

  protected afterAttributesInit (): void {
    this.updateFormInputValue();
  }

  protected afterMutationObserverInit (): void {
    this.startFormInputRadioObserver();
  }

  disconnectedCallback (): void {
    if(this.formInputType === "radio") {
      this.stopFormInputRadioObserver();
    }
    super.disconnectedCallback();
  }

  attributeChangedCallback (name: string, oldValue: any, newValue: any): void {
    if(name === "name" || name === "value" || name === "checked") {
      this.updateFormInputValue();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private getFormInput (): HTMLInputElement {
    let input = this.querySelector<HTMLInputElement>("input.htna-form-input");
    if(!input) {
      input = document.createElement("input");
      if(this.formInputType === "checkbox" || this.formInputType === "radio") {
        input.style.display = "none";
        input.setAttribute("type", this.formInputType);
      } else {
        input.setAttribute("type", "hidden");
      }
      input.classList.add("htna-form-input");
      input.addEventListener("change", () => {
        this.updateChangeFormInputValue();
      });
      this.appendChild(input);
    }
    return input;
  }

  private updateChangeFormInputValue (): void {
    const input = this.getFormInput();
    if(this.formInputType === "checkbox" || this.formInputType === "radio") {
      if(input.checked) {
        this.setAttribute("checked", "checked");
      } else {
        this.removeAttribute("checked");
      }
    } else {
      const newValue = input.value;
      const oldValue = this.getAttribute("value");
      if(oldValue !== newValue) {
        this.setAttribute("value", newValue);
      }
    }
  }

  private updateFormInputValue (): void {
    const input = this.getFormInput();
    input.setAttribute("value", this.getAttribute("value"));
    input.setAttribute("name",  this.getAttribute("name"));
    if(this.formInputType === "checkbox" || this.formInputType === "radio") {
      input.checked = !!this.access.attributes.get("checked");
    }
  }

  private startFormInputRadioObserver (): void {
    const input = this.getFormInput();
    let latestValue = input.checked;
    const observer = (): void => {
      if(latestValue !== input.checked) {
        latestValue = input.checked;
        this.updateChangeFormInputValue();
      }
      this.formInputChangeITV = requestAnimationFrame(observer);
    };
    this.formInputChangeITV = requestAnimationFrame(observer);
  }

  private stopFormInputRadioObserver (): void {
    if(this.formInputChangeITV) {
      cancelAnimationFrame(this.formInputChangeITV);
      this.formInputChangeITV = null;
    }
  }

  // TODO
  // setCustomValidity()
  // checkValidity () {
  // TODO: trigger invalid
  // }
  // reportValidity()
  // get validity
  // get validationMessage
  // get willValidate
}
