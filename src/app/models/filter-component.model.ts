import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class FilterComponentModel {

  private _core: BehaviorSubject<any>;

  public buttons: any[] = [];

  public getSelectedButton () {
    let selectedButton = this.buttons.filter(button => button.isSelected)[0];
    return selectedButton || null;
  }

  public selectButton (newSelectedButton) {
    let
      currentlySelectedButton = this.getSelectedButton(),
      currentlySelectedIndex = (currentlySelectedButton && currentlySelectedButton.index) || null;

    if (currentlySelectedIndex === newSelectedButton.index) return;

    this.buttons.forEach(button => button.isSelected = button.index === newSelectedButton.index);
    this._core.next(this.getSelectedButton());
  }

  public getSubscription (callback) {
    return this._core.subscribe(selectedButton => typeof callback === 'function' && callback(selectedButton));
  }

  constructor (items, settings = {
    'selectedIndex': 0
  }) {

    items.forEach((item, i) => {
      let button = {};
      if (typeof item === 'string') button['label'] = item;
      else if (typeof item === 'object') {
        Object.keys(item).forEach(key => button[key] = item[key]);
        button['_original'] = item;
      }
      button['index'] = i;
      button['isSelected'] = button['index'] === settings.selectedIndex;
      this.buttons.push(button);
    });

    this._core = new BehaviorSubject<any>(this.getSelectedButton());
  }
}
