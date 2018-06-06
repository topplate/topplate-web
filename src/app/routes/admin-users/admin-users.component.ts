import {Component, OnDestroy, OnInit} from '@angular/core';
import {AccessPointService} from '../../services/access-point.service';
import {GridComponentModel} from '../../models/grid-component.model';
import {FilterComponentModel} from '../../models/filter-component.model';
import {SharedService} from '../../services/shared.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit, OnDestroy {

  private usersFilterSubscription: any;

  public usersFilter: FilterComponentModel = new FilterComponentModel([
    {
      name: 'all',
      label: 'All USERS'
    },
    {
      name: 'active',
      label: 'ACTIVE ONLY'
    },
    {
      name: 'suspended',
      label: 'SUSPENDED ONLY'
    }
  ]);

  public usersGrid: GridComponentModel = new GridComponentModel([
    {
      name: 'name',
      label: 'Username'
    },
    {
      name: 'email',
      label: 'Email'
    },
    {
      name: 'uploadedPlates',
      label: 'Uploaded plates',
      type: 'list'
    },
    {
      name: 'warnings',
      label: 'Warnings',
      type: 'list'
    },
    {
      name: 'status',
      label: 'Status'
    }
  ], {
    onRowClick: row => {
      this.modalContentWarning = '';
      this.modalContent = row;
      this.modalModel.next(true);
    }
  });

  public modalModel: BehaviorSubject<any> = new BehaviorSubject(false);

  public modalContent: any;

  public modalContentWarning: any = '';

  public toggleUserStatus () {
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.postRequest(
      '/toggle_user_status',
      {
        userId: this.modalContent._id,
        newStatus: this.modalContent.status === 'Active'
      },
      {
        onSuccess: (userData) => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.usersFilter.getSelectedButton().name === 'all' ?
            this.usersGrid.refreshRow(userData) :
            this.usersGrid.removeRow(userData);
          this.modalModel.next(false);
        },
        onFail: (err) => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      }
    );
  }

  public addWarning () {
    if (!this.modalContentWarning) SharedService.getSharedComponent('growl')
      .addItem({message: 'input warning, please'});
    else {
      SharedService.getSharedComponent('globalOverlay').toggle(false);
      this.accessPointService.postRequest(
        '/add_warning',
        {
          userId: this.modalContent._id,
          warningMessage: this.modalContentWarning
        },
        {
          onSuccess: res => {
            SharedService.getSharedComponent('globalOverlay').toggle(true);
            this.usersGrid.refreshRow(res);
            this.modalModel.next(false);
          },
          onFail: err => {
            SharedService.getSharedComponent('globalOverlay').toggle(true);
            SharedService.getSharedComponent('growl').addItem(err);
          }
        }
      );
    }
  }

  private loadItems () {
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.getRequest(
      '/get_users',
      { filter: this.usersFilter.getSelectedButton().name },
      {
        onSuccess: listOfUsers => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.usersGrid.refreshRows(listOfUsers);
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
    this.usersFilterSubscription = this.usersFilter.getSubscription(() => this.loadItems());
  }

  ngOnDestroy () {
    this.usersFilterSubscription.unsubscribe();
  }
}
