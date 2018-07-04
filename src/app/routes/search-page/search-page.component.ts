import { Component, OnInit, OnDestroy, ElementRef, ViewEncapsulation} from '@angular/core';
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
export class SearchPageComponent implements OnInit, OnDestroy {

  constructor (
    private accessPointService: AccessPointService,
    private environmentService: EnvironmentService,
    private platesService: PlatesService,
    private ref: ElementRef
  ) {}

  public items: PlateModel[] = [];

  public itemSettings: Object = {
    showLabel: true,
    showGeo: true,
    showAuthor: true,
    showRecipeBanner: true
  };

  public infiniteScrollEvents: any = {
    onReady: (componentAPI) => {
      let
        currentVal = '',
        currentEnv = this.environmentService.getCurrent();

      this.infiniteScrollAPI = componentAPI;

      this.infiniteScrollAPI.setFinalized(true);

      this.searchTerm
        .debounceTime(400)
        .distinctUntilChanged()
        .subscribe(val => {
          currentVal = val;
          this.doSearch(val, currentEnv);
        });

      this.environmentChangeWatcher = this.environmentService.getSubscription(env => {
        if (env !== currentEnv) {
          currentEnv = env;
          this.doSearch(currentVal, currentEnv);
        }
      });

      this.doSearch(currentVal, currentEnv);
    }
  };

  public infiniteScrollAPI: any;

  private rootElement: any;

  public searchTerm: Subject<string> = new Subject<string>();

  public environmentChangeWatcher: any;

  public onKeyPressed (event) {
    let
      self = this,
      key = event.which;

    self.searchTerm.next(event.target['value']);
  }

  public focus () {
    this.rootElement.select('.search-plate_input-target').node().focus();
  }

  private doSearch (term, env) {
    let self = this;

    this.infiniteScrollAPI && this.infiniteScrollAPI.clearList();

    self.accessPointService.getRequest(
      'search_plates',
      {
        searchString: term,
        environment: env
      },
      {
        onSuccess: (res) => {
          this.items = res.map(item => this.platesService.createPlateEntity(item));
          this.platesService.refreshPlatesList(this.items);
          this.infiniteScrollAPI.addItems(this.items).then(() => self.platesService.refreshPlatesList(this.items));
        },
        onFail: (err) => SharedService.getSharedComponent('growl').addItem(err)
      });
  }

  ngOnInit () {
    this.rootElement = d3.select(this.ref.nativeElement);
    this.focus();
  }

  ngOnDestroy () {
    this.searchTerm.unsubscribe();
    this.environmentChangeWatcher.unsubscribe();
  }
}
