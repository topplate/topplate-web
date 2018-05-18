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
  selector: 'app-plates-page',
  templateUrl: './plates-page.component.html',
  styleUrls: ['./plates-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlatesPageComponent implements OnInit, OnDestroy {

  constructor (
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private accessPointService: AccessPointService,
    private authorizationService: AuthorizationService,
    private environmentService: EnvironmentService
  ) {}

  private changesObserver: any;

  private environmentWatcher: any;

  public plates: any;

  public settings: any;

  public infiniteScrollEvents: any;

  public infiniteScrollAPI: any;

  private refreshPlates (plates) {
    let self = this;
    self.plates = self.plates || [];
    return plates.map(plate => {
      plate['onLinkClick'] = () => self.router.navigate([ROUTES.PLATE + '/', plate._id]);
      plate['onProfileLinkClick'] = () => self.router.navigate([ROUTES.PROFILE + '/', plate.author.id]);
      plate['onLikeClick'] = () => {
        let currentUser = self.authorizationService.getCurrentUser();
        if (!currentUser) return;

        self.accessPointService.postRequest('/like_plate',
          {plate: plate._id},
          {
            onSuccess: res => {
              plate.likes = res.numberOfLikes === null ? plate.likes : res.numberOfLikes;
              SharedService.setLikedPlates(res.likedPlates);
              SharedService.getSharedComponent('growl').addItem({message: 'Liked!'});
            },
            onFail: err => SharedService.getSharedComponent('growl').addItem(err)
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
      selectedEnvironment = self.environmentService.getCurrent(),
      isFinalized =  infiniteScrollAPI.getFinalized(),
      lim = infiniteScrollAPI.getRequiredNumberOfItems(),
      skip = infiniteScrollAPI.getCurrentIndex(),
      lastOne = infiniteScrollAPI.getLastOne(),
      params = {
        environment: self.environmentService.getCurrent(),
        lim: infiniteScrollAPI.getRequiredNumberOfItems()
      };

    if (lastOne) params['lastId'] = lastOne._id;

    self.accessPointService.getRequest(
      '/get_plates',
      params,
      {
        onSuccess: res => {
          let newPlates = self.refreshPlates(res);
          infiniteScrollAPI.setFinalized(newPlates.length < lim);
          infiniteScrollAPI.addItems(newPlates);
        },
        onFail: err => SharedService.getSharedComponent('growl').addItem(err)
      }
    );
  }

  ngOnInit () {
    let self = this;

    self.settings = {
      showLabel: true,
      showGeo: true,
      showAuthor: true,
      showRecipeBanner: true
    };

    self.infiniteScrollEvents = {
      onReady: (componentAPI) => {
        self.infiniteScrollAPI = componentAPI;
        self.environmentWatcher = self.environmentService.getSubscription(env => {
          self.infiniteScrollAPI.clearList();
          self.loadPlates();
        });
      },
      onEndOfListReached: () => {
        console.log('onEndOfListReached triggered');
        self.loadPlates();
      }
    };

    self.changesObserver = {
      timer: null,
      curr: '',
      prev: '',
      refreshHashes: () => {
        let
          likedPlates = SharedService.getLikedPlates(),
          hash = Object.keys(likedPlates).map(key => key).join('_'),
          observer = self.changesObserver,
          items = self.plates || [];

        observer.prev = observer.curr;
        observer.curr = hash;

        if (observer.curr !== observer.prev) items.forEach(plate => plate.liked = !!likedPlates[plate._id]);
      }
    };

    self.changesObserver.timer = d3.timer(() => self.changesObserver.refreshHashes(), 10);
  }

  ngOnDestroy () {
    let self = this;
    self.changesObserver.timer.stop();
    self.environmentWatcher.unsubscribe();
  }
}
