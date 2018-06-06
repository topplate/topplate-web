import { Component, OnInit, DoCheck, OnDestroy, AfterViewInit, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import {Route, ActivatedRoute, ActivationEnd, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { timer } from 'rxjs/observable/timer';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  TYPES = CONSTANTS.TYPES,
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS,
  ROOT_ELEM_CLASS = 'tp-footer',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-tp-footer',
  templateUrl: './tp-footer.component.html',
  styleUrls: ['./tp-footer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpFooterComponent implements OnInit {

  constructor (
    private reference: ElementRef
  ) {}

  @Input() public banner: any;

  public showFixedBanner: Boolean = false;

  public elements: Object;

  public linksA: Object[] = [
    {
      label: 'sponsored plate'
    },
    {
      label: 'contact us'
    }
  ];

  public linksB: Object[] = [
    {
      label: 'plate of the week'
    },
    {
      label: 'monthly prize'
    }
  ];

  public linksC: Object[] = [
    {
      label: 'privacy'
    },
    {
      label: 'term'
    },
    {
      label: 'copyright'
    }
  ];

  public onLinkClick (clickedOne) {
    console.log(clickedOne);
  }

  private refreshDOM () {
    let
      self = this,
      rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);

    self.elements = {
      root: rootElem,
      content: rootElem.select('.tp-footer_content'),
      banners: rootElem.selectAll('.tp-footer_banner'),
      staticBanner: rootElem.select('.tp-footer_bannerStatic'),
      fixedBanner: rootElem.select('.tp-footer_bannerFixed'),
      spacer: rootElem.select('.tp-footer_spacer')
    };
  }

  private refreshWatchers () {
    let
      self = this,
      bannerObserver = {},
      scrollObserver = {},
      rootElem = self.elements['root'],
      staticBanner = self.elements['staticBanner'],
      fixedBanner = self.elements['fixedBanner'],
      spacer = self.elements['spacer'];

    bannerObserver['curr'] = '';
    bannerObserver['prev'] = '';
    bannerObserver['refresh'] = timer(0, 10).subscribe(() => {
      bannerObserver['prev'] = bannerObserver['curr'];
      bannerObserver['curr'] = (self.banner && (self.banner['icon'] + '_' + self.banner['html'])) || '';
      bannerObserver['prev'] !== bannerObserver['curr'] && self.refreshBanner();
    });

    scrollObserver['refresh'] = timer(0, 10).subscribe(() => {
      let
        winHeight = window.innerHeight,
        bannerPosition = staticBanner.node().getBoundingClientRect().bottom;
      fixedBanner.classed('isVisible', bannerPosition > winHeight);
    });
  }

  private refreshBanner () {
    let
      self = this,
      banners = self.elements['banners'];
    banners.select('.tp-footer_bannerLabel')
      .html((self.banner && self.banner.html) || '');
    banners.select('.tp-footer_bannerIcon')
      .style('background-image', self.banner && self.banner['icon'] ? 'url(' + (self.banner['icon']) + ')' : 'none');
  }

  ngOnInit () {
    let self = this;

    self.refreshDOM();
    self.refreshWatchers();
  }
}
