import { Component, OnInit, OnDestroy } from '@angular/core';
import { FilterComponentModel } from '../../models/filter-component.model';
import { GridComponentModel } from '../../models/grid-component.model';
import { AccessPointService } from '../../services/access-point.service';
import {SharedService} from '../../services/shared.service';

@Component({
  selector: 'app-admin-requests',
  templateUrl: './admin-requests.component.html',
  styleUrls: ['./admin-requests.component.scss']
})
export class AdminRequestsComponent implements OnInit, OnDestroy {

  private requestFilterSubscription: any;

  public requestsFilter: FilterComponentModel = new FilterComponentModel([
    {
      name: 'all',
      label: 'All REQUESTS'
    },
    {
      name: 'new',
      label: 'OPENED ONLY'
    },
    {
      name: 'old',
      label: 'CLOSED ONLY'
    }
  ]);

  public requestsGrid: GridComponentModel = new GridComponentModel([
    {
      name: 'name',
      label: 'Username'
    },
    {
      name: 'email',
      label: 'Email'
    },
    {
      name: 'message',
      label: 'Request'
    },
    {
      name: 'isClosed',
      label: 'Is closed',
      type: 'boolean'
    }
  ], {
    onRowClick: row => console.log(row)
  });

  private loadItems () {
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.getRequest(
      '/get_users_requests',
      { filter: this.requestsFilter.getSelectedButton().name },
      {
        onSuccess: listOfRequests => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.requestsGrid.refreshRows(listOfRequests);
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
    this.requestFilterSubscription = this.requestsFilter.getSubscription(() => this.loadItems());
  }

  ngOnDestroy () {
    this.requestFilterSubscription.unsubscribe();
  }
}
