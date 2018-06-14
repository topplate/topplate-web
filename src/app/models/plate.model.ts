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

  public _id: string;

  public name: String;

  public images: String[];

  public author: PlateAuthorModel;

  public address: String;

  public likes: any = 0;

  public liked: Boolean;

  public recipe: String;

  public ingredients: String[];

  public hasRecipe: Boolean;

  public environment: String;

  public canLike: Boolean;

  public relatedPlates: PlateModel[] = [];

  /** Methods */
  public onLinkClick: any;

  public onProfileLinkClick: any;

  public onLikeClick: any;

  public onDislikeClick: any;

  public likeIt () {
    this.likes += 1;
    this.liked = true;
  }

  public dislikeIt () {
    this.likes = this.likes > 0 ? this.likes - 1 : 0;
    this.liked = false;
  }

}

