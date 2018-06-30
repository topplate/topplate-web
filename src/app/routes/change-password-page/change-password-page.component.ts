import { Component, OnInit } from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {AccessPointService} from '../../services/access-point.service';
import {SharedService} from '../../services/shared.service';
import {Router} from '@angular/router';
import {AuthorizationService} from '../../services/authorization.service';
import {ConstantsService} from '../../services/constants.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES;

@Component({
  selector: 'app-change-password-page',
  templateUrl: './change-password-page.component.html',
  styleUrls: ['./change-password-page.component.scss']
})
export class ChangePasswordPageComponent implements OnInit {

  public changePasswordForm: FormGroup = new FormGroup({
    password: new FormControl('', Validators.required),
    newPassword: new FormControl('', Validators.required)
  });

  public changePasswordFormError: any = null;

  public get isReadyToBeSubmitted () {
    return this.changePasswordForm.valid;
  }

  public submitForm () {
    if (!this.isReadyToBeSubmitted) return;
    let value = this.changePasswordForm.value;
    this.changePasswordFormError = null;
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.postRequest(
      '/update_password',
      {
        password: value.password,
        newPassword: value.newPassword
      },
      {
        onSuccess: res => {
          SharedService.getSharedComponent('growl').addItem(res);
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.router.navigate([ROUTES.PROFILE + '/', this.authorizationService.getCurrentUser()['_id']]);
        },
        onFail: err => {
          this.changePasswordFormError = 'Wrong password';
          SharedService.getSharedComponent('globalOverlay').toggle(true);
        }
      }
    );
  }

  constructor (
    private authorizationService: AuthorizationService,
    private accessPointService: AccessPointService,
    private router: Router
  ) {}

  ngOnInit () {}

}
