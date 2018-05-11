import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { AppD3Service } from '../services/d3.service';
import { ConstantsService } from '../services/constants.service';
import { SharedService } from '../services/shared.service';
import { AccessPointService } from '../services/access-point.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  d3 = AppD3Service.getD3();

@Injectable()
export class PlatesResolver implements Resolve<any> {

  constructor (
    private accessPointService: AccessPointService
  ) {}

  resolve () {
    let self = this;
    return new Promise((resolve, reject) => {
      resolve([]);
      // self.accessPointService.getRequest('/get_plates', {
      //   environment: SharedService.getEnvironment()
      // }, {
      //   onSuccess: loadedData => resolve(loadedData),
      //   onFail: err => reject(err)
      // });
    });
  }
}


