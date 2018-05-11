import { Injectable } from '@angular/core';

import { D3Service, D3, Selection } from 'd3-ng2-service';

const d3 = (new D3Service()).getD3();

@Injectable()

export class AppD3Service {

  public static getD3 () { return d3; }

}
