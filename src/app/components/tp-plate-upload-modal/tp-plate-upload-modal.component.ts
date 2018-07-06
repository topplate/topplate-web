import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators} from '@angular/forms';
import { ConstantsService } from '../../services/constants.service';
import { SharedService } from '../../services/shared.service';
import { EnvironmentService } from '../../services/environment.service';
import { AccessPointService } from '../../services/access-point.service';
import { AuthorizationService } from '../../services/authorization.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CollectionComponentModel } from '../../models/collection-component.model';

const
  CONSTANTS = ConstantsService.getConstants(),
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS;

@Component({
  selector: 'app-tp-plate-upload-modal',
  templateUrl: './tp-plate-upload-modal.component.html',
  styleUrls: ['./tp-plate-upload-modal.component.scss']
})
export class TpPlateUploadModalComponent implements OnInit {

  private static emailRegExp: any = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

  public state: BehaviorSubject<Boolean> = new BehaviorSubject(false);

  public uploadedImage: any = {};

  public restaurantPlateForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    image: new FormControl(),
    address: new FormControl('', Validators.required),
    restaurantName: new FormControl('', Validators.required)
  });

  public homemadePlateForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    image: new FormControl(),
    address: new FormControl('', Validators.required),
    recipe: new FormControl(),
  });

  public ingredientsCollection: CollectionComponentModel = new CollectionComponentModel();

  public get currentEnvironment () {
    return this.environmentService.getCurrent();
  }

  public get restaurantEnvironmentIsSelected () {
    return this.currentEnvironment === ENVIRONMENTS.RESTAURANT;
  }

  public get isReadyToBeSubmitted () {
    let
      isRestaurantPlate = this.restaurantEnvironmentIsSelected,
      form = isRestaurantPlate ? this.restaurantPlateForm : this.homemadePlateForm,
      ingredientsAreRequired = !isRestaurantPlate && form.value.recipe;

    return form.valid &&
      this.uploadedImage['isUploaded'] &&
      (ingredientsAreRequired ? !this.ingredientsCollection.isEmpty : true);
  }

  public onPlateSubmit () {
    let
      self = this,
      isRestaurantPlate = this.restaurantEnvironmentIsSelected,
      form = isRestaurantPlate ? this.restaurantPlateForm : this.homemadePlateForm,
      plateUploadedImage = this.uploadedImage,
      currentUser = this.authorizationService.getCurrentUser();

    if (!currentUser || !this.isReadyToBeSubmitted) return;
    let fReader = new FileReader();

    fReader.onloadend = function (onReadyEvent) {
      let formValue = form.value;
      self.accessPointService.postRequest('/add_plate', {
        name: formValue.name,
        environment: self.environmentService.getCurrent(),
        email: currentUser['email'],
        image: onReadyEvent.target['result'],
        extension: plateUploadedImage['fileExtension'],
        contentType: plateUploadedImage['contentType'],
        address: formValue.address || '',
        recipe: formValue.recipe || '',
        ingredients: self.ingredientsCollection.getItems()
          .map(item => item.text)
          .filter(text => text && text.replace(/\s/g, '').length),
        restaurantName: formValue.restaurantName || '',
        author: currentUser['_id']
      }, {
        onSuccess: (res) => {
          self.toggleState(false);
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(res);
        },
        onFail: err => {
          self.toggleState(false);
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      });
    };

    SharedService.getSharedComponent('globalOverlay').toggle(false);

    fReader.readAsBinaryString(plateUploadedImage['originalImage']);

  }

  public toggleState (state) {
    this.state.next(state);
    if (state) {
      this.restaurantPlateForm.reset();
      this.homemadePlateForm.reset();
      this.ingredientsCollection.clearList();
      typeof this.uploadedImage.reset === 'function' && this.uploadedImage.reset();
    }
  }

  constructor (
    private environmentService: EnvironmentService,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit () {
    SharedService.setSharedComponent('plateUploadModal', {
      toggle: state => this.toggleState(state)
    });
  }

}
