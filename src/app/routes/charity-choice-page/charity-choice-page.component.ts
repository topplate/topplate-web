import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-charity-choice-page',
  templateUrl: './charity-choice-page.component.html',
  styleUrls: ['./charity-choice-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CharityChoicePageComponent implements OnInit {

  constructor (
    private activatedRoute: ActivatedRoute,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  public charityItems: Object[];

  public voteForItem (item) {
    let self = this;

    self.accessPointService.postRequest(
      'vote_for_charity',
      {id : item._id},
      {
        onSuccess: res => {
          item['votes'] = res['charityVotes'];
          item['numberOfVotes'] = item['votes'].length;
        },
        onFail: err => {
          console.log(err);
        }
      }
    );
  }

  ngOnInit () {
    let
      self = this,
      routeData = self.activatedRoute.snapshot.data;

    self.charityItems = routeData['charityItems'].map(item => {
      item['numberOfVotes'] = item['votes'].length;
      item['liked'] = item['liked'];
      return item;
    });

    console.log(self.charityItems);
  }
}

