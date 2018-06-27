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

  public get isReadyToBeSubmitted () {
    let form = this.signUpForm, value = form.value;
    return form.valid && value.password === value.passwordRepeat && this.userAvatar['isUploaded'];
  }

  public onSubmitForm () {
    if (!this.isReadyToBeSubmitted) return;

    let
      self = this,
      form = this.signUpForm,
      uploadedImage = this.userAvatar,
      fReader = new FileReader();

    fReader.onloadend = function (onReadyEvent) {
      let formValue = form.value;
      self.accessPointService.postRequest('/create_local_user', {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        gender: self.genderSwitchItems.filter(item => item['isSelected'])[0].name,
        image:  onReadyEvent.target['result'],
        contentType: uploadedImage['contentType']
      }, {
        onSuccess: (userData) => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          self.authorizationService.signIn('local', userData);
          self.router.navigate([ROUTES.PROFILE + '/', userData['_id']]);
        },
        onFail: err => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      });
    };

    SharedService.getSharedComponent('globalOverlay').toggle(false);

    fReader.readAsBinaryString(this.userAvatar['originalImage']);
  }

  constructor (
    private accessPointService: AccessPointService,
    private router: Router,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit () {}

}