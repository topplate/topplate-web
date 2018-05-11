import { Component, OnInit, DoCheck, OnDestroy, AfterViewInit, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import {Route, ActivatedRoute, ActivationEnd, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { AuthorizationService } from '../../services/authorization.service';
import { SharedService } from '../../services/shared.service';
import { AccessPointService } from '../../services/access-point.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { timer } from 'rxjs/observable/timer';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  TYPES = CONSTANTS.TYPES,
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS,
  ROOT_ELEM_CLASS = 'tp-scrollable',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-tp-scrollable',
  templateUrl: './tp-scrollable.component.html',
  styleUrls: ['./tp-scrollable.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpScrollableComponent implements OnInit, OnDestroy {

  constructor (
    private router: Router,
    private reference: ElementRef
  ) {}

  private elements: Object = {};

  private resizeWatcher: Object = {};

  private getCurrentValues () {
    let
      self = this,
      paddingTop = 101,
      content = self.elements['content'].node(),
      contentInner = self.elements['content'].select('.tp-scrollable_contentInner').node(),
      outerHeight = window.innerHeight - paddingTop,
      innerHeight = contentInner.clientHeight;

    return {
      outerHeight: outerHeight,
      innerHeight: innerHeight,
      hash: outerHeight + '_' + innerHeight
    };
  }

  private refreshDOM () {
    let
      self = this,
      rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true),
      elements = self.elements;

    elements['root'] = rootElem;
    elements['content'] = rootElem.select('.tp-scrollable_content');
    elements['slider'] = rootElem.select('.tp-scrollable_sliderRail');
  }

  private refreshWatchers () {
    let
      self = this,
      values = self.getCurrentValues(),
      resizeWatcher = self.resizeWatcher,
      content = self.elements['content'];

    resizeWatcher['curr'] = '';
    resizeWatcher['prev'] = '';
    resizeWatcher['timer'] = timer(0, 10);
    resizeWatcher['timer'].subscribe(t => {
      values = self.getCurrentValues();
      resizeWatcher['prev'] = resizeWatcher['curr'];
      resizeWatcher['curr'] = values.hash;
      resizeWatcher['prev'] !== resizeWatcher['curr'] && self.refreshView();
    });

    self.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) content.node().scrollTop = 0;
    });
  }

  private refreshView () {

    let
      self = this,
      currentValues = self.getCurrentValues(),
      rootElem = self.elements['root'],
      content = self.elements['content'],
      pageContent = content.select('.tp-page-content'),
      pageFooter = content.select('.tp-footer'),
      rail = self.elements['slider'],
      caret = rail.select('.tp-scrollable_sliderCaret'),
      scrollLimit = currentValues.innerHeight - currentValues.outerHeight,
      isVisible = scrollLimit > 0,
      caretSize = 0, railSize = 0, caretPosition = 0;

    refreshSizes();

    content.style('height', currentValues.outerHeight + 'px');
    pageContent.style('min-height', (content.node().clientHeight - pageFooter.node().clientHeight - 1) + 'px');
    rail.style('display', isVisible ? 'block' : 'none');
    caret
      .transition().duration(0)
      .style('height', caretSize + 'px')
      .style('transform', 'translate(0, ' + caretPosition + 'px)');

    caret
      .on('mousedown', () => {
        let
          event = d3.event,
          touchStartPosition = event.clientY,
          limits = [0, railSize],
          doc = d3.select(document),
          body = d3.select('body');

        event.stopPropagation();

        body
          .classed('no-select', true)
          .classed('ns-resize', true);

        doc
          .on('mousemove', () => {
            let
              touchMovePosition = d3.event.clientY,
              delta = touchMovePosition - touchStartPosition,
              newCaretPosition = caretPosition + delta;

            refreshSizes();
            limits = [0, railSize];
            if (newCaretPosition < limits[0]) newCaretPosition = limits[0];
            if (newCaretPosition > limits[1]) newCaretPosition = limits[1];

            caretPosition = newCaretPosition;
            touchStartPosition = touchMovePosition;

            content.node().scrollTop = (caretPosition / railSize) * scrollLimit;

            caret
              .transition().duration(100).ease(d3.easeCubicOut)
              .style('transform', 'translate(0, ' +
                ((content.node().scrollTop / scrollLimit) * railSize) + 'px)');
          })
          .on('mouseup', () => {
            body
              .classed('no-select', false)
              .classed('ns-resize', false);
            doc
              .on('mousemove', null)
              .on('mouseup', null);
          });
      });

    rootElem
      .on('mousedown', () => {
        let
          touchStartPosition = d3.event.clientY,
          doc = d3.select(document),
          body = d3.select('body');

        body
          .classed('no-select', true)
          .classed('ns-resize', true);

        doc
          .on('mousemove', () => {
            let
              touchMovePosition = d3.event.clientY,
              delta = touchStartPosition - touchMovePosition;

            content.node().scrollTop = content.node().scrollTop + delta;

            touchStartPosition = touchMovePosition;
            caretPosition = (content.node().scrollTop / scrollLimit) * railSize;

            caret
              .transition().duration(100).ease(d3.easeCubicOut)
              .style('transform', 'translate(0, ' + caretPosition + 'px)');
          })
          .on('mouseup', () => {
            body
              .classed('no-select', false)
              .classed('ns-resize', false);
            doc
              .on('mousemove', null)
              .on('mouseup', null);
          });
      })
      .on('wheel', () => {
        let
          wheelEvent = d3.event,
          step = 30,
          delta = (wheelEvent.deltaY < 0 ? -1 : 1) * step;
        content.node().scrollTop = content.node().scrollTop + delta;
        caretPosition = (content.node().scrollTop / scrollLimit) * railSize;
        caret
          .transition().duration(100).ease(d3.easeCubicOut)
          .style('transform', 'translate(0, ' + caretPosition + 'px)');
      });

    function refreshSizes () {
        caretSize = isVisible ? (currentValues.outerHeight / currentValues.innerHeight) * currentValues.outerHeight : 0;
        railSize = currentValues.outerHeight - caretSize;
        caretPosition = (content.node().scrollTop / scrollLimit) * railSize;
    }
  }

  ngOnInit () {
    let self = this;

    self.refreshDOM();
    self.refreshWatchers();
  }

  ngOnDestroy () {
    this.resizeWatcher['timer'].unsubscribe();
  }
}

