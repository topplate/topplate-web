import {Component, Input, OnInit, ElementRef, ViewEncapsulation, OnDestroy} from '@angular/core';
import { GridComponentModel } from '../../models/grid-component.model';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import {timer} from 'rxjs/internal/observable/timer';

const
  d3 = AppD3Service.getD3(),
  ROOT_ELEM_CLASS = 'tp-grid';

@Component({
  selector: 'app-tp-grid',
  templateUrl: './tp-grid.component.html',
  styleUrls: ['./tp-grid.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpGridComponent implements OnInit, OnDestroy {

  @Input() public model: GridComponentModel;

  private itWorks: Boolean = true;

  private root: any;

  private offsetTop: any = 100;

  private scrollTimer: any = null;

  public fixedHeader: Boolean = false;

  private refreshDOM () {
    let
      self = this,
      offsetTop = this.offsetTop,
      root = this.root = d3.select(this.ref.nativeElement).classed(ROOT_ELEM_CLASS, true),
      table = root.select('.tp-grid-table').node(),
      topMarker = root.select('.tp-grid-marker-top').node(),
      bottomMarker = root.select('.tp-grid-marker-bottom').node(),
      header = root.select('.tp-grid-static-header'),
      floatingHeaderBlock = root.select('.tp-grid-fixed-header'),
      floatingHeader = root.select('.tp-grid-floating-header');

    setTimeout(() => {

      let cols = self.model.cols;

      header.selectAll('td').each(function (d, i) {
        cols[i]['staticElem'] = this;
      });

      floatingHeader.selectAll('td').each(function (d, i) {
        cols[i]['fixedElem'] = d3.select(this);
      });

      self.scrollTimer = setInterval(() => refreshFloatingHeader(), 25);
    }, 25);

    function refreshFloatingHeader () {
      let
        cols = self.model.cols,
        topMarkerPosition = topMarker['getBoundingClientRect']().top,
        bottomMarkerPosition = bottomMarker['getBoundingClientRect']().top,
        isVisible = topMarkerPosition < offsetTop && bottomMarkerPosition > offsetTop;

      floatingHeaderBlock
        .classed('isVisible', isVisible)
        .style('left', table['getBoundingClientRect']().left + 'px');
      cols.forEach(col => col.fixedElem.style('width', col.staticElem.clientWidth + 'px'));
    }
  }

  constructor (
    private ref: ElementRef
  ) {}

  ngOnInit () {
    this.refreshDOM();
  }

  ngOnDestroy () {
    clearInterval(this.scrollTimer);
  }
}
