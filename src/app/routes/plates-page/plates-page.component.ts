import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { SharedService } from '../../services/shared.service';
import { AccessPointService } from '../../services/access-point.service';
import { AuthorizationService } from '../../services/authorization.service';
import { EnvironmentService } from '../../services/environment.service';
import { PlatesService } from '../../services/plates.service';
import { PlateModel } from '../../models/plate.model';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-plates-page',
  templateUrl: './plates-page.component.html',
  styleUrls: ['./plates-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlatesPageComponent implements OnInit, OnDestroy {

  constructor (
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService,
    private environmentService: EnvironmentService,
    private platesService: PlatesService
  ) {}

  private changesObserver: any;

  private environmentWatcher: any;

  public plates: PlateModel[] = [];

  public settings: any = {
    showLabel: true,
    showGeo: true,
    showAuthor: true,
    showRecipeBanner: true
  };

  public infiniteScrollEvents: any = {
    onReady: (componentAPI) => {
      this.infiniteScrollAPI = componentAPI;
      this.environmentWatcher = this.environmentService.getSubscription(env => {
        this.infiniteScrollAPI.clearList();
        this.loadPlates();
      });
    },
    onEndOfListReached: () => {
      console.log('onEndOfListReached triggered');
      this.loadPlates();
    }
  };

  public infiniteScrollAPI: any;

  private refreshItems (items) {
    let self = this;
    return items.map(item => item.isAdvertisementBanner ? item : self.platesService.createPlateEntity(item));
  }

  private loadPlates () {
    let
      self = this,
      infiniteScrollAPI = self.infiniteScrollAPI,
      selectedEnvironment = self.environmentService.getCurrent(),
      isFinalized =  infiniteScrollAPI.getFinalized(),
      lim = infiniteScrollAPI.getRequiredNumberOfItems(),
      skip = infiniteScrollAPI.getCurrentIndex(),
      lastOne = infiniteScrollAPI.getLastOne(),
      params = {
        environment: self.environmentService.getCurrent(),
        lim: infiniteScrollAPI.getRequiredNumberOfItems()
      };

    if (lastOne) params['lastId'] = lastOne._id;

    self.accessPointService.getRequest(
      '/get_plates',
      params,
      {
        onSuccess: res => {
          let
            totalItems = self.refreshItems(res),
            newPlates = totalItems.filter(item => !item.isAdvertisementBanner);

          infiniteScrollAPI.setFinalized(newPlates.length < lim);
          infiniteScrollAPI.addItems(totalItems)
            .then(() => self.platesService.refreshPlatesList(newPlates));
        },
        onFail: err => SharedService.getSharedComponent('growl').addItem(err)
      }
    );
  }

  ngOnInit () {}

  ngOnDestroy () {
    this.environmentWatcher.unsubscribe();
  }
}
