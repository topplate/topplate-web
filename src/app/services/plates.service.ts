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

  public createPlateEntity (initialData, allowedMethods = {
    'onLinkClick': true,
    'onProfileLinkClick': true,
    'onLikeClick': true
  }) {

    let
      self = this,
      newPlate = new PlateModel(initialData);

    allowedMethods && allowedMethods.onLinkClick &&
      (newPlate.onLinkClick = () => self.router.navigate([ROUTES.EMPTY])
          .then(() => self.router.navigate([ROUTES.PLATE + '/', newPlate._id])));

    allowedMethods && allowedMethods.onProfileLinkClick &&
      (newPlate.onProfileLinkClick = () => self.router.navigate([ROUTES.PROFILE + '/', newPlate.author.id]));

    allowedMethods && allowedMethods.onLikeClick &&
      (newPlate.onLikeClick = () => {
        let currentUser = self.authorizationService.getCurrentUser();
        if (!currentUser) return;
        self.accessPointService.postRequest('/like_plate',
          {plate: newPlate._id},
          {
            onSuccess: res => {
              newPlate.likes = res.numberOfLikes === null ? newPlate.likes : res.numberOfLikes;
              SharedService.setLikedPlates(res.likedPlates);
            },
            onFail: err => console.log(err)
          }
        );
      });

    return newPlate;
  }
}



