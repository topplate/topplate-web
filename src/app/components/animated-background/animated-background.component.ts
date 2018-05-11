import { Component, OnInit, DoCheck, Input, ElementRef, ViewEncapsulation } from '@angular/core';
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
export class AnimatedBackgroundComponent implements OnInit, DoCheck {

  constructor( private reference: ElementRef ) {}

  @Input() private source: any;

  private isReady: boolean;

  private gallery: any;

  private rootElement: any;

  private timer: any;

  private static getSourceImages (source) {

    if (!source) return null;
    else if (typeof source === TYPES.STRING) return [source];
    else if (Array.isArray(source) && source.every(item => typeof item === TYPES.STRING)) return source;
    else return null;

  }

  private refreshView () {

    let
      self = this,
      gallery = self.gallery,
      rootElem = self.rootElement,
      backgroundImage = rootElem.select('.animated-background_image');

    backgroundImage.style('background-image', 'url(' + gallery[0] + ')');

  }

  ngOnInit () {

    let
      self = this,
      rootElement = self.rootElement = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);

    self.gallery = [];

  }

  ngDoCheck () {

    let
      self = this,
      source = AnimatedBackgroundComponent.getSourceImages(self.source);

    if (!source) self.isReady = false;
    else if (!self.isReady) {
      self.isReady = true;
      self.gallery = source;
      self.refreshView();
    }
  }
}

