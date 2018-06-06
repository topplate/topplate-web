import { Injectable } from '@angular/core';
import { ConstantsService } from './constants.service';

@Injectable()
export class SharedService {

  private static environmentsData: Object;

  private static likedPlates: Object;

  private static sharedComponents: Object = {};

  public static isAdminRoute: Boolean = false;

  public static setSharedComponent (name, api) {
    SharedService.sharedComponents[name] = api;
    return SharedService.getSharedComponent(name);
  }

  public static getSharedComponent (name) {
    return SharedService.sharedComponents[name];
  }

  public static setEnvironment (env) {
    localStorage.setItem('env', env);
    return SharedService;
  }

  public static getEnvironment () {
    return localStorage.getItem('env');
  }

  public static clearEnvironment () {
    localStorage.removeItem('env');
    return SharedService;
  }

  public static getToken () {
    return localStorage.getItem('acc_tok');
  }

  public static setToken (newToken) {
    localStorage.setItem('acc_tok', newToken);
    return SharedService;
  }

  public static clearToken () {
    localStorage.removeItem('acc_tok');
    return SharedService;
  }

  public static getEnvironmentData (env = null) {
    // return SharedService.environmentsData[env || SharedService.getEnvironment()];
  }

  public static setEnvironmentsData (environmentsData) {
    SharedService.environmentsData = environmentsData;
  }

  public static setLikedPlates (data) {
    SharedService.likedPlates = data;
  }

  public static getLikedPlates () {
    return SharedService.likedPlates || {};
  }

  public static clearLikedPlates () {
    SharedService.likedPlates && Object.keys(SharedService.likedPlates)
      .forEach(key => delete SharedService.likedPlates[key]);
  }
}
