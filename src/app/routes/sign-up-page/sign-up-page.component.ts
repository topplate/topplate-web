import { Component, OnInit } from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {SharedService} from '../../services/shared.service';
import {AccessPointService} from '../../services/access-point.service';
import {Router} from '@angular/router';
import {ConstantsService} from '../../services/constants.service';
import {AuthorizationService} from '../../services/authorization.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES;

@Component({
  selector: 'app-sign-up-page',
  templateUrl: './sign-up-page.component.html',
  styleUrls: ['./sign-up-page.component.scss']
})
export class SignUpPageComponent implements OnInit {

  public userAvatar: any = {};

  public signUpForm: FormGroup = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
    passwordRepeat: new FormControl('', Validators.required)
  });

  public signUpFormErrors: any = null;

  public genderSwitchItems: any[] = ['male', 'female'].map((str, i) => {
    return {
      label: str.toUpperCase(),
      name: str,
      isSelected: !i
    };
  });

  public genderSwitchEvents: any = {
    onClick: clickedItem => {
      if (clickedItem['isSelected']) return;

      this.genderSwitchItems.forEach(item => {
        item['isSelected'] = item['name'] === clickedItem['name'];
      });
    }
  };

  private sendRequest (data) {
    this.signUpFormErrors = null;
    this.accessPointService.postRequest('/create_local_user', data, {
      onSuccess: (userData) => {
        SharedService.getSharedComponent('globalOverlay').toggle(true);
        this.authorizationService.signIn('local', userData);
        this.router.navigate([ROUTES.PROFILE + '/', userData['_id']]);
      },
      onFail: err => {
        SharedService.getSharedComponent('globalOverlay').toggle(true);
        this.signUpFormErrors = err.error ? err.error.message : err.message;
      }
    });
  }

  public get isReadyToBeSubmitted () {
    return this.signUpForm.valid && (this.userAvatar['defaultImage'] || this.userAvatar['isUploaded']);
  }

  public onSubmitForm () {
    let
      form = this.signUpForm,
      formValue = form.value;

    if (!this.isReadyToBeSubmitted) return;
    else if (formValue.password !== formValue.passwordRepeat) {
      this.signUpFormErrors = 'Password & password repeat should be equal';
      return;
    }
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    let
      self = this,
      useNewImage = this.userAvatar['isUploaded'],
      requestData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        gender: self.genderSwitchItems.filter(item => item['isSelected'])[0].name,
      };

    if (useNewImage) {
      let fReader = new FileReader();
      fReader.onloadend = function (onReadyEvent) {
        requestData['image'] = onReadyEvent.target['result'];
        requestData['contentType'] = self.userAvatar['contentType'];
        self.sendRequest(requestData);
      };
      fReader.readAsBinaryString(this.userAvatar['originalImage']);
    } else {
      requestData['imageSource'] = this.userAvatar['defaultImage'];
      this.sendRequest(requestData);
    }
  }

  constructor (
    private accessPointService: AccessPointService,
    private router: Router,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit () {
    this.userAvatar['defaultImage'] = 'assets/icons/default_user_icon.png';
  }

}
