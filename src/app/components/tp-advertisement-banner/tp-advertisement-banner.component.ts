import { Component, Input, OnInit, ViewEncapsulation, ElementRef } from '@angular/core';
import {AppD3Service } from '../../services/d3.service';

const
  d3 = AppD3Service.getD3(),
  ROOT_ELEM_CLASS = 'tp-advertisement-banner';

@Component({
  selector: 'app-tp-advertisement-banner',
  templateUrl: './tp-advertisement-banner.component.html',
  styleUrls: ['./tp-advertisement-banner.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpAdvertisementBannerComponent implements OnInit {

  @Input() public model: any;

  private rootElem: any;

  public get bannerStyle () {
    return (this.model && this.model.image && {'background-image': 'url(' + this.model.image + ')'}) || {};
  }

  constructor (
    private ref: ElementRef
  ) {}

  ngOnInit () {
    this.rootElem = d3.select(this.ref.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }
}
