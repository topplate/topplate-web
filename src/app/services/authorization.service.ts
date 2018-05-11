import { Injectable, OnInit } from '@angular/core';
import { ConstantsService } from './constants.service';
import { AccessPointService } from './access-point.service';
import { AppD3Service } from './d3.service';
import { AuthService, FacebookLoginProvider, GoogleLoginProvider } from 'angular5-social-login';
import { AppConfig } from '../app.config';

const
  CONSTANTS = ConstantsService.getConstants(),
  AUTH_TOKEN = CONSTANTS.AUTH_TOKEN,
  USER_KEY = 'top-plate-user',
  PROVIDER_KEY = 'last-used-provider',
  d3 = AppD3Service.getD3();

declare let FB: any;

@Injectable()

export class AuthorizationService {

  constructor (
    private socialAuthService: AuthService,
  ) {}

  private currentUser: Object;

  public getState () {
    return this.socialAuthService.authState;
  }

  public signIn (providerName) {
    return this.socialAuthService.signIn(providerName);
  }

  public signOut () {
    return this.socialAuthService.signOut();
  }

  public setCurrentUser (userData) {
    this.currentUser = userData;
  }

  public getCurrentUser () {
    return this.currentUser;
  }
}

