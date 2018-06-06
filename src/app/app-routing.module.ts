import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { EnvironmentGuard } from './guards/environment.guard';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AppCommonModule } from './app-common.module';
import { AuthorizationService } from './services/authorization.service';
import { ConstantsService } from './services/constants.service';
import { HomeResolver } from './resolvers/home.resolver';
import { PlatesResolver } from './resolvers/plates.resolver';
import { PlateResolver } from './resolvers/plate.resolver';
import { WinnersResolver } from './resolvers/winners.resolver';
import { ProfileResolver } from './resolvers/profile.resolver';
import { CharityResolver } from './resolvers/charity.resolver';
import { ContactsResolver } from './resolvers/contacts.resolver';
import { HomePageComponent } from './routes/home-page/home-page.component';
import { PlatesPageComponent } from './routes/plates-page/plates-page.component';
import { PlatePageComponent } from './routes/plate-page/plate-page.component';
import { WinnersPageComponent } from './routes/winners-page/winners-page.component';
import { EmptyPageComponent } from './routes/empty-page/empty-page.component';
import { ProfilePageComponent } from './routes/profile-page/profile-page.component';
import { CharityChoicePageComponent } from './routes/charity-choice-page/charity-choice-page.component';
import { ContactsPageComponent } from './routes/contacts-page/contacts-page.component';
import { SearchPageComponent } from './routes/search-page/search-page.component';
import { AdminEntranceComponent } from './routes/admin-entrance/admin-entrance.component';
import { AdminGeneralComponent } from './routes/admin-general/admin-general.component';
import { AdminUsersComponent } from './routes/admin-users/admin-users.component';
import { AdminPlatesComponent } from './routes/admin-plates/admin-plates.component';
import { AdminRequestsComponent } from './routes/admin-requests/admin-requests.component';
import { AdminContactsComponent } from './routes/admin-contacts/admin-contacts.component';

const
  CONSTANTS = ConstantsService.getConstants(),
  ROUTES = CONSTANTS.ROUTES,
  ADMIN_ROUTES = CONSTANTS.ADMIN_ROUTES;

@NgModule({
  imports: [
    CommonModule,
    AppCommonModule,
    ReactiveFormsModule,
    FormsModule
  ],

  providers: [
    AuthGuard,
    EnvironmentGuard,
    AdminAuthGuard,
    AuthorizationService,
    HomeResolver,
    PlatesResolver,
    PlateResolver,
    WinnersResolver,
    ProfileResolver,
    CharityResolver,
    ContactsResolver
  ],

  declarations: [
    HomePageComponent,
    PlatesPageComponent,
    PlatePageComponent,
    WinnersPageComponent,
    EmptyPageComponent,
    ProfilePageComponent,
    CharityChoicePageComponent,
    ContactsPageComponent,
    SearchPageComponent,

    AdminEntranceComponent,
    AdminGeneralComponent,
    AdminUsersComponent,
    AdminPlatesComponent,
    AdminRequestsComponent,
    AdminContactsComponent
  ],

  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],

  exports: [
    RouterModule
  ]
})

export class AppRoutingModule { }

const appRoutes: Routes = [
  {
    path: ROUTES.SELECT_ENV,
    component: HomePageComponent,
    data: {
      showHomeButton: false,
      label: 'Home'
    },
    resolve: {
      environments: HomeResolver
    }
  },
  {
    path: ROUTES.PLATES,
    component: PlatesPageComponent,
    canActivate: [EnvironmentGuard],
    data: {
      showHomeButton: false,
      label: 'Plates'
    },
    resolve: {
      plates: PlatesResolver
    }
  },
  {
    path: ROUTES.PLATE + '/:id',
    component: PlatePageComponent,
    data: {
      showHomeButton: true,
      label: 'Plate'
    },
    resolve: {
      plate: PlateResolver
    }
  },
  {
    path: ROUTES.WINNERS,
    component: WinnersPageComponent,
    data: {
      showHomeButton: true,
      label: 'Winners'
    },
    resolve: {
      winners: WinnersResolver
    }
  },
  {
    path: ROUTES.PROFILE + '/:id',
    component: ProfilePageComponent,
    data: {
      showHomeButton: true,
      label: 'Profile'
    },
    resolve: {
      profile: ProfileResolver
    }
  },
  {
    path: ROUTES.CHARITY_CHOICE,
    component: CharityChoicePageComponent,
    data: {
      showHomeButton: true,
      label: 'Charity Choice'
    },
    resolve: {
      charityItems: CharityResolver
    }
  },
  {
    path: ROUTES.CONTACTS,
    component: ContactsPageComponent,
    data: {
      showHomeButton: true,
      label: 'Contacts'
    },
    resolve: {
      contactsData: ContactsResolver
    }
  },
  {
    path: ROUTES.SEARCH,
    component: SearchPageComponent,
    canActivate: [EnvironmentGuard],
    data: {
      showHomeButton: true,
      label: 'Search'
    }
  },
  {
    path: ROUTES.EMPTY,
    component: EmptyPageComponent,
    data: {
      showHomeButton: true,
      label: 'empty'
    }
  },

  {
    path: ADMIN_ROUTES.ADMIN_ENTRANCE,
    component: AdminEntranceComponent,
    data: {
      isAdminRoute: true
    }
  },
  {
    path: ADMIN_ROUTES.MANAGE_GENERAL,
    component: AdminGeneralComponent,
    canActivate: [AdminAuthGuard],
    data: {
      isAdminRoute: true
    }
  },
  {
    path: ADMIN_ROUTES.MANAGE_USERS,
    component: AdminUsersComponent,
    canActivate: [AdminAuthGuard],
    data: {
      isAdminRoute: true
    }
  },
  {
    path: ADMIN_ROUTES.MANAGE_PLATES,
    component: AdminPlatesComponent,
    canActivate: [AdminAuthGuard],
    data: {
      isAdminRoute: true
    }
  },
  {
    path: ADMIN_ROUTES.MANAGE_REQUESTS,
    component: AdminRequestsComponent,
    canActivate: [AdminAuthGuard],
    data: {
      isAdminRoute: true
    }
  },
  {
    path: ADMIN_ROUTES.MANAGE_CONTACTS,
    component: AdminContactsComponent,
    canActivate: [AdminAuthGuard],
    data: {
      isAdminRoute: true
    }
  },

  {
    path: ROUTES.OTHERWISE,
    redirectTo: ROUTES.PLATES
  },
];

export const AppRouting = RouterModule.forRoot(appRoutes, {useHash: true});

