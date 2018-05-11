import { APP_INITIALIZER } from '@angular/core';
import { AppConfig } from './app.config';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRouting } from './app-routing.module';
import { AppRoutingModule } from './app-routing.module';
import { AppCommonModule } from './app-common.module';
import { AppComponent } from './app.component';
import { SocialLoginModule, AuthService, AuthServiceConfig, FacebookLoginProvider, GoogleLoginProvider } from 'angular5-social-login';
import { AccessPointService } from './services/access-point.service';
import { ConstantsService } from './services/constants.service';
import { AppD3Service } from './services/d3.service';
import { SharedService } from './services/shared.service';
import { EnvironmentService } from './services/environment.service';
import { PlatesService } from './services/plates.service';


let socialAuthConfig;

@NgModule({

  declarations: [
    AppComponent,
  ],

  exports: [],

  imports: [
    BrowserModule,
    AppRouting,
    AppRoutingModule,
    AppCommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SocialLoginModule
  ],

  providers: [
    AppConfig,
    ConstantsService,
    AppD3Service,
    SharedService,
    EnvironmentService,
    PlatesService,
    AccessPointService,
    {
      provide: APP_INITIALIZER,
      useFactory: (config: AppConfig) => () => config.load().then(loadedConfig => socialAuthConfig = loadedConfig),
      deps: [AppConfig],
      multi: true
    },
    {
      provide: AuthServiceConfig,
      useFactory: (config: AppConfig) => config.getAuthConfig(),
      deps: [AppConfig]
    }
  ],

  bootstrap: [
    AppComponent
  ]

})

export class AppModule { }

