import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {AuthorizationService} from '../services/authorization.service';
import {ConstantsService} from '../services/constants.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES;

@Injectable()
export class UnauthGuard implements CanActivate {

  constructor (
    private authorizationService: AuthorizationService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    return new Promise(resolve => {
      let currentUser = this.authorizationService.getCurrentUser();
      if (currentUser) {
        this.router.navigate([ROUTES.PROFILE + '/', currentUser['_id']]);
        resolve(false);
      } else resolve(true);
    });
  }
}
