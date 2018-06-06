import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { SharedService } from './shared.service';
import { AuthorizationService } from './authorization.service';
import 'rxjs/add/operator/catch';

import { ConstantsService } from './constants.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  REST_API = CONSTANTS.REST_API,
  TYPES = CONSTANTS.TYPES,
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

@Injectable()

export class AccessPointService {

  constructor (
    private authorizationService: AuthorizationService,
    private httpClient: HttpClient
  ) {}

  private static prepareCallbacks (customCallbacks) {

    customCallbacks.onSuccess = getNormalized(customCallbacks.onSuccess);
    customCallbacks.onFail = getNormalized(customCallbacks.onFail);

    return customCallbacks;

    function getNormalized (thing) {
      return typeof thing === 'function' ? thing : someData => {};
    }
  }

  private getHeaders () {
    let
      adminUser = this.authorizationService.getAdminUser(),
      adminUserKey = 'admin-access-token';

    return new HttpHeaders()
      .append('Content-type', 'application/json')
      .append('Access-Token', SharedService.getToken() || '')
      .append('User-Environment', SharedService.getEnvironment() || '')
      .append(adminUserKey, adminUser ? adminUser[adminUserKey] : '');
  }

  public getRequest (apiUrl, params, customCallbacks = {}) {
    let
      reqParams = new HttpParams(),
      reqCallbacks = AccessPointService.prepareCallbacks(customCallbacks);

    typeof params === TYPES.OBJECT && Object.keys(params).forEach(
      key => reqParams = reqParams.append(key, params[key] + '')
    );

    return this.httpClient.get(apiUrl, {
      headers: this.getHeaders(),
      params: reqParams
    }).subscribe(
      reqCallbacks.onSuccess,
      reqCallbacks.onFail
    );
  }

  public postRequest (apiUrl, data, customCallbacks = {}) {
    let reqCallbacks = AccessPointService.prepareCallbacks(customCallbacks);

    return this.httpClient.post(apiUrl, data, {
      headers: this.getHeaders()
    }).subscribe(
      reqCallbacks.onSuccess,
      reqCallbacks.onFail
    );
  }
}
