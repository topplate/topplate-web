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
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfilePageComponent implements OnInit {

  constructor (
    private activatedRoute: ActivatedRoute,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  public plates: Object[];

  public profile: Object;

  public settings: any;

  public infiniteScrollEvents: any;

  public infiniteScrollAPI: any;

  private refreshPlates (plates) {
    let self = this;
    self.plates = self.plates || [];
    return plates.map(plate => {
      plate['onLinkClick'] = () => self.router.navigate([ROUTES.PLATE + '/', plate._id]);
      plate['onLikeClick'] = () => {
        let currentUser = self.authorizationService.getCurrentUser();
        if (!currentUser) return;

        // self.accessPointService.postRequest('/edit_plate',
        //   {
        //     plateId: plate._id,
        //     fields: {
        //       recipe: 'this is a test',
        //       ingredients: [
        //         '8 of something',
        //         '3 of some other thing',
        //         '4 of some third thing',
        //         'salt',
        //         'pepper'
        //       ]
        //     }
        //   },
        //   {
        //     onSuccess: res => console.log(res),
        //     onFail: err => console.log(err)
        //   }
        // );

        self.accessPointService.postRequest('/like_plate',
          {plate: plate._id},
          {
            onSuccess: res => {
              plate.likes = res.numberOfLikes === null ? plate.likes : res.numberOfLikes;
              SharedService.setLikedPlates(res.likedPlates);
            },
            onFail: err => console.log(err)
          }
        );
      };
      plate['hasRecipe'] = plate.recipe || plate.ingredients;
      self.plates.push(plate);
      return plate;
    });
  }

  private loadPlates () {
    let
      self = this,
      infiniteScrollAPI = self.infiniteScrollAPI,
      isFinalized =  infiniteScrollAPI.getFinalized(),
      lim = infiniteScrollAPI.getRequiredNumberOfItems(),
      skip = infiniteScrollAPI.getCurrentIndex();
    // skip = isFinalized ? infiniteScrollAPI.getCurrentIndex() : 0; /** For test only */

    self.accessPointService.getRequest(
      '/get_plates_by_author',
      {
        id: self.profile['_id'],
        skip: skip,
        lim: lim
      },
      {
        onSuccess: res => {
          let newPlates = self.refreshPlates(res);
          infiniteScrollAPI.setFinalized(newPlates.length < lim);
          infiniteScrollAPI.addItems(newPlates);
        },
        onFail: err => console.log(err)
      }
    );
  }

  ngOnInit () {

    let
      self = this,
      routeData = self.activatedRoute.snapshot.data;

    self.profile = routeData.profile;

    self.settings = {
      showLabel: true,
      showGeo: true,
      showAuthor: true,
      showRecipeBanner: true
    };

    self.infiniteScrollEvents = {
      onReady: (componentAPI) => {
        self.infiniteScrollAPI = componentAPI;
        self.loadPlates();
      },
      onEndOfListReached: () => {
        console.log('onEndOfListReached triggered');
        self.loadPlates();
      }
    };
  }
}
