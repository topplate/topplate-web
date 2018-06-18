import { Component, OnInit } from '@angular/core';
import { AccessPointService } from '../../services/access-point.service';
import { SharedService } from '../../services/shared.service';
import { ConstantsService } from '../../services/constants.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthorizationService } from '../../services/authorization.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  ADMIN_ROUTES = CONSTANTS.ADMIN_ROUTES;

@Component({
  selector: 'app-admin-entrance',
  templateUrl: './admin-entrance.component.html',
  styleUrls: ['./admin-entrance.component.scss']
})
export class AdminEntranceComponent implements OnInit {

  public adminLoginForm: FormGroup = new FormGroup({
    login: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
    // login: new FormControl('The_Chosen_One', Validators.required),
    // password: new FormControl('Enter_The_Matrix', Validators.required)
  });

  public submit () {
    let formValue = this.adminLoginForm.value;

    if (!this.adminLoginForm.valid) SharedService.getSharedComponent('growl')
      .addItem({message: 'Login and Password are required', status: 401});

    else {
      SharedService.getSharedComponent('globalOverlay').toggle(false);
      this.accessPointService.postRequest(
        '/sign_in_admin',
        {
          login: formValue.login,
          password: formValue.password
        },
        {
          onSuccess: adminData => {
            SharedService.getSharedComponent('globalOverlay').toggle(true);
            SharedService.getSharedComponent('growl').addItem({message: 'authorized as admin'});
            this.authorizationService.setAdminUser(adminData);
            this.router.navigate([ADMIN_ROUTES.MANAGE_USERS]);
          },
          onFail: err => {
            SharedService.getSharedComponent('globalOverlay').toggle(true);
            SharedService.getSharedComponent('growl').addItem(err);
          }
        }
      );
    }
  }

  constructor (
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService,
    private router: Router
  ) { }

  ngOnInit () {}

}
