import { Component, Input, OnInit, DoCheck, OnDestroy, ElementRef, ViewEncapsulation } from '@angular/core';
import { AppD3Service } from '../../services/d3.service';

const
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

  public toggleLiked () {
    console.log(this.model);

    return this.model[this.model.liked ? 'onDislikeClick' : 'onLikeClick']();
  }

  public get showGeo () {
    return this.model && this.settings.showGeo && this.model.address && this.model.address.replace(/\s/g, '').length;
  }

  public onMouseOver () {
    let
      tooltip = this.rootElem.select('.plate-preview_contentGeo-full'),
      metaElem = this.rootElem.select('.plate-preview_contentMeta'),
      metaElemSize = metaElem.node().getBoundingClientRect().width,
      tooltipSize = tooltip.node().getBoundingClientRect().width;

    tooltip.classed('isVisible', tooltipSize > metaElemSize);
  }

  public onMouseOut () {
    this.rootElem.select('.plate-preview_contentGeo-full').classed('isVisible', false);
  }

  ngOnInit () {

    const self = this;

    self.settings = self.settings || {};

    self.rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }

  ngDoCheck () {}

  ngOnDestroy () {}

}
