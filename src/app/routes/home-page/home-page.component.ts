import { Component, OnInit, OnDestroy } from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { ConstantsService } from '../../services/constants.service';
import { EnvironmentService } from '../../services/environment.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES;

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})

export class HomePageComponent implements OnInit, OnDestroy {

  constructor (
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private environmentService: EnvironmentService
  ) { }

  private routeData: any;

  public restaurantEnvBackground: any;

  public homemadeEnvBackground: any;

  public setEnvironment (env) {
    let self = this;
    self.environmentService.setCurrent(env);
    self.router.navigate([ROUTES.PLATES]);
  }

  ngOnInit() {
    let
      self = this,
      environments = self.activatedRoute.snapshot.data['environments'];

    self.environmentService.clearCurrent();
    self.restaurantEnvBackground = environments.restaurant.image;
    self.homemadeEnvBackground = environments.homemade.image;
  }

  ngOnDestroy () {}

}
