import { Component, OnInit } from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {FacebookLoginProvider, GoogleLoginProvider} from 'angular5-social-login';
import {AuthorizationService} from '../../services/authorization.service';
import {SharedService} from '../../services/shared.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AccessPointService} from '../../services/access-point.service';

@Component({
  selector: 'app-tp-sign-in-modal',
  templateUrl: './tp-sign-in-modal.component.html',
  styleUrls: ['./tp-sign-in-modal.component.scss']
})
export class TpSignInModalComponent implements OnInit {

  public state: BehaviorSubject<Boolean> = new BehaviorSubject(false);

  public wantToSubscribe: Boolean = false;

  public showLocalLoginForm: Boolean = false;

  public loginLocalForm: FormGroup = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });

  public logInMethods: any[] = [
    {
      name: GoogleLoginProvider.PROVIDER_ID,
      icon: 'google-plus',
      className: 'signIn-google',
      label: 'CONNECT WITH GOOGLE',
      onClick: () => {
        this.authorizationService.signIn(GoogleLoginProvider.PROVIDER_ID)
          .then(res => this.toggleState(false))
          .catch(err => SharedService.getSharedComponent('growl').addItem(err));
      }
    },
    {
      name: FacebookLoginProvider.PROVIDER_ID,
      icon: 'facebook',
      className: 'signIn-facebook',
      label: 'CONNECT WITH FACEBOOK',
      onClick: () => {
        this.authorizationService.signIn(FacebookLoginProvider.PROVIDER_ID)
          .then(res => this.toggleState(false))
          .catch(err => SharedService.getSharedComponent('growl').addItem(err));
      }
    },
    {
      name: 'email',
      icon: 'envelope-o',
      className: 'signIn-email',
      label: 'CONNECT WITH EMAIL',
      onClick: () => {
        this.showLocalLoginForm = !this.showLocalLoginForm;
      }
    }
  ];

  public toggleState (state) {
    this.showLocalLoginForm = false;
    this.state.next(state);
  }

  public onLoginLocalFormSubmit () {
    if (!this.loginLocalForm.valid) return;

    SharedService.getSharedComponent('globalOverlay').toggle(false);

    this.accessPointService.postRequest(
      '/login_local',
      {
        email: this.loginLocalForm.value.email,
        password: this.loginLocalForm.value.password
      },
      {
        onSuccess: res => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          console.log(res.token);
        },
        onFail: err => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      }
    );
  }

  constructor (
    private authorizationService: AuthorizationService,
    private accessPointService: AccessPointService
  ) {}

  ngOnInit () {
    SharedService.setSharedComponent('signInModal', {
      toggle: state => this.toggleState(state)
    });
  }

}
