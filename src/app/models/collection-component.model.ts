export class CollectionComponentModel {

  private _items: any = {};

  private _index: any = 0;

  private _addItem (item) {
    let index = this._index++;
    typeof item === 'object' && (item['_getIndex'] = () => index);
    this._items[index] = {
      index: index,
      value: item
    };
  }

  public get length () {
    return Object.keys(this._items).length;
  }

  public get isEmpty () {
    return !this.length;
  }

  public getItems (raw = false) {
    return Object.keys(this._items).map(key => raw ? this._items[key] : this._items[key].value);
  }

  public addItems (list) {
    let normalizedList = Array.isArray(list) ? list : [list];
    normalizedList.forEach(item => this._addItem(item));

    return this.getItems();
  }

  public removeItem (item) {
    if (typeof item === 'object' && item.hasOwnProperty('_getIndex')) delete this._items[item._getIndex()];
    else Object.keys(this._items).forEach(key => this._items[key].value === item  && delete this._items[key]);
  }

  public clearList () {
    Object.keys(this._items).forEach(key => delete this._items[key]);
  }

  constructor () {}
}
