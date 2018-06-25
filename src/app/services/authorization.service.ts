import { Injectable, OnInit } from '@angular/core';
import { ConstantsService } from './constants.service';
import { AccessPointService } from './access-point.service';
import { AppD3Service } from './d3.service';
import { AuthService, FacebookLoginProvider, GoogleLoginProvider } from 'angular5-social-login';
import { AppConfig } from '../app.config';
import {BehaviorSubject} from "rxjs/BehaviorSubject";

const
  CONSTANTS = ConstantsService.getConstants(),
  AUTH_TOKEN = CONSTANTS.AUTH_TOKEN,
  USER_KEY = 'top-plate-user',
  ADMIN_KEY = 'admin-access-token',
  PROVIDER_KEY = 'last-used-provider',
  d3 = AppD3Service.getD3();

declare let FB: any;

@Injectable()

export class AuthorizationService {

  private currentUser: Object;

  private adminUser: Object | null = null;

  private authSubscription: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private static loadAdminAuthToken () {
    return localStorage.getItem(ADMIN_KEY);
  }

  private static saveAdminAuthToken (token) {
    localStorage.setItem(ADMIN_KEY, token);
  }

  private static clearAdminAuthToken () {
    localStorage.removeItem(ADMIN_KEY);
  }

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

  public setAdminUser (adminUserData) {
    this.adminUser = adminUserData;
    AuthorizationService.saveAdminAuthToken(adminUserData[ADMIN_KEY]);
  }

  public getAdminUser () {
    return this.adminUser;
  }

  public clearAdminUser () {
    this.adminUser = null;
    AuthorizationService.clearAdminAuthToken();
  }

  public restoreAdminUser () {
    let
      savedToken = AuthorizationService.loadAdminAuthToken(),
      adminUser = {};

    if (!savedToken) return;

    adminUser[ADMIN_KEY] = savedToken;
    this.setAdminUser(adminUser);
  }

  constructor (
    private socialAuthService: AuthService,
  ) {}
}

