import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConstantsService } from '../services/constants.service';
import { EnvironmentService } from '../services/environment.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES;

@Injectable()

export class EnvironmentGuard implements CanActivate {

  constructor (
    private router: Router,
    private environmentService: EnvironmentService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {

    let
      self = this,
      currentEnv = self.environmentService.getCurrent();

    console.log(currentEnv);

    if (!currentEnv) {
      self.router.navigate([ROUTES.SELECT_ENV]);
      return false;
    } else {
      return true;
    }
  }
}

