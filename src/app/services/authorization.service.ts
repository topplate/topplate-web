import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {AuthService, FacebookLoginProvider, GoogleLoginProvider} from 'angular5-social-login';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {SharedService} from './shared.service';
import {ConstantsService} from './constants.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
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

  private currentState: BehaviorSubject<any> = new BehaviorSubject<any>(null);

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

  private checkState () {

    let
      currentState = this.currentState.getValue(),
      currentUser = this.currentUser.getValue();

    if (currentUser && currentState.unauthorizedOnly) this.router
      .navigate([ROUTES.PROFILE + '/', currentUser['_id']]);

    else if (!currentUser && (currentState && currentState.authorizedOnly)) this.router
      .navigate([ROUTES.PLATES]);
  }

  public restoreLocalSession () {
    let
      usedProviders = AuthorizationService.getUsedProviders(),
      headers = new HttpHeaders()
        .append('Content-type', 'application/json')
        .append('Access-Token', usedProviders[LOCAL_USER] || '');

    return this.httpClient.post('restore_local_session', {}, {headers: headers}).toPromise();
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
    if (userData && userData.token !== SharedService.getToken()) SharedService.setToken(userData.token);
    this.currentUser.next(userData);
    this.checkState();
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
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private socialAuthService: AuthService,
    private httpClient: HttpClient
  ) {

    let lastUsedProvider = AuthorizationService.getLastUsedProvider();

    this.refreshSocialAuthObserver();
    lastUsedProvider === LOCAL_PROVIDER && this.restoreLocalSession()
      .then(userData => this.signIn(LOCAL_PROVIDER, userData))
      .catch(err => err.status !== 401 && SharedService.getSharedComponent('growl').addItem(err));

    this.router.events.subscribe( (event) => {
      event instanceof NavigationEnd && this.currentState.next(this.activatedRoute.root.firstChild.snapshot.data);
    });
  }
}

