import { Injectable } from '@angular/core';
import { Resolve, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AppD3Service } from '../services/d3.service';
import { ConstantsService } from '../services/constants.service';
import { AccessPointService } from '../services/access-point.service';

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
      geo: 'Antarctica',
      likes: Math.floor(Math.random() * 12000),
      hasRecipe: true,
      liked: !!Math.floor(Math.random() * 2),
      ingredients: [
        '8 kg of ukrop',
        '2 fat cats',
        '3 tails of buldog puppies',
        '5 little monkeys jumping on the bed',
        'some strange stinky sauce',
        '3 pounds of sugar',
        'a bit of salt'
      ]
    };
  });

@Injectable()
export class PlateResolver implements Resolve<any> {

  constructor (
    private accessPointService: AccessPointService
  ) {}

  resolve (routeSnapshot: ActivatedRouteSnapshot) {
    let
      self = this,
      plateId = routeSnapshot.params['id'];

    return new Promise((resolve, reject) => {
      self.accessPointService.getRequest('/get_plate', {id: plateId}, {
        onSuccess: plateData => resolve(plateData),
        onFail: err => reject(err)
      });
    });
  }
}
