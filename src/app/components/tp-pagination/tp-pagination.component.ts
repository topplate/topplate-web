import { Component, OnInit, DoCheck, OnDestroy, AfterViewInit, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import {Route, ActivatedRoute, ActivationEnd, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { AuthorizationService } from '../../services/authorization.service';
import { SharedService } from '../../services/shared.service';
import { AccessPointService } from '../../services/access-point.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  TYPES = CONSTANTS.TYPES,
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS,
  ROOT_ELEM_CLASS = 'tp-pagination',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-tp-pagination',
  templateUrl: './tp-pagination.component.html',
  styleUrls: ['./tp-pagination.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpPaginationComponent implements OnInit, DoCheck {

  constructor (
    private reference: ElementRef
  ) {}

  @Input() public settings: Object;

  public pages: Object[] = [];

  public rootElem: any;

  private togglePage (i) {
    let self = this;

    self.pages.forEach(page => {
      let isSelected = page['index'] === i;
      page['isSelected'] = isSelected;
      isSelected && self.settings && (self.settings['currentPage'] = page['index']);
    });

    if (typeof self.settings['onChange'] === 'function') self.settings['onChange']();
  }

  public doStep (delta) {
    let
      self = this,
      settings = self.settings,
      numberOfPages = self.pages.length,
      currentPage, nextPage;

    if (!settings) return;

    currentPage = settings['currentPage'];
    nextPage = currentPage + delta;

    if (!nextPage || nextPage > numberOfPages) return;

    self.togglePage(nextPage);
  }

  public selectPage (i) {
    let
      self = this,
      settings = self.settings;

    if (!settings || i === settings['currentPage']) return;

    self.togglePage(i);
  }

  ngOnInit () {

    let self = this;

    self.rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }

  ngDoCheck () {
    let
      self = this,
      settings = self.settings,
      lastNumberOfPages = (self.pages && self.pages.length) || 0;

    if (!settings) return;
    else {
      let currentNumberOfPages = settings['numberOfPages'];
      if (currentNumberOfPages !== lastNumberOfPages) {
        self.pages = d3.range(settings['numberOfPages']).map(i => {
          let pageIndex = i + 1;
          return {
            index: pageIndex,
            isSelected: pageIndex === settings['currentPage']
          };
        });
      }
    }
  }
}

