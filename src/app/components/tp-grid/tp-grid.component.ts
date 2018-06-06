import { Component, Input, OnInit, ElementRef, ViewEncapsulation } from '@angular/core';
import { GridComponentModel } from '../../models/grid-component.model';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';

const
  d3 = AppD3Service.getD3(),
  ROOT_ELEM_CLASS = 'tp-grid';

@Component({
  selector: 'app-tp-grid',
  templateUrl: './tp-grid.component.html',
  styleUrls: ['./tp-grid.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpGridComponent implements OnInit {

  @Input() public model: GridComponentModel;

  private root: any;

  constructor (
    private ref: ElementRef
  ) {}

  ngOnInit () {
    this.root = d3.select(this.ref.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }
}
