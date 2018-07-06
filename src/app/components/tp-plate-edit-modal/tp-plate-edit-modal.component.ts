import { Input, Component, OnInit } from '@angular/core';
import { PlateModel } from '../../models/plate.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {CollectionComponentModel} from '../../models/collection-component.model';
import {SharedService} from '../../services/shared.service';
import { ConstantsService} from '../../services/constants.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {EnvironmentService} from '../../services/environment.service';
import {AccessPointService} from '../../services/access-point.service';

const
  CONSTANTS = ConstantsService.getConstants(),
  ENVIRONMENTS = CONSTANTS.ENVIRONMENTS;

@Component({
  selector: 'app-tp-plate-edit-modal',
  templateUrl: './tp-plate-edit-modal.component.html',
  styleUrls: ['./tp-plate-edit-modal.component.scss']
})
export class TpPlateEditModalComponent implements OnInit {

  public model: PlateModel;

  public state: BehaviorSubject<Boolean> = new BehaviorSubject(false);

  public ingredientsCollection: CollectionComponentModel = new CollectionComponentModel();

  public homemadePlateForm: FormGroup = new FormGroup({
    recipe: new FormControl(),
  });

  public get isReadyToBeSubmitted () {
    let
      envChecked = this.model && this.model.environment && this.model.environment === ENVIRONMENTS.HOMEMADE,
      formIsValid = this.homemadePlateForm.valid,
      ingredientsAreRequired = this.homemadePlateForm.value.recipe;

    return envChecked && formIsValid && (ingredientsAreRequired ? this.ingredientsCollection.length : true);
  }

  public onPlateSubmit () {
    if (!this.isReadyToBeSubmitted) return;

    let
      recipe = this.homemadePlateForm.value.recipe || '',
      ingredients = this.ingredientsCollection.getItems()
        .map(item => item.text)
        .filter(text => text && text.replace(/\s/g, '').length);

    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.postRequest(
      'edit_plate',
      {
        plateId: this.model._id,
        fields: {
          recipe: recipe,
          ingredients: ingredients
        }
      },
      {
        onSuccess: res => {
          this.model.recipe = recipe;
          this.model.ingredients = ingredients;
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(res);
          SharedService.getSharedComponent('plateEditModal').close();
        },
        onFail: err => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      }
    );
  }

  public onCancel () {
    this.clearContent();
    this.toggleState(false);
  }

  private toggleState (state) {
    this.state.next(state);
  }

  private refreshContent () {
    this.clearContent();
    this.homemadePlateForm.controls.recipe.setValue(this.model.recipe);
    this.ingredientsCollection.addItems(this.model.ingredients.map(value => {
      return { text: value };
    }));
  }

  private clearContent () {
    this.homemadePlateForm.reset();
    this.ingredientsCollection.clearList();
  }

  constructor (
    private accessPointService: AccessPointService
  ) {}

  ngOnInit () {
    SharedService.setSharedComponent('plateEditModal', {
      open: model => {
        this.model = model;
        this.refreshContent();
        this.toggleState(true);
      },
      close: () => {
        this.clearContent();
        this.toggleState(false);
      }
    });
  }
}
