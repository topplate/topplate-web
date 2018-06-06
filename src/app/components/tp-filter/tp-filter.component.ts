import { Component, Input, OnInit, ElementRef, ViewEncapsulation } from '@angular/core';
import { FilterComponentModel } from '../../models/filter-component.model';
import { AppD3Service } from '../../services/d3.service';

const
  ROOT_ELEM_CLASS = 'tp-filter',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-tp-filter',
  templateUrl: './tp-filter.component.html',
  styleUrls: ['./tp-filter.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpFilterComponent implements OnInit {

  @Input() public model: FilterComponentModel;

  private root: any;

  constructor (
    private ref: ElementRef
  ) {}

  ngOnInit () {
    this.root = d3.select(this.ref.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }
}
