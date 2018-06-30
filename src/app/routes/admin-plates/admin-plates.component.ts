import {Component, OnDestroy, OnInit} from '@angular/core';
import {AccessPointService} from '../../services/access-point.service';
import {GridComponentModel} from '../../models/grid-component.model';
import {FilterComponentModel} from '../../models/filter-component.model';
import {SharedService} from '../../services/shared.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

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

  public modalState: BehaviorSubject<any> = new BehaviorSubject(false);

  public modalContent: any;

  public modalPreviewSettings = {
    showLabel: true,
    showGeo: true,
    showAuthor: true
  };

  private get isReady () {
    return !!this.statusFilterSubscription && !!this.periodFilterSubscription && !!this.evnFilterSubscription;
  }

  public platesGrid: GridComponentModel = new GridComponentModel([
    {
      name: 'name',
      label: 'Plate name',
      sortable: true
    },
    {
      name: 'environment',
      label: 'Environment',
      sortable: true
    },
    {
      name: 'author',
      label: 'Author',
      type: 'object',
      keys: ['name']
    },
    {
      name: 'likes',
      label: 'Total likes',
      type: 'number',
      sortable: true
    },
    {
      name: 'hasRecipe',
      label: 'Has recipe',
      type: 'boolean'
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      dateFormat: 'MM/DD/YYYY'

      // name: 'status',
      // label: 'Status',
      // sortable: true
    }
  ], {
    onRowClick: row => {
      this.modalContent = row;
      this.modalState.next(true);
    },
    onColumnClick: col => {
      this.platesGrid.toggleColumn(col);
      this.loadItems();
    }
  });

  public togglePlateStatus () {
    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.postRequest(
      '/toggle_plate_status',
      {
        plateId: this.modalContent._id,
        newStatus: !this.modalContent.status
      },
      {
        onSuccess: (plateData) => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.statusFilter.getSelectedButton().name === 'all' ?
            this.platesGrid.refreshRow(plateData) :
            this.platesGrid.removeRow(plateData);
          this.modalState.next(false);
        },
        onFail: (err) => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          SharedService.getSharedComponent('growl').addItem(err);
        }
      }
    );

  }

  private loadItems () {
    if (!this.isReady) return;

    let params = {
        statusFilter: this.statusFilter.getSelectedButton().name,
        periodFilter: this.periodFilter.getSelectedButton().name,
        environmentFilter: this.envFilter.getSelectedButton().name
      },
      selectedColumn = this.platesGrid.getSelectedColumn();

    if (selectedColumn) {
      params['name'] = selectedColumn.name;
      params['type'] = selectedColumn.type;
      params['isReversed'] = selectedColumn.isReversed;
    }

    SharedService.getSharedComponent('globalOverlay').toggle(false);
    this.accessPointService.getRequest(
      '/get_plates_admin',
      params,
      {
        onSuccess: listOfPlates => {
          SharedService.getSharedComponent('globalOverlay').toggle(true);
          this.platesGrid.refreshRows(listOfPlates.map(plate => {
            plate.canLike = false;
            return plate;
          }));
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
