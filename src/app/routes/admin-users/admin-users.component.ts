import {Component, OnDestroy, OnInit} from '@angular/core';
import {AccessPointService} from '../../services/access-point.service';
import {GridComponentModel} from '../../models/grid-component.model';
import {FilterComponentModel} from '../../models/filter-component.model';
import {SharedService} from '../../services/shared.service';

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
      name: 'likedPlates',
      label: 'Liked plates',
      type: 'list'
    },
    {
      name: 'uploadedPlates',
      label: 'Uploaded plates',
      type: 'list'
    },
    {
      name: 'status',
      label: 'Status'
    }
  ], {
    onRowClick: row => console.log(row)
  });

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
