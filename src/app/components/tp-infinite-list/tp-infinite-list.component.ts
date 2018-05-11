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
  ROOT_ELEM_CLASS = 'tp-infinite-list',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-tp-infinite-list',
  templateUrl: './tp-infinite-list.component.html',
  styleUrls: ['./tp-infinite-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpInfiniteListComponent implements OnInit, OnDestroy {

  constructor (
    private reference: ElementRef
  ) {}

  @Input() public customSettings: Object;

  @Input() public events: Object;

  public list: Object[] = [];

  public settings: Object;

  public endOfListReachedEventEmitted: Boolean = true;

  private isFinalized: Boolean = false;

  private elements: Object;

  private scrollWatcher: Object;

  private static getDefaultSettings () {
    return {
      width: 300,
      height: 250,
      showLabel: true,
      showGeo: true,
      showAuthor: true,
      showRecipeBanner: true
    };
  }

  private refreshDOM () {
    let
      self = this,
      rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);

    self.elements = {
      root: rootElem,
      content: rootElem.select('.tp-infinite-list_content'),
      overlay: rootElem.select('.tp-infinite-list_overlay'),
      scrollMarker: rootElem.select('.tp-infinite-list_scrollMarker')
    };
  }

  private refreshSettings () {
    let
      self = this,
      defaultSettings = TpInfiniteListComponent.getDefaultSettings(),
      customSettings = self.customSettings || {};

    Object.keys(defaultSettings).forEach(key => {
      self.settings = self.settings || {};
      self.settings[key] = customSettings.hasOwnProperty(key) ? customSettings[key] : defaultSettings[key];
    });
  }

  private refreshScrollWatcher () {
    let
      self = this,
      scrollWatcher = self.scrollWatcher = {},
      scrollMarker = self.elements['scrollMarker'].node(),
      events = self.events || {};

    scrollWatcher['curr'] = 0;
    scrollWatcher['prev'] = 0;
    scrollWatcher['delay'] = 1000;
    scrollWatcher['timer'] = null;
    scrollWatcher['refresh'] = () => {

      if (
        !self.list ||
        !self.list.length ||
        self.isFinalized ||  /** For test only, need to remove comment */
        self.endOfListReachedEventEmitted
      ) return;

      let
        windowHeight = window.innerHeight,
        currentMarkerPosition = scrollMarker.getBoundingClientRect().top,
        delta = currentMarkerPosition - windowHeight;

      if (delta < (windowHeight * .5)) {
        self.endOfListReachedEventEmitted = true;
        typeof events['onEndOfListReached'] === 'function' && events['onEndOfListReached']();
      }
    };

    scrollWatcher['timer'] = d3.timer(val => scrollWatcher['refresh'].call(), scrollWatcher['delay']);
  }

  private loadImages (newImages) {

    let
      self = this,
      inputLen = newImages.length,
      outputLen = 0;

    return new Promise((resolve, reject) => {
      newImages.forEach(src => {
        let newImage = new Image();
        newImage.src = src;
        newImage.onload = () => {
          outputLen += 1;
          outputLen === inputLen && resolve('done');
        };
        newImage.onerror = (err) => {
          console.log(err);
        };
      });
    });
  }

  private animateAppearance () {
    let self = this;

    self.elements['content'].selectAll('.isNewOne')
      .each(function (d, i) {
        let elem = d3.select(this);
        elem
          .transition().duration(500).delay(i * 100).ease(d3.easeCubicOut)
          .style('opacity', 1)
          .style('transform', 'translate(0, 0)')
          .on('end', () => elem.classed('isNewOne', false));
      });
  }

  ngOnInit () {
    let
      self = this,
      events = self.events || {};

    self.refreshDOM();
    self.refreshSettings();
    self.refreshScrollWatcher();

    typeof events['onReady'] === 'function' && events['onReady']({
      addItems: items => {

        self.endOfListReachedEventEmitted = true;
        let images = [];
        items.forEach(item => {
          item['isNewOne'] = true;
          images = images.concat(item.images);
        });
        self.loadImages(images)
          .then(res => {
            self.list = self.list || [];
            self.list = self.list.concat(items);
            self.endOfListReachedEventEmitted = false;
            setTimeout(() => self.animateAppearance(), 10);
          })
          .catch(err => console.log(err));
      },
      getRequiredNumberOfItems: () => {
        let
          fullWidth = window.innerWidth,
          fullHeight = window.innerHeight,
          itemWidth = self.settings['width'],
          itemHeight = self.settings['height'],
          itemsInRow = Math.floor(fullWidth / itemWidth),
          itemsInCol = Math.floor(fullHeight / itemHeight);

        return (itemsInCol * 2) * itemsInRow;
      },
      clearList: () => {
        self.list.length = 0;
        self.endOfListReachedEventEmitted = false;
      },
      getCurrentIndex: () => self.list.length,
      toggleOvelray: state => self.elements['overlay'].classed('isVisible', !!state),
      setFinalized: state => self.isFinalized = !!state,
      getFinalized: () => self.isFinalized,
      getLastOne: () => self.list[self.list.length - 1]
    });
  }

  ngOnDestroy () {
    this.scrollWatcher['timer'].stop();
  }
}

