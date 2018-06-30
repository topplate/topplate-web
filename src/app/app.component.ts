import {Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, ElementRef} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, EmailValidator } from '@angular/forms';
import { AppD3Service } from './services/d3.service';
import { ConstantsService } from './services/constants.service';
import { AuthorizationService } from './services/authorization.service';
import { AccessPointService } from './services/access-point.service';
import { EnvironmentService } from './services/environment.service';
import { PlatesService } from './services/plates.service';
import { SharedService } from './services/shared.service';
import { AuthService, FacebookLoginProvider, GoogleLoginProvider } from 'angular5-social-login';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS,
  ROOT_ELEM_CLASS = 'top-plate_main',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {

  constructor (
    private environmentService: EnvironmentService,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService,
    private socialAuthService: AuthService,
    private platesService: PlatesService,
    private reference: ElementRef
  ) {}

  private rootElem: any;

  public headerLinks: any[] = [
    {
      label: 'home page',
      icon: 'home',
      navigateTo: [ROUTES.PLATES],
      showWhen: 'showHomeButton'
    },
    {
      label: 'how it works',
      icon: 'how-it-works',
      navigateTo: [ROUTES.HOW_IT_WORKS]
    },
    {
      label: 'plate of the week',
      icon: 'plate-of-week',
      navigateTo: [ROUTES.WINNERS]
    },
    {
      label: 'charity choice',
      icon: 'charity-choice',
      navigateTo: [ROUTES.CHARITY_CHOICE]
    },
    {
      label: 'upload photo',
      icon: 'upload-photo',
      onClick: () => SharedService.getSharedComponent(
        this.authorizationService.getCurrentUser() ? 'plateUploadModal' : 'signInModal'
      ).toggle(true)
    },
    {
      label: 'search plate',
      icon: 'search-plate',
      navigateTo: [ROUTES.SEARCH]
    }
  ];

  public isReadyToBeShown: Boolean = false;

  public environments: any;

  public plateUploadModal: any;

  public appGrowl: any = {
    events: {
      onReady: growlApi => {
        this.appGrowl['api'] = growlApi;
        SharedService.setSharedComponent('growl', this.appGrowl['api']);
      }
    },
    api: null
  };

  public banner: any;

  public get isAdminRoute () {
    let self = this;
    return SharedService.isAdminRoute;
  }

  ngOnInit () {
    let self = this;

    self.rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);

    self.accessPointService.getRequest('/get_banner', {
      asHtml: 'true'
    }, {
      onSuccess: banner => self.banner = banner,
      onFail: err => SharedService.getSharedComponent('growl').addItem(err)
    });

    self.authorizationService.getCurrentUserSubscription(() => self.platesService.refreshLikedPlates());

    SharedService.setSharedComponent('globalOverlay', {
      toggle: state => self.isReadyToBeShown = state
    });

    setTimeout(() => SharedService.getSharedComponent('globalOverlay').toggle(true), 3000);
  }

  ngOnDestroy () {}

  ngAfterViewInit () {}
}
