import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AuthService, FacebookLoginProvider, GoogleLoginProvider} from 'angular5-social-login';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {SharedService} from './shared.service';

const
  ADMIN_KEY = 'admin-access-token',
  PROVIDER_KEY = 'last-login-provider',
  GOOGLE_USER = 'google-user',
  FACEBOOK_USER = 'facebook-user',
  LOCAL_USER = 'local-user',
  LOCAL_PROVIDER = 'local';

@Injectable()

export class AuthorizationService {

  private adminUser: Object | null = null;

  private currentUser: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private static loadAdminAuthToken () {
    return localStorage.getItem(ADMIN_KEY);
  }

  private static saveAdminAuthToken (token) {
    localStorage.setItem(ADMIN_KEY, token);
  }

  private static clearAdminAuthToken () {
    localStorage.removeItem(ADMIN_KEY);
  }

  private static getUsedProviders () {
    let usedAccounts = {};
    [GOOGLE_USER, FACEBOOK_USER, LOCAL_USER]
      .forEach(key => usedAccounts[key] = localStorage.getItem(key) || null);
    return usedAccounts;
  }

  private static getLastUsedProvider () {
    return localStorage.getItem(PROVIDER_KEY);
  }

  private static setLastUsedProvider (userData) {
    SharedService.setToken(userData.token);
    localStorage.setItem(PROVIDER_KEY, userData.provider);
    localStorage.setItem(AuthorizationService.getLastUsedProvider() + '-user', SharedService.getToken());
  }

  private sendLoginRequest (userData) {
    return this.httpClient.post('/login_' + userData.provider, userData).toPromise();
  }

  private sendLogoutRequest () {
    let headers = new HttpHeaders()
      .append('Content-type', 'application/json')
      .append('Access-Token', SharedService.getToken() || '');

    return this.httpClient.post('/logout', {}, {headers: headers}).toPromise();
  }

  private restoreLocalSession (usedProviders) {
    let headers = new HttpHeaders()
      .append('Content-type', 'application/json')
      .append('Access-Token', usedProviders[LOCAL_USER] || '');

    return this.httpClient.post('restore_local_session', {}, {headers: headers}).toPromise();
  }

  private refreshSocialAuthObserver () {
    this.getState().subscribe(userData => {
      if (userData) {
        AuthorizationService.setLastUsedProvider(userData);
        this.sendLoginRequest(userData)
          .then(loginRes => this.setCurrentUser(loginRes))
          .catch(err => SharedService.getSharedComponent('growl').addItem(err));
      } else AuthorizationService.getLastUsedProvider() !== LOCAL_PROVIDER && this.sendLogoutRequest()
        .then(logoutRes => {
          this.setCurrentUser(null);
          SharedService.clearToken();
        })
        .catch(err => SharedService.getSharedComponent('growl').addItem(err));
    });
  }

  public getState () {
    return this.socialAuthService.authState;
  }

  public signIn (providerName, userData = null) {
    if (
      providerName === GoogleLoginProvider.PROVIDER_ID ||
      providerName === FacebookLoginProvider.PROVIDER_ID
    ) return this.socialAuthService.signIn(providerName);
    else if (providerName === LOCAL_PROVIDER && userData) {
      AuthorizationService.setLastUsedProvider(userData);
      this.setCurrentUser(userData);
    }
  }

  public signOut () {
    let providerName = AuthorizationService.getLastUsedProvider();

    if (
      providerName === GoogleLoginProvider.PROVIDER_ID ||
      providerName === FacebookLoginProvider.PROVIDER_ID
    ) return this.socialAuthService.signOut();

    else this.sendLogoutRequest()
      .then(() => {
        this.setCurrentUser(null);
        SharedService.clearToken();
      })
      .catch(err => SharedService.getSharedComponent('growl').addItem(err));
  }

  public setCurrentUser (userData) {
    this.currentUser.next(userData);
  }

  public getCurrentUser () {
    return this.currentUser.getValue();
  }

  public getCurrentUserSubscription (callback) {
    return this.currentUser.subscribe(currentUser => typeof callback === 'function' && callback(currentUser));
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
    private httpClient: HttpClient
  ) {

    let
      lastUsedProvider = AuthorizationService.getLastUsedProvider(),
      usedProviders = AuthorizationService.getUsedProviders();

    this.refreshSocialAuthObserver();
    lastUsedProvider === LOCAL_PROVIDER && this.restoreLocalSession(usedProviders)
      .then(userData => this.signIn(LOCAL_PROVIDER, userData))
      .catch(err => err.status !== 401 && SharedService.getSharedComponent('growl').addItem(err));
  }
}

