import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, EmailValidator } from '@angular/forms';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { SharedService } from '../../services/shared.service';
import { AccessPointService } from '../../services/access-point.service';
import { AuthorizationService } from '../../services/authorization.service';
import { EnvironmentService } from '../../services/environment.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-contacts-page',
  templateUrl: './contacts-page.component.html',
  styleUrls: ['./contacts-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContactsPageComponent implements OnInit {

  public contactForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i)
    ]),
    message: new FormControl('', Validators.required)
  });

  public contactsData: Object;

  public get isReadyToBeSubmitted () {
    return this.contactForm.valid;
  }

  public sendRequest () {
    if (!this.isReadyToBeSubmitted) return;
    let formValue = this.contactForm.value;
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.postRequest(
      '/create_request',
      {
        name: formValue.name,
        email: formValue.email,
        message: formValue.message
      },
      {
        onSuccess: resMessage => {
          this.contactForm.reset();
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(resMessage);
        },
        onFail: err => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      }
    );
  }

  constructor (
    private accessPointService: AccessPointService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit () {
    let routeData = this.activatedRoute.snapshot.data;
    this.contactsData = routeData['contactsData'];
  }
}
