import { Component, OnInit, OnDestroy, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import { ConstantsService } from '../../services/constants.service';
import { AppD3Service } from '../../services/d3.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  TYPES = CONSTANTS.TYPES,
  ROOT_ELEM_CLASS = 'animated-background',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-animated-background',
  templateUrl: './animated-background.component.html',
  styleUrls: ['./animated-background.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AnimatedBackgroundComponent implements OnInit, OnDestroy {

  constructor( private reference: ElementRef ) {}

  @Input() private source: any;

  private gallery: any[] = [];

  private rootElement: any;

  private onChangeTimer: any;

  public animationEnabled: Boolean = true;

  private static getSourceImages (source) {

    if (!source) return null;
    else if (typeof source === TYPES.STRING) return [source];
    else if (Array.isArray(source) && source.every(item => typeof item === TYPES.STRING)) return source;
    else return null;

  }

  private refreshView () {
    let
      self = this,
      gallery = self.gallery;
    self.animationEnabled = false;
    gallery[0] && self.rootElement
      .select('.animated-background_image')
      .style('background-image', 'url(' + gallery[0] + ')')
      .transition().duration(1000)
      .on('end', () => self.animationEnabled = true);
  }

  private refreshWatchers () {
    let
      self = this,
      currentValue = self.gallery[0];

    self.onChangeTimer = setInterval(() => {
      self.gallery = AnimatedBackgroundComponent.getSourceImages(self.source);
      if (self.gallery[0] !== currentValue) {
        currentValue = self.gallery[0];
        self.refreshView();
      }
    }, 100);
  }

  ngOnInit () {
    let self = this;
    self.rootElement = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);
    self.gallery = [];
    self.refreshWatchers();
  }

  ngOnDestroy () {
    clearInterval(this.onChangeTimer);
  }
}

