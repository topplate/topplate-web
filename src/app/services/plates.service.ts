import { Injectable } from '@angular/core';
import { PlateModel } from '../models/plate.model';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { SharedService } from './shared.service';
import { ConstantsService } from './constants.service';
import { AccessPointService } from './access-point.service';
import { AuthorizationService } from './authorization.service';
import { EnvironmentService } from './environment.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES;

@Injectable()
export class PlatesService {

  constructor (
    private router: Router,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService,
    private environmentService: EnvironmentService
  ) {}

  private platesList: PlateModel[] = [];

  public createPlateEntity (initialData, customAllowedMethods = {}) {

    let
      self = this,
      newPlate = new PlateModel(initialData),
      defaultAllowedMethods = {
        'onLinkClick': true,
        'onProfileLinkClick': true,
        'onLikeClick': true
      },
      allowedMethods = {};

    Object.keys(defaultAllowedMethods).forEach(key => {
      allowedMethods[key] = customAllowedMethods[key] || defaultAllowedMethods[key];
    });

    if (allowedMethods['onLinkClick']) {
      if (typeof allowedMethods['onLinkClick'] === 'function') newPlate.onLinkClick = () => {
        allowedMethods['onLinkClick']();
      };
      else newPlate.onLinkClick = () => {
        self.router.navigate([ROUTES.PLATE + '/', newPlate._id]);
      };
    }

    allowedMethods['onProfileLinkClick'] &&
      (newPlate.onProfileLinkClick = () => self.router.navigate([ROUTES.PROFILE + '/', newPlate.author.id]));

    allowedMethods['onLikeClick'] && (newPlate.onLikeClick = () => {
        let currentUser = self.authorizationService.getCurrentUser();
        if (!currentUser) return;

        SharedService.getSharedComponent('globalOverlay').toggle(false);
        self.accessPointService.postRequest('/like_plate',
          {plate: newPlate._id},
          {
            onSuccess: res => {
              SharedService.getSharedComponent('globalOverlay').toggle(true);
              SharedService.getSharedComponent('growl').addItem({'message': 'Liked!'});
              newPlate.likes = res.likes === null ? newPlate.likes : res.numberOfLikes;
              newPlate.liked = true;
              self.refreshLikedPlates();
            },
            onFail: err => {
              SharedService.getSharedComponent('globalOverlay').toggle(true);
              SharedService.getSharedComponent('growl').addItem(err);
            }
          }
        );
      });

    return newPlate;
  }

  public refreshPlatesList (list) {
    let self = this;

    self.platesList.length = 0;

    (Array.isArray(list) ? list : [list]).forEach(item => {
      self.platesList.push(item instanceof PlateModel ? item : self.createPlateEntity(item));
    });

    self.refreshLikedPlates();
  }

  public refreshLikedPlates () {
    let
      self = this,
      user = self.authorizationService.getCurrentUser();

    if (!user) self.platesList.forEach(plate => plate.liked = false);
    else self.accessPointService.getRequest('/get_liked_plates', {}, {
      onSuccess: likedPlates => {
        self.platesList.forEach(plate => plate.liked = likedPlates[plate._id] || false);
      },
      onFail: err => SharedService.getSharedComponent('growl').addItem(err)
    });
  }
}



