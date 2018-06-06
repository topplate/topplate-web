import {Component, OnDestroy, OnInit} from '@angular/core';
import {AccessPointService} from '../../services/access-point.service';
import {GridComponentModel} from '../../models/grid-component.model';
import {FilterComponentModel} from '../../models/filter-component.model';
import {SharedService} from '../../services/shared.service';

@Component({
  selector: 'app-admin-plates',
  templateUrl: './admin-plates.component.html',
  styleUrls: ['./admin-plates.component.scss']
})
export class AdminPlatesComponent implements OnInit, OnDestroy {

  private statusFilterSubscription: any;

  private periodFilterSubscription: any;

  private evnFilterSubscription: any;

  public statusFilter: FilterComponentModel = new FilterComponentModel([
    {
      name: 'all',
      label: 'ALL'
    },
    {
      name: 'approved',
      label: 'ONLY APPROVED'
    },
    {
      name: 'nonApproved',
      label: 'ONLY SUSPENDED'
    }
  ]);

  public periodFilter: FilterComponentModel = new FilterComponentModel([
    {
      name: 'all',
      label: 'All PLATES'
    },
    {
      name: 'new',
      label: 'ONLY NEW'
    },
    {
      name: 'old',
      label: 'ONLY OLD'
    }
  ]);

  public envFilter: FilterComponentModel = new FilterComponentModel([
    {
      name: 'all',
      label: 'ALL'
    },
    {
      name: 'homemade',
      label: 'HOMEMADE ONLY'
    },
    {
      name: 'restaurant',
      label: 'RESTAURANT ONLY'
    }
  ]);

  private get isReady () {
    return !!this.statusFilterSubscription && !!this.periodFilterSubscription && !!this.evnFilterSubscription;
  }

  public platesGrid: GridComponentModel = new GridComponentModel([
    {
      name: 'name',
      label: 'Plate name'
    },
    {
      name: 'environment',
      label: 'Environment'
    },
    {
      name: 'author',
      label: 'Author',
      type: 'object',
      keys: ['name']
    },
    {
      name: 'likes',
      label: 'Total likes'
    },
    {
      name: 'hasRecipe',
      label: 'Has recipe',
      type: 'boolean'
    },
    {
      name: 'status',
      label: 'Status'
    }
  ], {
    onRowClick: row => console.log(row)
  });

  private loadItems () {
    if (!this.isReady) return;
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.getRequest(
      '/get_plates_admin',
      {
        statusFilter: this.statusFilter.getSelectedButton().name,
        periodFilter: this.periodFilter.getSelectedButton().name,
        environmentFilter: this.envFilter.getSelectedButton().name
      },
      {
        onSuccess: listOfPlates => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.platesGrid.refreshRows(listOfPlates);
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
    this.statusFilterSubscription = this.statusFilter.getSubscription(() => this.loadItems());
    this.periodFilterSubscription = this.periodFilter.getSubscription(() => this.loadItems());
    this.evnFilterSubscription = this.envFilter.getSubscription(() => this.loadItems());

    this.loadItems();
  }

  ngOnDestroy () {
    this.periodFilterSubscription.unsubscribe();
    this.evnFilterSubscription.unsubscribe();
  }
}
