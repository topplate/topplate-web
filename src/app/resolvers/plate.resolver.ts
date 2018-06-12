import { Injectable } from '@angular/core';
import { Resolve, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { AccessPointService } from '../services/access-point.service';

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
