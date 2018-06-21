import { Component, OnInit } from '@angular/core';
import {GridComponentModel} from '../../models/grid-component.model';
import {SharedService} from '../../services/shared.service';
import {AccessPointService} from '../../services/access-point.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-admin-charities',
  templateUrl: './admin-charities.component.html',
  styleUrls: ['./admin-charities.component.scss']
})
export class AdminCharitiesComponent implements OnInit {

  public charityEditForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    link: new FormControl('', Validators.required)
  });

  public charityAddForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    link: new FormControl('', Validators.required)
  });

  public addCharityFormImage: any = {};

  public modalMode: any = '';

  public modalState: BehaviorSubject<any> = new BehaviorSubject(false);

  public charitiesGrid: GridComponentModel = new GridComponentModel([

    {
      name: 'name',
      label: 'Charity',
      sortable: true
    },
    {
      name: 'description',
      label: 'Description'
    },
    {
      name: 'link',
      label: 'Link'
    },
    {
      name: 'votes',
      label: 'Votes total',
      type: 'number',
      sortable: true
    },
    {
      name: 'votesMonthly',
      label: 'Votes monthly',
      type: 'number',
      sortable: true
    },
    {
      name: 'status',
      label: 'Status',
      sortable: true
    }
  ], {
    onRowClick: row => {
      this.charityEditForm.reset();
      this.modalMode = 'edit';
      this.modalContent = row;
      ['name', 'description', 'link'].forEach(key => this.charityEditForm.controls[key]
        .setValue(this.modalContent[key] || '')
      );
      this.modalState.next(true);
    },
    onColumnClick: col => {
      this.charitiesGrid.toggleColumn(col);
      this.loadItems();
      console.log(col);
    }
  });

  public modalContent: any;

  public onCancel () {
    this.charityEditForm.reset();
    this.charityAddForm.reset();
    this.modalState.next(false);
  }

  public onSubmitEdit () {
    if (!this.charityEditForm.valid) return SharedService.getSharedComponent('growl').addItem({
      message: 'All fields are required',
      warning: true
    });

    let formValue = this.charityEditForm.value;
    SharedService.getSharedComponent('globalOverlay').toggle(false);

    this.accessPointService.postRequest(
      '/update_charity_item',
      {
        _id: this.modalContent._id,
        name: formValue.name,
        description: formValue.description,
        link: formValue.link,
      },
      {
        onSuccess: res => {
          this.modalContent.name = formValue.name;
          this.modalContent.description = formValue.description;
          this.modalContent.link = formValue.link;
          this.modalState.next(false);
          this.charitiesGrid.refreshRow(this.modalContent);
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(res);
        },
        onFail: err => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      }
    );
  }

  public onSubmitAdd () {
    if (!this.charityAddForm.valid || !this.addCharityFormImage['isUploaded']) return SharedService
      .getSharedComponent('growl').addItem({
        message: 'Fill the form',
        warning: true
      });

    let
      self = this,
      charityItemImage = this.addCharityFormImage,
      formValue = this.charityAddForm.value,
      fReader = new FileReader();

    SharedService.getSharedComponent('globalOverlay').toggle(false);

    fReader.onloadend = function (onReadyEvent) {
      self.accessPointService.postRequest(
        '/add_charity_item',
        {
          name: formValue.name,
          description: formValue.description,
          link: formValue.link,
          image: onReadyEvent.target['result'],
          extension: charityItemImage['fileExtension'],
          contentType: charityItemImage['contentType']
        },
        {
          onSuccess: newCharityItem => {
            SharedService.getSharedComponent('globalOverlay').toggle(true);
            SharedService.getSharedComponent('growl').addItem({message: 'New charity was created'});
            self.modalState.next(false);
            self.charitiesGrid.addRows(newCharityItem);
          },
          onFail: err => {
            SharedService.getSharedComponent('globalOverlay').toggle(true);
            SharedService.getSharedComponent('growl').addItem(err);
          }
        }
      );
    };

    fReader.readAsBinaryString(charityItemImage['originalImage']);
  }

  public selectAddMode () {
    this.charityAddForm.reset();
    this.modalMode = 'add';
    this.modalContent = {};
    this.modalContent.name = this.charityAddForm.value.name;
    this.modalContent.description = this.charityAddForm.value.description;
    this.modalContent.link = this.charityAddForm.value.link;
    this.addCharityFormImage.reset && this.addCharityFormImage.reset();
    this.modalState.next(true);
  }

  private loadItems () {
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.getRequest(
      '/get_charities_admin',
      this.charitiesGrid.getSelectedColumn() || {},
      {
        onSuccess: listOfCharities => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.charitiesGrid.refreshRows(listOfCharities);
        },
        onFail: err => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      }
    );
  }

  constructor (
    private accessPointService: AccessPointService
  ) {}

  ngOnInit () {
    this.loadItems();
  }
}
