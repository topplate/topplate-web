import { Input, Component, OnInit, ElementRef, ViewEncapsulation } from '@angular/core';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { CollectionComponentModel } from '../../models/collection-component.model';

const
  d3 = AppD3Service.getD3(),
  ENTER_KEY = 13,
  CONSTANTS = ConstantsService.getConstants(),
  ROOT_ELEM_CLASS = 'tp-collection';

@Component({
  selector: 'app-tp-collection',
  templateUrl: './tp-collection.component.html',
  styleUrls: ['./tp-collection.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpCollectionComponent implements OnInit {

  @Input() public model: CollectionComponentModel;

  private rootElem: any;

  public addItem () {
    if (!this.isValid) return;
    this.model.addItems({text: this.model.newItem});
    this.model.newItem = '';
    this.rootElem.select('.tp-collection-list-addItem-input').node().focus();
  }

  public onKeyUp (event) {
    if (event.which === ENTER_KEY) this.addItem();
  }

  public get isValid () {
    return (this.model.newItem.replace(/\s/g, '')).length;
  }

  constructor (
    private ref: ElementRef
  ) {}

  ngOnInit () {
    this.rootElem = d3.select(this.ref.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }

}
