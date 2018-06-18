import { Component, OnInit } from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {FacebookLoginProvider, GoogleLoginProvider} from 'angular5-social-login';
import {AuthorizationService} from '../../services/authorization.service';
import {SharedService} from '../../services/shared.service';

@Component({
  selector: 'app-tp-sign-in-modal',
  templateUrl: './tp-sign-in-modal.component.html',
  styleUrls: ['./tp-sign-in-modal.component.scss']
})
export class TpSignInModalComponent implements OnInit {

  public state: BehaviorSubject<Boolean> = new BehaviorSubject(false);

  public wantToSubscribe: Boolean = false;

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
      label: 'CONNECT WITH EMAIL'
    }
  ];

  public toggleState (state) {
    this.state.next(state);
  }

  constructor (
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit () {
    SharedService.setSharedComponent('signInModal', {
      toggle: state => this.toggleState(state)
    });
  }

}
