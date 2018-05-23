import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { SharedService } from '../../services/shared.service';
import { AuthorizationService } from '../../services/authorization.service';
import { AccessPointService } from '../../services/access-point.service';
import { PlatesService } from '../../services/plates.service';
import { PlateModel } from '../../models/plate.model';

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

  constructor (
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private accessPointService: AccessPointService,
    private platesService: PlatesService
  ) {}

  public changesObserver: any;

  public selectedPlate: PlateModel;

  public relatedPlates: PlateModel[];

  public relatedPlatesSettings: any;

  ngOnInit () {

    let
      self = this,
      routeData = self.activatedRoute.snapshot.data;

    self.selectedPlate = self.platesService.createPlateEntity(routeData['plate']);
    self.relatedPlates = self.selectedPlate.relatedPlates.map(plate => self.platesService.createPlateEntity(plate));

    self.relatedPlatesSettings = {
      resolution: [430, 360],
      showLabel: true,
      showGeo: true,
      showAuthor: true,
      showRecipeBanner: true
    };

    self.platesService.refreshPlatesList([self.selectedPlate].concat(self.relatedPlates));
  }

  ngOnDestroy () {

  }

}
