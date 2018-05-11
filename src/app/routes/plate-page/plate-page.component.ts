import { Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { Route, ActivatedRoute, Router } from '@angular/router';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';
import { SharedService } from '../../services/shared.service';
import { AuthorizationService } from '../../services/authorization.service';
import { AccessPointService } from '../../services/access-point.service';


const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-plate-page',
  templateUrl: './plate-page.component.html',
  styleUrls: ['./plate-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlatePageComponent implements OnInit, OnDestroy {

  constructor (
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private accessPointService: AccessPointService
  ) {}

  public changesObserver: any;

  public selectedPlate: any;

  public relatedPlates: any;

  public relatedPlatesSettings: any;

  ngOnInit () {

    let
      self = this,
      routeData = self.activatedRoute.snapshot.data;

    self.selectedPlate = routeData['plate'];
    self.relatedPlates = self.selectedPlate.relatedPlates.map(plate => plate);

    [self.selectedPlate].concat(self.relatedPlates || []).forEach(plate => {
      plate['hasRecipe'] = plate.recipe || plate.ingredients;
      plate['onLinkClick'] = () => self.router.navigate([ROUTES.PLATES])
        .then(() => self.router.navigate([ROUTES.PLATE + '/', plate._id]));
      plate['onLikeClick'] = () => {
        let currentUser = self.authorizationService.getCurrentUser();
        if (!currentUser) return;
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
    });

    self.relatedPlatesSettings = {
      resolution: [430, 360],
      showLabel: true,
      showGeo: true,
      showAuthor: true,
      showRecipeBanner: true
    };

    self.changesObserver = {
      timer: null,
      curr: '',
      prev: '',
      refreshHashes: () => {
        let
          likedPlates = SharedService.getLikedPlates(),
          hash = Object.keys(likedPlates).map(key => key).join('_'),
          observer = self.changesObserver;

        observer.prev = observer.curr;
        observer.curr = hash;

        if (observer.curr !== observer.prev) {
          self.selectedPlate.liked = !!likedPlates[self.selectedPlate._id];
          self.relatedPlates.forEach(plate => plate.liked = !!likedPlates[plate._id]);
        }
      }
    };

    self.changesObserver.timer = d3.timer(() => self.changesObserver.refreshHashes(), 500);
  }

  ngOnDestroy () {
    this.changesObserver.timer.stop();
  }

}
