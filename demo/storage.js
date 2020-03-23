export class Storage {
  storageName = "data";
  data = [];

  constructor(storageName) {
    this.storageName = storageName;
    this.load();
    this._emitter = document.createElement("div");
  }

  on(name, fn) {
    this._emitter.addEventListener(name, fn);
  }

  fire(name) {
    this._emitter.dispatchEvent(new CustomEvent(name));
  }

  getList() {
    return this.data.slice();
  }

  add(item) {
    this.data.push(item);

    if(this.save()) {
      this.fire("update");
      return true;
    }

    this.data.pop();
    return false;
  }

  remove(item) {
    var index = this.data.indexOf(item);
    if(index > 0) {
      this.data.splice(index, 1);
      this.save();
      this.fire("update");
    }
  }

  replace(oldItem, item) {
    var index = this.data.indexOf(oldItem);
    if(index > 0) {
      this.data.splice(index, 1, item);
    } else {
      this.data.push(item);
    }
    this.save();
    this.fire("update");
  }

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageName));
      if(data) {
        this.data = data;
      }
    } catch(e) {}
  }

  save() {
    try {
      localStorage.setItem(this.storageName, JSON.stringify(this.data));
      return true;
    } catch(e) {}
    return false;
  }
}
