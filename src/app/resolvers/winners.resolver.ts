import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

@Injectable()
export class WinnersResolver implements Resolve<any> {

  constructor  () {}

  resolve () {
    let self = this;
    return new Promise((resolve, reject) => {
      resolve([]);
    });
  }
}
