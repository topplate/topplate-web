import { Component, OnInit, DoCheck, OnDestroy, AfterViewInit, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import {Route, ActivatedRoute, ActivationEnd, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { AuthorizationService } from '../../services/authorization.service';
import { SharedService } from '../../services/shared.service';
import { AccessPointService } from '../../services/access-point.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  TYPES = CONSTANTS.TYPES,
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS,
  ROOT_ELEM_CLASS = 'top-plate_header',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit, DoCheck, OnDestroy, AfterViewInit {

  constructor (
    private reference: ElementRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private accessPointService: AccessPointService

  ) { }

  @Input() events: any;

  public isAuthorized: boolean;

  public currentUser: Object;

  public logoPosition: any;

  public showMainNavigation: any;

  public showSecondaryNavigation: any;

  public mainHeaderLinks: any;

  public mainHeaderHiddenLinks: any;

  public mainHeaderMenuModel: any;

  public secondaryNavigationLinks: any;

  public goHome () {
    this.router.navigate([ROUTES.HOME]);
  }

  ngOnInit () {

    let
      self = this,
      activatedRoute = self.activatedRoute,
      rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true),
      logo = rootElem.select('.top-plate_headerLogo');

    this.authorizationService.getState()
      .subscribe(
        res => {
          self.currentUser = self.authorizationService.getCurrentUser();
          self.isAuthorized = !!res;
        },
        err => console.log(err)
      );

    self.router.events.forEach(e => {

      let isActivationEnded = e instanceof ActivationEnd;

      if (!isActivationEnded) return;

      let
        routeData = activatedRoute.root.firstChild.snapshot.data || {},
        env = SharedService.getEnvironment();

      self.logoPosition = (
        typeof routeData === TYPES.OBJECT &&
        routeData.hasOwnProperty('logo') &&
        routeData.logo
      ) || 'left';

      self.showMainNavigation = routeData.mainNavigation;
      self.showSecondaryNavigation = routeData.secondaryNavigation;
      self.mainHeaderLinks = [
        {
          label: env + ' plate',
          onClick: () => self.router.navigate([ROUTES.PLATES]),
          isSelected: false
        },
        {
          label: 'submit photo',
          onClick: () => self.events.onPlateUploaderLinkClick(),
          isSelected: false
        }
      ];
      self.mainHeaderHiddenLinks = [
        {
          label: 'Sponsored plate',
          onClick: () => console.log('Sponsored plate'),
          isSelected: false
        },
        {
          label: 'Contact us',
          onClick: () => console.log('contact us'),
          isSelected: false
        },
        {
          label: 'Privacy',
          onClick: () => console.log('privacy'),
          isSelected: false
        },
        {
          label: 'Terms of Service',
          onClick: () => console.log('terms of service'),
          isSelected: false
        }
      ];
      self.mainHeaderMenuModel = { isOpened: false };
      self.secondaryNavigationLinks = [
        {
          label: 'plate of the week',
          icon: 'plate-of-the-week',
          onClick: () => self.router.navigate([ROUTES.PLATES])
            .then(() => self.router.navigate([ROUTES.WINNERS + '/', 'week'])),
          isSelected: false
        },
        {
          label: 'plate of the month',
          icon: 'plate-of-the-month',
          onClick: () => self.router.navigate([ROUTES.PLATES])
            .then(() => self.router.navigate([ROUTES.WINNERS + '/', 'month'])),
          isSelected: false
        },
        {
          label: 'monthly prize',
          icon: 'monthly-prize',
          isSelected: false
        }
      ];
    });
  }

  ngDoCheck () {}

  ngOnDestroy () {}

  ngAfterViewInit () {
    // console.log(gapi);
    // gapi.load('auth2',  () => {
    //   // this.auth2 = gapi.auth2.init({
    //   //   client_id: '788548936361-h264uq1v36c5ddj0hf5fpmh7obks94vh.apps.googleusercontent.com',
    //   //   cookiepolicy: 'single_host_origin',
    //   //   scope: 'profile email'
    //   // });
    //   // this.attachSignin(document.getElementById('glogin'));
    // });



  }

}
