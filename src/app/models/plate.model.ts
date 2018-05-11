import { Injectable } from '@angular/core';
import { PlateAuthorModel } from './plate-author.model';

@Injectable()

export class PlateModel {

  constructor ( initialData ) {
    let self = this;

    try {
      Object.keys(initialData).forEach(key => self[key] = initialData[key]);
    } catch (err) { console.log(err); }
  }

  public _id: String;

  public name: String;

  public images: String[];

  public author: PlateAuthorModel;

  public address: String;

  public likes: Number;

  public recipe: String;

  public ingredients: String[];

  public hasRecipe: Boolean;

  public environment: String;

  public canLike: Boolean;

  /** Methods */
  public onLinkClick: any;

  public onProfileLinkClick: any;

  public onLikeClick: any;

}

