import { Component, OnInit, DoCheck, OnDestroy, AfterViewInit, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import {Route, ActivatedRoute, ActivationEnd, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { AuthorizationService } from '../../services/authorization.service';
import { SharedService } from '../../services/shared.service';
import { AccessPointService } from '../../services/access-point.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  TYPES = CONSTANTS.TYPES,
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS,
  ROOT_ELEM_CLASS = 'tp-switch',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-tp-switch',
  templateUrl: './tp-switch.component.html',
  styleUrls: ['./tp-switch.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpSwitchComponent implements OnInit, DoCheck {

  constructor (
    private reference: ElementRef
  ) {}

  @Input() public items: Object[];

  @Input() public events: Object;

  public get selectedOne () {
    let
      self = this,
      items = self.items;

    return items && items.length && items.filter(item => item['isSelected'])[0];
  }

  public toggle () {
    let
      self = this,
      events = self.events || {};

    if (!self.selectedOne) return;

    events['onClick'] && events['onClick']();
  }

  ngOnInit () {

    let self = this;

    d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);

    self.items.forEach((item, i) => {
      if (!item.hasOwnProperty('isSelected')) item['isSelected'] = false;
      item['opposite'] = self.items[!i ? i + 1 : i - 1]['name'];
      item['right'] = !!i;
    });
  }

  ngDoCheck () {}
}
