import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';

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
    private activatedRoute: ActivatedRoute
  ) {}

  public winners: any;

  public winnersSettings: any;

  ngOnInit () {

    let
      self = this,
      routeData = self.activatedRoute.snapshot.data,
      period = self.activatedRoute.snapshot.params.period;

    self.winnersSettings = {
      resolution: [14, 3],
      showLabel: true,
      showGeo: true,
      showAuthor: true
    };

    self.winners = (routeData.winners || []).map(plate => {
      plate['winner'] = period;
      return plate;
    });
  }

  ngOnDestroy () {}

}
