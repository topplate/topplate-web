import { Component, OnInit, DoCheck, OnDestroy, AfterViewInit, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  TYPES = CONSTANTS.TYPES,
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS,
  ROOT_ELEM_CLASS = 'tp-growl',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-tp-growl',
  templateUrl: './tp-growl.component.html',
  styleUrls: ['./tp-growl.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpGrowlComponent implements OnInit {

  constructor (
    private reference: ElementRef
  ) { }

  @Input() public events: Object;

  public elements: Object = {};

  public items: Object[] = [];

  public closeItem (item) {
    let self = this;
    item.hide();
  }

  private refreshDOM () {
    let
      self = this,
      elements = self.elements;
    elements['root'] = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }

  private refreshAPI () {
    let
      self = this,
      componentAPI = {},
      events = self.events || {},
      counter = 0;

    componentAPI['addItem'] = itemData => {
      let newItem = {
        index: 'growl-item_' + (counter++),
        label: (itemData.error && itemData.error.message) || itemData.message,
        type: itemData.status ? 'error' : (itemData.warning ? 'warning' : 'message'),
        status: itemData.status,
        isActive: false,
        timer: null,
        show: () => {
          newItem.timer = setTimeout(() => {
            newItem.isActive = true;
            newItem.timer = setTimeout(() => newItem.hide(), 5000);
            typeof events['onShow'] === 'function' && events['onShow'](newItem);
          }, 100);
        },
        hide: () => {
          if (newItem.timer) clearTimeout(newItem.timer);
          newItem.isActive = false;
          newItem.timer = setTimeout(() => {
            self.items.splice(self.items.indexOf(newItem), 1);
            typeof events['onHide'] === 'function' && events['onHide']();
          }, 300);
        }
      };
      self.items.push(newItem);
      newItem.show();
    };

    componentAPI['clearItems'] = () => self.items.forEach(item => item['hide']());

    typeof events['onReady'] === 'function' && events['onReady'](componentAPI);
  }

  ngOnInit () {
    let self = this;

    self.refreshDOM();
    self.refreshAPI();
  }
}
