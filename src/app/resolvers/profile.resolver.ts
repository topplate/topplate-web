import { Injectable } from '@angular/core';
import { Resolve, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AppD3Service } from '../services/d3.service';
import { ConstantsService } from '../services/constants.service';
import { AccessPointService } from '../services/access-point.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  d3 = AppD3Service.getD3();

@Injectable()
export class ProfileResolver implements Resolve<any> {

  constructor (
    private accessPointService: AccessPointService
  ) {}

  resolve (routeSnapshot: ActivatedRouteSnapshot) {
    let
      self = this,
      userId = routeSnapshot.params['id'];

    return new Promise((resolve, reject) => {
      self.accessPointService.getRequest('/get-user-profile', {id: userId}, {
        onSuccess: userData => resolve(userData),
        onFail: err => reject(err)
      });
    });
  }
}
