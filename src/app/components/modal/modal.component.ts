import { Component, OnInit, DoCheck, OnDestroy, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import {Route, ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { AuthorizationService } from '../../services/authorization.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  TYPES = CONSTANTS.TYPES,
  ROOT_ELEM_CLASS = 'top-plate_modal',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ModalComponent implements OnInit, DoCheck, OnDestroy {

  constructor (
    private reference: ElementRef
  ) {}

  @Input() public model: any;

  private isReady: boolean;

  private rootElem: any;

  public closeModal () {
    let self = this;
    if (typeof self.model === TYPES.OBJECT) self.model.isOpened = false;
  }

  public onContentClick (event) {
    event && event.stopPropagation();

  }

  ngOnInit () {

    let
      self = this,
      rootElem = self.rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);

  }

  ngDoCheck () {
    let self = this;
    self.rootElem.classed('is-opened', typeof self.model === TYPES.OBJECT && self.model.isOpened);
  }

  ngOnDestroy () {}

}
