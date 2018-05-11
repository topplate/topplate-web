import { Injectable } from '@angular/core';
import { ConstantsService } from './constants.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

const
  CONSTANTS = ConstantsService.getConstants(),
  ENV_KEY = 'user-environment',
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS;

@Injectable()
export class EnvironmentService {

  constructor (
  ) {
    let self = this;
    self.current = new BehaviorSubject(EnvironmentService.getLocalStorageVariable());
  }

  private current: BehaviorSubject<any>;

  private available: Array<string> = [ENVIRONMENTS.RESTAURANT, ENVIRONMENTS.HOMEMADE];

  private static getLocalStorageVariable () {
    return localStorage.getItem(ENV_KEY);
  }

  private static setLocalStorageVariable (env) {
    localStorage.setItem(ENV_KEY, env);
    return EnvironmentService;
  }

  private static clearLocalStorageVariable () {
    localStorage.removeItem(ENV_KEY);
    return EnvironmentService;
  }

  public setCurrent (newEnv) {
    let self = this;
    if (self.available.indexOf(newEnv) > -1) {
      self.current.next(newEnv);
      EnvironmentService.setLocalStorageVariable(newEnv);
    }
    return self;
  }

  public getCurrent () {
    let self = this;
    return self.current.getValue();
  }

  public clearCurrent () {
    let self = this;
    self.current.next(null);
    EnvironmentService.clearLocalStorageVariable();
  }

  public getSubscription (fn) {
    let self = this;
    return self.current.subscribe(() => typeof fn === 'function' && fn(self.getCurrent()));
  }

  public getAvailableEnvironments () {
    let self = this;
    return self.available.map(env => env);
  }
}

