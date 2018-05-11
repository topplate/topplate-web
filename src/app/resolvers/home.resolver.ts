import { Injectable } from '@angular/core';
import { Resolve, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SharedService } from '../services/shared.service';
import { AppD3Service } from '../services/d3.service';
import { ConstantsService } from '../services/constants.service';
import { AccessPointService } from '../services/access-point.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  d3 = AppD3Service.getD3();

let
  environments = {
    restaurant: '/assets/bg-1.jpg',
    homemade: '/assets/bg-2.jpg'
  };

@Injectable()
export class HomeResolver implements Resolve<any> {

  constructor (
    private accessPointService: AccessPointService,
    private activatedRoute: ActivatedRoute
  ) {}

  resolve () {

    let self = this;

    return new Promise((resolve, reject) => {
      self.accessPointService.getRequest('/get_environments', {}, {
        onSuccess: loadedData => {
          SharedService.setEnvironmentsData(loadedData);
          resolve(loadedData);
        },
        onFail: err => reject(err)
      });
    });
  }
}


