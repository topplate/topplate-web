import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthorizationService } from '../services/authorization.service';
import { AccessPointService } from '../services/access-point.service';
import { ConstantsService } from '../services/constants.service';
import { SharedService } from '../services/shared.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ADMIN_ROUTES = CONSTANTS.ADMIN_ROUTES;

@Injectable()
export class AdminAuthGuard implements CanActivate {

  constructor (
    private router: Router,
    private authorizationService: AuthorizationService,
    private accessPointService: AccessPointService
  ) {}

  canActivate(): Promise<boolean> {

    let
      self = this,
      checkAuthUrl = '/check_admin_authorization';

    return new Promise((resolve) => {
      self.accessPointService.getRequest(
        checkAuthUrl,
        {},
        {
          onSuccess: () => {
            resolve(true);
          },
          onFail: err => {
            SharedService.getSharedComponent('growl').addItem(err);
            self.authorizationService.clearAdminUser();
            self.router.navigate([ADMIN_ROUTES.ADMIN_ENTRANCE])
              .then(() => {console.log('werwerwerwer'); });
            resolve(false);
          }
        }
      );
    });
  }
}
