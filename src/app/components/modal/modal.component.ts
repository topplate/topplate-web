import { Component, OnInit, DoCheck, OnDestroy, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import {Route, ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

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

  @Input() public state: BehaviorSubject<boolean>;

  private elements: Object = {};

  public closeModal () {
    let self = this;
    self.state.next(false);
  }

  public onContentClick (event) {
    event && event.stopPropagation();
  }

  private refreshDOM () {
    let
      self = this,
      rootElem =  d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true),
      elements = self.elements;

    elements['root'] = rootElem;
    elements['wrapper'] = rootElem.select('.top-plate_modalContent_wrapper');
    elements['content'] = rootElem.select('.top-plate_modalContent');
    elements['rail'] = rootElem.select('.top-plate_modal_sliderRail');
    elements['caret'] = rootElem.select('.top-plate_modal_sliderCaret');
  }

  private refreshObservers () {

    let
      self = this,
      elements = self.elements;

    self.state
      .distinctUntilChanged()
      .subscribe(state => {
        elements['root'].classed('isOpened', state);

        if (state) setTimeout(() => self.refreshScroller(), 500);
        else {
          elements['rail'].classed('isOpened', false);
        }
      });
  }

  private refreshScroller () {
    let
      self = this,
      elements = self.elements,
      fixedPadding = 100,
      wrapperNode = elements['wrapper'].node(),
      contentHeight = elements['content'].node().clientHeight + (fixedPadding * 2),
      fullHeight = window.innerHeight,
      scrollLimit = contentHeight - fullHeight,
      caretHeight = fullHeight < contentHeight ? (fullHeight / contentHeight) * fullHeight : 0,
      railSize = fullHeight - caretHeight,
      caretPosition = 0;

    if (!caretHeight) return elements['rail'].classed('isOpened', false) && null;

    elements['rail'].classed('isOpened', true);
    elements['caret']
      .style('transform', 'translate(0, 0)')
      .style('height', caretHeight + 'px')
      .on('mousedown', () => {
        let
          event = d3.event,
          touchStartPosition = event.clientY,
          limits = [0, railSize],
          doc = d3.select(document),
          body = d3.select('body'),
          wrapper = elements['wrapper'].node();

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

            if (newCaretPosition < limits[0]) newCaretPosition = limits[0];
            if (newCaretPosition > limits[1]) newCaretPosition = limits[1];

            caretPosition = newCaretPosition;
            touchStartPosition = touchMovePosition;

            wrapper.scrollTop = (caretPosition / railSize) * scrollLimit;

            elements['caret']
              .transition().duration(100).ease(d3.easeCubicOut)
              .style('transform', 'translate(0, ' +
                ((wrapper.scrollTop / scrollLimit) * railSize) + 'px)');
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

    elements['root'].on('wheel', () => {
      let
        wheelEvent = d3.event,
        step = 30,
        delta = (wheelEvent.deltaY < 0 ? -1 : 1) * step;
      wrapperNode.scrollTop = wrapperNode.scrollTop + delta;
      caretPosition = (wrapperNode.scrollTop / scrollLimit) * railSize;
      elements['caret']
        .transition().duration(100).ease(d3.easeCubicOut)
        .style('transform', 'translate(0, ' + caretPosition + 'px)');
    });
  }

  ngOnInit () {

    let self = this;

    self.refreshDOM();
    self.refreshObservers();
  }

  ngDoCheck () {}

  ngOnDestroy () {
    this.state.unsubscribe();
  }

}
