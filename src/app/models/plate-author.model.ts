import { Injectable } from '@angular/core';

@Injectable()

export class PlateAuthorModel {

  constructor (initialData) {
    let self = this;

    // try {
    //
    //   Object.keys(initialData).forEach(key => {
    //
    //
    //
    //   });
    //
    // }
    // typeof initialData === 'object' && Object.keys(initialData).forEach(key => {
    //
    //
    //
    // });

  }

  public id: String;

  public name: String;

  public image: String;
}
