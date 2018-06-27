import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { SharedService } from '../../services/shared.service';
import { AccessPointService } from '../../services/access-point.service';
import { AuthorizationService } from '../../services/authorization.service';
import { EnvironmentService } from '../../services/environment.service';
import {PlatesService} from '../../services/plates.service';
import {PlateModel} from '../../models/plate.model';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfilePageComponent implements OnInit {

  public plates: PlateModel[] = [];

  public profile: Object;

  public settings: any;

  public infiniteScrollEvents: any;

  public infiniteScrollAPI: any;

  private refreshPlates (plates) {
    return (plates || []).map(plate => this.platesService.createPlateEntity(plate));
  }

  private loadPlates () {
    let
      self = this,
      infiniteScrollAPI = self.infiniteScrollAPI,
      isFinalized =  infiniteScrollAPI.getFinalized(),
      lim = infiniteScrollAPI.getRequiredNumberOfItems(),
      skip = infiniteScrollAPI.getCurrentIndex();
    // skip = isFinalized ? infiniteScrollAPI.getCurrentIndex() : 0; /** For test only */

    self.accessPointService.getRequest(
      '/get_plates_by_author',
      {
        id: self.profile['_id'],
        skip: skip,
        lim: lim
      },
      {
        onSuccess: res => {
          let newPlates = self.refreshPlates(res);
          infiniteScrollAPI.setFinalized(newPlates.length < lim);
          infiniteScrollAPI.addItems(newPlates)
            .then(platesInList => self.platesService.refreshPlatesList(platesInList));
        },
        onFail: err => console.log(err)
      }
    );
  }

  public get actionsAvailable () {
    let currentUser = this.authorizationService.getCurrentUser();
    return currentUser && currentUser._id === this.profile['_id'];
  }

  public get showChangePasswordButton () {
    return this.actionsAvailable && this.authorizationService.getCurrentUser()['provider'];
  }

  public editProfile () {
    this.router.navigate([ROUTES.EDIT_PROFILE]);
  }

  public changePassword () {
    this.router.navigate([ROUTES.CHANGE_PASSWORD]);
  }

  constructor (
    private activatedRoute: ActivatedRoute,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService,
    private platesService: PlatesService,
    private router: Router
  ) {}

  ngOnInit () {

    let
      self = this,
      routeData = self.activatedRoute.snapshot.data;

    self.profile = routeData.profile;

    self.settings = {
      showLabel: true,
      showGeo: true,
      showAuthor: true,
      showRecipeBanner: true
    };

    self.infiniteScrollEvents = {
      onReady: (componentAPI) => {
        self.infiniteScrollAPI = componentAPI;
        self.loadPlates();
      },
      onEndOfListReached: () => {
        console.log('onEndOfListReached triggered');
        self.loadPlates();
      }
    };
  }
}
