import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { SharedService } from '../../services/shared.service';
import { AuthorizationService } from '../../services/authorization.service';
import { AccessPointService } from '../../services/access-point.service';
import { PlatesService } from '../../services/plates.service';
import { PlateModel } from '../../models/plate.model';
import { Location } from '@angular/common';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-plate-page',
  templateUrl: './plate-page.component.html',
  styleUrls: ['./plate-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlatePageComponent implements OnInit, OnDestroy {

  private relocationTimer: any;

  private isReloading: Boolean = false;

  public selectedPlate: PlateModel;

  public relatedPlates: PlateModel[];

  public relatedPlatesSettings: any;

  private setRelocationTimer () {
    this.clearRelocationTimer();
    this.relocationTimer = setInterval(() => {
      if (this.isReloading) return;
      let currentId = this.location.path().replace(/^\/plate\//, '');
      if (currentId !== this.selectedPlate._id) this.reloadPlates(currentId);
    }, 100);
  }

  private clearRelocationTimer () {
    if (this.relocationTimer) clearInterval(this.relocationTimer);
    this.relocationTimer = null;
  }

  private reloadPlates (plateId) {
    let self = this;

    this.isReloading = true;
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    self.accessPointService.getRequest('/get_plate', {id: plateId}, {
      onSuccess: plateData => {
        this.isReloading = false;
        self.refreshPlates(plateData);
        SharedService.getSharedComponent('globalOverlay').toggle(true);
        SharedService.getSharedComponent('scroll').scrollTop();
      },
      onFail: err => {
        this.isReloading = false;
        SharedService.getSharedComponent('globalOverlay').toggle(true);
        SharedService.getSharedComponent('growl').addItem(err);
      }
    });
  }

  private refreshPlates (plateData) {
    let self = this;
    self.selectedPlate = self.platesService.createPlateEntity(plateData);
    self.relatedPlates = self.selectedPlate.relatedPlates.map(plate => self.platesService.createPlateEntity(
      plate, {'onLinkClick': () => {
        self.reloadPlates(plate._id);
        history.pushState('/plate/' + plate._id, '');
        self.location.replaceState('/plate/' + plate._id);
      }
    }));
    self.platesService.refreshPlatesList([self.selectedPlate].concat(self.relatedPlates));
  }

  constructor (
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private accessPointService: AccessPointService,
    private platesService: PlatesService,
    private location: Location
  ) {}

  ngOnInit () {

    let
      self = this,
      routeData = self.activatedRoute.snapshot.data;

    self.relatedPlatesSettings = {
      resolution: [430, 360],
      showLabel: true,
      showGeo: true,
      showAuthor: true,
      showRecipeBanner: true
    };

    self.refreshPlates(routeData['plate']);
    self.setRelocationTimer();
  }

  ngOnDestroy () {
    this.clearRelocationTimer();
  }

}
