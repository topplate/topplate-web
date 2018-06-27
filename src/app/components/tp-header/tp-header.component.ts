import { Component, OnInit, DoCheck, OnDestroy, AfterViewInit, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import {Route, ActivatedRoute, ActivationEnd, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { AuthorizationService } from '../../services/authorization.service';
import { SharedService } from '../../services/shared.service';
import { AccessPointService } from '../../services/access-point.service';
import { EnvironmentService } from '../../services/environment.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  ADMIN_ROUTES = CONSTANTS.ADMIN_ROUTES,
  TYPES = CONSTANTS.TYPES,
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS,
  ROOT_ELEM_CLASS = 'tp-header',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-tp-header',
  templateUrl: './tp-header.component.html',
  styleUrls: ['./tp-header.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TpHeaderComponent implements OnInit, OnDestroy {

  constructor (
    private reference: ElementRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private accessPointService: AccessPointService,
    private environmentService: EnvironmentService
  ) {}

  @Input() public items: Object[];

  @Input() public events: Object;

  public isAdminRoute: Boolean = false;

  public links: Object[] = [];

  public menuItems: Object[] = [
    {
      label: 'contact us',
      link: [ROUTES.CONTACTS]
    },
    {
      label: 'privacy term',
      link: [ROUTES.PRIVACY_TERM]
    },
    {
      label: 'copyright',
      link: [ROUTES.COPYRIGHT]
    },
    {
      label: 'admin',
      link: [CONSTANTS.ADMIN_ROUTES.ADMIN_ENTRANCE]
    },
    {
      label: 'log out',
      authorizedUsersOnly: true,
      action: 'onSignOutButtonClick'
    }
  ];

  public adminLinks: any[] = [
    // {
    //   label: 'general',
    //   url: [ADMIN_ROUTES.MANAGE_GENERAL]
    // },
    {
      label: 'users',
      url: [ADMIN_ROUTES.MANAGE_USERS]
    },
    {
      label: 'plates',
      url: [ADMIN_ROUTES.MANAGE_PLATES]
    },
    {
      label: 'requests',
      url: [ADMIN_ROUTES.MANAGE_REQUESTS]
    },
    {
      label: 'charities',
      url: [ADMIN_ROUTES.MANAGE_CHARITIES],
    },
    {
      label: 'sign out',
      action: () => {
        this.authorizationService.clearAdminUser();
        this.router.navigate([ROUTES.PLATES]);
      }
    },
    // {
    //   label: 'contacts',
    //   url: [ADMIN_ROUTES.MANAGE_CONTACTS]
    // }
  ];

  public showSwitch: Boolean = false;

  public switchObserver: any;

  public switchItems: Object[] = this.environmentService.getAvailableEnvironments().map(str => {
    return {
      label: str + ' plates',
      name: str
    };
  });

  public switchEvents: Object = {
    onClick: () => {
      let
        self = this,
        selectedOne = null;

      self.switchItems.forEach(item => {
        item['isSelected'] = !item['isSelected'];
        item['isSelected'] && (selectedOne = item['name']);
      });

      self.environmentService.setCurrent(selectedOne);
    }
  };

  public currentUser: any;

  public currentStateData: any;

  public isAuthorized: Boolean = false;

  private elements: Object;

  public get loggedAsAdmin () {
    return !!this.authorizationService.getAdminUser();
  }

  private refreshDOM () {

    let
      self = this,
      rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);

    self.elements = {
      root: rootElem,
      content: rootElem.select('.tp-header_content'),
      leftBlock: rootElem.select('.tp-header_leftBlock'),
      rightBlock: rootElem.select('.tp-header_rightBlock')
    };
  }

  private refreshView () {

    let
      self = this,
      links = self.links = [];

    self.items.forEach(item => {
      item['_label'] = getSplittedString(item['label'], 2);
      links.push(item);
    });

    function getSplittedString (value, numberOfRows) {
      let
        words = value.split(' '),
        rows = [],
        n = numberOfRows || 2;

      d3.range(n).forEach(i => {
        let isLastRow = (i + 1) === n;
        if (isLastRow) rows.push(words.join(' '));
        else rows.push(words.splice(0, 1)[0] || '');
      });

      return rows;
    }
  }

  private refreshWatchers () {
    let
      self = this,
      linksToObserve = self.items.filter(item => item.hasOwnProperty('showWhen'));

    this.authorizationService.getCurrentUserSubscription(currentUser => {
      this.currentUser = currentUser;
      this.isAuthorized = !!currentUser;
    });

    self.switchObserver = self.environmentService.getSubscription(env => {
      self.switchItems.forEach(item => item['isSelected'] = item['name'] === env);
    });

    self.router.events.subscribe( (event) => {
      if (event instanceof NavigationEnd) {
        self.currentStateData = self.activatedRoute.root.firstChild.snapshot.data;
        self.isAdminRoute = self.currentStateData['isAdminRoute'];
        SharedService.isAdminRoute = self.isAdminRoute;
        linksToObserve.forEach(link => link['isHidden'] = !self.currentStateData['showHomeButton']);
        self.showSwitch = self.currentStateData['showEnvironmentSwitch'] === true;
      }
    });
  }

  public goHome () {
    this.router.navigate([ROUTES.PLATES]);
  }

  public onLinkClick (link) {
    let self = this;
    if (link['navigateTo']) self.router.navigate([ROUTES.EMPTY])
      .then(() => self.router.navigate(link['navigateTo']));
    else if (link['onClick']) link['onClick']();
  }

  public onAdminLinkClick (link) {
    if (link.url) this.router.navigate(link.url);
    else if (link.action && typeof link.action === 'function') link.action();
  }

  public onMenuItemClick (clickedItem) {
    let
      self = this,
      events = self.events || {};

    if (clickedItem.link) self.router.navigate(clickedItem.link);
    else if (clickedItem.action) typeof this[clickedItem.action] === 'function' && this[clickedItem.action]();
  }

  public onSignInButtonClick () {
    let self = this;
    SharedService.getSharedComponent('signInModal').toggle(true);
  }

  public onSignOutButtonClick () {
    this.authorizationService.signOut().catch(err =>
      SharedService.getSharedComponent('growl').addItem(err)
    );
  }

  public onProfileButtonClick () {
    let
      self = this,
      router = self.router,
      currentUser = self.authorizationService.getCurrentUser();

    router.navigate([ROUTES.EMPTY])
      .then(() => router.navigate([ROUTES.PROFILE + '/', currentUser['_id']]));
  }

  ngOnInit () {
    let
      self = this;

    self.refreshDOM();
    self.refreshView();
    self.refreshWatchers();
  }

  ngOnDestroy () {}

}
