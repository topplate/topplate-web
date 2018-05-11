import { Component, Input, OnInit, DoCheck, OnDestroy, ElementRef, ViewEncapsulation } from '@angular/core';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { AuthorizationService } from '../../services/authorization.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  TYPES = CONSTANTS.TYPES,
  ROOT_ELEM_CLASS = 'top-plate_platePreview',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-plate-preview',
  templateUrl: './plate-preview.component.html',
  styleUrls: ['./plate-preview.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlatePreviewComponent implements OnInit, DoCheck, OnDestroy {

  constructor (
    private reference: ElementRef
  ) { }

  @Input() public model: any;

  @Input() public settings: any;

  public rootElem: any;

  ngOnInit () {

    const self = this;

    self.settings = self.settings || {};

    self.rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }

  ngDoCheck () {}

  ngOnDestroy () {}

}
