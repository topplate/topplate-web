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
export class ContactsResolver implements Resolve<any> {

  constructor (
    private accessPointService: AccessPointService
  ) {}

  resolve (routeSnapshot: ActivatedRouteSnapshot) {
    let self = this;

    return new Promise((resolve, reject) => {
      self.accessPointService.getRequest('/get_contacts', {}, {
        onSuccess: contactsData => resolve(contactsData),
        onFail: err => reject(err)
      });
    });
  }
}
