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
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  KEYS = CONSTANTS.KEYS,
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SearchPageComponent implements OnInit {

  constructor (
    private accessPointService: AccessPointService,
    private environmentService: EnvironmentService,
    private platesService: PlatesService
  ) {}

  public items: PlateModel[] = [];

  public itemSettings: Object = {
    width: 300,
    height: 250,
    showLabel: true,
    showGeo: true,
    showAuthor: true,
    showRecipeBanner: true
  };

  public searchTerm: Subject<string> = new Subject<string>();

  public environmentChangeWatcher: any;

  public onKeyPressed (event) {
    let
      self = this,
      key = event.which;

    self.searchTerm.next(event.target['value']);
  }

  private doSearch (term, env) {
    let self = this;

    self.accessPointService.getRequest(
      'search_plates',
      {
        term: term,
        env: env
      },
      {
        onSuccess: (res) => {
          self.items = res.map(item => self.platesService.createPlateEntity(item));
          console.log(self.items);
        },
        onFail: (err) => console.log(err)
      });
  }

  ngOnInit () {

    let
      self = this,
      currentVal = '',
      currentEnv = self.environmentService.getCurrent();

    self.searchTerm
      .debounceTime(400)
      .distinctUntilChanged()
      .subscribe(val => {
        currentVal = val;
        self.doSearch(val, currentEnv);
      });

    self.environmentChangeWatcher = self.environmentService.getSubscription(env => {
      if (env !== currentEnv) {
        currentEnv = env;
        self.doSearch(currentVal, currentEnv);
      }
    });
  }
}
