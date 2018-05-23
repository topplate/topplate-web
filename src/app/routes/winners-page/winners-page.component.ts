import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { EnvironmentService } from '../../services/environment.service';
import { AccessPointService } from '../../services/access-point.service';
import { SharedService } from '../../services/shared.service';
import { PlatesService } from '../../services/plates.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-winners-page',
  templateUrl: './winners-page.component.html',
  styleUrls: ['./winners-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WinnersPageComponent implements OnInit, OnDestroy {

  constructor (
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private environmentService: EnvironmentService,
    private accessPointService: AccessPointService,
    private platesService: PlatesService
  ) {}

  public winners: Object[] = [];

  public winnersSettings: any;

  public environmentWatcher: any;

  private refreshItems (data) {
    let self = this;
    self.winners = (data || []).map(plate => {
      let _plate = self.platesService.createPlateEntity(plate);
      _plate['winner'] = 'week';
      return _plate;
    });
  }

  ngOnInit () {

    let self = this;

    self.winnersSettings = {
      resolution: [14, 3],
      showLabel: true,
      showGeo: true,
      showAuthor: true
    };

    self.environmentWatcher = self.environmentService.getSubscription(env => {
      self.winners.length = 0;
      self.accessPointService.getRequest('/get_winners', { environment: env }, {
        onSuccess: winnersData => self.refreshItems(winnersData),
        onFail: err => SharedService.getSharedComponent('growl').addItem(err)
      });
    });
  }

  ngOnDestroy () {
    this.environmentWatcher.unsubscribe();
  }
}
