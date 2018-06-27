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
  selector: 'app-edit-profile-page',
  templateUrl: './edit-profile-page.component.html',
  styleUrls: ['./edit-profile-page.component.scss']
})
export class EditProfilePageComponent implements OnInit {

  public userAvatar: any = {};

  public currentUser: any = this.authorizationService.getCurrentUser();

  public editProfileForm: FormGroup = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required)
  });

  public genderSwitchItems: any[] = ['male', 'female'].map((str, i) => {
    return {
      label: str.toUpperCase(),
      name: str
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
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.postRequest(
      '/update_user_profile',
      data,
      {
        onSuccess: updatedUserData => {

          console.log(updatedUserData);
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.authorizationService.setCurrentUser(updatedUserData);
          this.router.navigate([ROUTES.PROFILE + '/', updatedUserData['_id']]);
        },
        onFail: err => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      }
    );
  }

  public get isReadyToBeSubmitted () {
    return this.editProfileForm.valid && (this.userAvatar['defaultImage'] || this.userAvatar['isUploaded']);
  }

  public onSubmitForm () {
    if (!this.isReadyToBeSubmitted) return;
    let
      self = this,
      formValue = this.editProfileForm.value,
      useNewImage = this.userAvatar['isUploaded'];

    if (useNewImage) {
      let fReader = new FileReader();
      fReader.onloadend = function (onReadyEvent) {
        self.sendRequest({
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          gender: self.genderSwitchItems.filter(item => item['isSelected'])[0].name,
          image: onReadyEvent.target['result'],
          contentType: self.userAvatar['contentType']
        });
      };
      fReader.readAsBinaryString(this.userAvatar['originalImage']);
    } else this.sendRequest({
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      gender: self.genderSwitchItems.filter(item => item['isSelected'])[0].name,
      imageSource: this.userAvatar['defaultImage']
    });
  }

  constructor (
    private router: Router,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit () {
    let profile = this.currentUser.user;
    this.userAvatar['defaultImage'] = profile.image;
    this.editProfileForm.controls.firstName.setValue(profile.firstName || '');
    this.editProfileForm.controls.lastName.setValue(profile.lastName || '');
    if (this.currentUser.user.gender) this.genderSwitchItems.forEach(item => {
      item['isSelected'] = item['name'] === profile.gender;
    });
  }
}
