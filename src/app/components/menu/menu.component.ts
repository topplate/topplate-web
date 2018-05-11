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
  ROOT_ELEM_CLASS = 'top-plate_menu',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MenuComponent implements OnInit, DoCheck, OnDestroy {

  constructor (
    private reference: ElementRef
  ) {}

  @Input() public model: any;

  @Input() public links: any;

  private rootElem: any;

  private elements: any;

  ngOnInit () {

    let
      self = this,
      rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);

    self.elements = {
      root: rootElem,
      overlay: rootElem.select('.top-plate_menuOverlay'),
      content: rootElem.select('.top-plate_menuItems')
    };
    self.model = self.model || { isOpened: false};
    self.links = self.links || [];

  }

  ngDoCheck () {

    // let
    //   self = this,
    //   rootElem = self.elements.root,
    //   overlay = self.elements.overlay,
    //   content = self.elements.content,
    //   isOpened = self.model.isOpened;
    //
    // if (isOpened) overlay
    //   .transition().duration(300).ease(d3.easeCubicOut)
    //   .style('right', 0)
    //   .on('end', () => content
    //     .transition().duration(300).ease(d3.easeCubicOut)
    //     .style('right', 0)
    //     .on('end', () => rootElem.classed('isOpened', true)));
    //
    // if (!isOpened) content
    //   .transition().duration(300).ease(d3.easeCubicOut)
    //   .style('right', '-100%')
    //   .on('end', () => overlay
    //     .transition().duration(300).ease(d3.easeCubicOut)
    //     .style('right', '-300px')
    //     .on('end', () => rootElem.classed('isOpened', false)));



    // if (self.elements.root.classed)

    // console.log(this.model && this.model.isOpened);



  }

  ngOnDestroy () {}

}

