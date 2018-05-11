import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AppD3Service } from '../services/d3.service';
import { ConstantsService } from '../services/constants.service';
import { SharedService } from '../services/shared.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  d3 = AppD3Service.getD3();

let
  numberOfPlates = 4,
  randomPlates = d3.range(numberOfPlates).map(i => {
    return {
      _id: 'someId' + i,
      images: '/assets/restaurant/' + i + '.jpg',
      name: 'ROASTED SOMETHING WITH JUICY GARLIC AND PEPPER',
      author: '@someName',
      address: 'Antarctica',
      likes: Math.floor(Math.random() * 12000),
      hasRecipe: !!Math.floor(Math.random() * 2),
      liked: !!Math.floor(Math.random() * 2),
      isFinalized: true
    };
  });

@Injectable()
export class WinnersResolver implements Resolve<any> {
  resolve () {
    return new Promise((resolve, reject) => {
      setTimeout( () => resolve(randomPlates), 100);
    });
  }
}
