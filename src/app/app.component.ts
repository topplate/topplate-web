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

  public headerLinks: any;

  public headerEvents: any;

  public isReadyToBeShown: Boolean = false;

  public environments: any;

  public logInMethods: any;

  public signInModal: any;

  public plateUploadModal: any;

  public appGrowl: Object = {
    events: {
      onReady: growlApi => {
        this.appGrowl['api'] = growlApi;
        SharedService.setSharedComponent('growl', this.appGrowl['api']);
      },
      onShow: growlItem => console.log(growlItem),
      onHide: () => console.log('item closed')
    },
    api: null
  };

  public banner: Object;

  private refreshUploadModalState () {
    let
      self = this,
      plateUploadModal = self.plateUploadModal,
      plateUploadForm = plateUploadModal.plateUploadForm,
      isUploaded = plateUploadModal.uploadedImage['isUploaded'];

    plateUploadModal.isReadyToSubmit = plateUploadForm.valid && isUploaded;

  }

  private getUploadPlateForm () {
    let
      self = this,
      selectedEnvironment = self.environmentService.getCurrent(),
      form = new FormGroup({
        name: new FormControl('', Validators.required),
        address: new FormControl('', Validators.required),
        image: new FormControl('', Validators.required)
      });

    if (selectedEnvironment === CONSTANTS.ENVIRONMENTS.HOMEMADE) {
      form.addControl('recipe', new FormControl());
    } else {
      form.addControl('restaurantName', new FormControl());
    }

    return form;
  }

  public selectEnvironment (clickedEnv) {
    let self = this;
    SharedService.setEnvironment(clickedEnv.name);
    self.signInModal.selectedEnvironment = SharedService.getEnvironment();
    self.environments.forEach(env => env.isSelected = clickedEnv.name === env.name);
  }

  public onPlateSubmit () {
    let
      self = this,
      plateUploadForm = self.plateUploadModal.plateUploadForm,
      plateUploadedImage = self.plateUploadModal.uploadedImage,
      currentUser = self.authorizationService.getCurrentUser();

    if (!currentUser || !plateUploadForm.valid || !plateUploadedImage['isUploaded']) return;
    let fReader = new FileReader();

    fReader.onloadend = function (onReadyEvent) {
      let formValue = plateUploadForm.value;

      self.accessPointService.postRequest('/add_plate', {
        name: formValue.name,
        environment: self.environmentService.getCurrent(),
        email: formValue.email,
        image: onReadyEvent.target['result'],
        extension: plateUploadedImage['fileExtension'],
        contentType: plateUploadedImage['contentType'],
        address: formValue.address || '',
        recipe: formValue.recipe || '',
        restaurantName: formValue.restaurantName || '',
        author: currentUser['_id']
      }, {
        onSuccess: (res) => {
          console.log(res);
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('plateUploadModal').toggle(false);
          SharedService.getSharedComponent('growl').addItem(res);
        },
        onFail: err => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('plateUploadModal').toggle(false);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      });
    };

    SharedService.getSharedComponent('globalOverlay').toggle(false);

    fReader.readAsBinaryString(plateUploadedImage['originalImage']);
  }

  public get isAdminRoute () {
    let self = this;
    return SharedService.isAdminRoute;
  }

  ngOnInit () {
    let
      self = this,
      plateUploadForm;

    self.rootElem = d3.select(self.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);
    self.signInModal = {
      state: new BehaviorSubject(false),
      wantToSubscribe: false
    };
    self.plateUploadModal = {
      state: new BehaviorSubject(false),
      isReadyToSubmit: false,
      // plateUploadForm: self.getUploadPlateForm(),

      plateUploadForm: new FormGroup({
        name: new FormControl('', Validators.required),
        email: new FormControl('', [
          Validators.required,
          Validators.pattern(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i)
        ]),
        address: new FormControl('', Validators.required),
        image: new FormControl(),
        recipe: new FormControl(),
        restaurantName: new FormControl()
      }),
      showEmailField: true,
      showRestaurantNameField: true,
      uploadedImage: {
        onChange: () => self.refreshUploadModalState()
      }
    };

    self.headerLinks = [
      {
        label: 'home page',
        icon: 'home',
        navigateTo: [ROUTES.PLATES],
        showWhen: 'showHomeButton'
      },
      {
        label: 'how it works',
        icon: 'how-it-works',
        navigateTo: [CONSTANTS.ADMIN_ROUTES.ADMIN_ENTRANCE]
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
        onClick: () => {
          let
            plateUploadModal = self.plateUploadModal,
            currentUser = self.authorizationService.getCurrentUser(),
            currentEnv = SharedService.getEnvironment();

          if (!currentUser) return self.headerEvents.onSignInButtonClick();

          plateUploadModal.plateUploadForm.reset();
          typeof plateUploadModal.uploadedImage.reset === 'function' && plateUploadModal.uploadedImage.reset();
          plateUploadModal.showRestaurantNameField = currentEnv === ENVIRONMENTS.RESTAURANT;

          if (currentUser && currentUser['email']) {
            plateUploadModal.showEmailField = false;
            plateUploadModal.plateUploadForm.controls['email'].setValue(currentUser['email']);
          } else {
            plateUploadModal.showEmailField = true;
          }

          self.plateUploadModal.state.next(true);
        }
      },
      {
        label: 'search plate',
        icon: 'search-plate',
        navigateTo: [ROUTES.SEARCH]
      }
    ];

    self.headerEvents = {
      onSignInButtonClick: () => {
        self.signInModal.state.next(true);
      },
      onSignOutButtonClick: () => {
        self.authorizationService.signOut().catch(err => console.log(err));
      }
    };

    self.environments = [ENVIRONMENTS.RESTAURANT, ENVIRONMENTS.HOMEMADE].map((env, i) => {
      return {
        name: env,
        label: env.toUpperCase(),
        isSelected: env === SharedService.getEnvironment()
      };
    });

    self.logInMethods = [
      {
        name: GoogleLoginProvider.PROVIDER_ID,
        icon: 'google-plus',
        className: 'signIn-google',
        label: 'CONNECT WITH GOOGLE',
        onClick: () => {
          self.authorizationService.signIn(GoogleLoginProvider.PROVIDER_ID)
            .then(res => self.signInModal.state.next(false) )
            .catch(err => console.log(err));
        }
      },
      {
        name: FacebookLoginProvider.PROVIDER_ID,
        icon: 'facebook',
        className: 'signIn-facebook',
        label: 'CONNECT WITH FACEBOOK',
        onClick: () => {
          // console.log(self.socialAuthService.authState);
          self.authorizationService.signIn(FacebookLoginProvider.PROVIDER_ID)
            .then(res => self.signInModal.state.next(false))
            .catch(err => console.log(err));
        }
      },
      {
        name: 'email',
        icon: 'envelope-o',
        className: 'signIn-email',
        label: 'CONNECT WITH EMAIL'
      }
    ];

    self.accessPointService.getRequest('/get_banner', {
      asHtml: 'true'
    }, {
      onSuccess: banner => self.banner = banner,
      onFail: err => console.log(err)
    });

    self.socialAuthService.authState.subscribe(
      userData => {
        if (userData) {
          SharedService.setToken(userData.token);
          self.authorizationService.setCurrentUser(userData);
          self.accessPointService.postRequest('login_' + userData.provider, userData, {
            onSuccess: res => {
              self.authorizationService.getCurrentUser()['_id'] = res._id;
              self.platesService.refreshLikedPlates();
            },
            onFail: err => SharedService.getSharedComponent('growl').addItem(err)
          });
        } else {
          SharedService.clearToken();
          self.authorizationService.setCurrentUser(null);
          self.accessPointService.postRequest('logout', null, {
            onSuccess: res => self.platesService.refreshLikedPlates(),
            onFail: err => SharedService.getSharedComponent('growl').addItem(err)
          });
        }
      },
      err => SharedService.getSharedComponent('growl').addItem(err)
    );

    plateUploadForm = self.plateUploadModal.plateUploadForm;

    plateUploadForm.valueChanges
      .subscribe(
        value => self.refreshUploadModalState(),
        err => SharedService.getSharedComponent('growl').addItem(err)
      );

    SharedService.setSharedComponent('signInModal', {
      toggle: state => self.signInModal.state.next(state)
    });

    SharedService.setSharedComponent('plateUploadModal', {
      toggle: state => self.plateUploadModal.state.next(state)
    });

    SharedService.setSharedComponent('globalOverlay', {
      toggle: state => self.isReadyToBeShown = state
    });

    setTimeout(() => SharedService.getSharedComponent('globalOverlay').toggle(true), 2000);
  }

  ngOnDestroy () {}

  ngAfterViewInit () {}
}
