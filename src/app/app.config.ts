import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthServiceConfig, GoogleLoginProvider, FacebookLoginProvider } from 'angular5-social-login';

@Injectable()
export class AppConfig {

  private authConfig: Object = null;

  private authConfigNames: Object = null;

  constructor (
    private httpClient: HttpClient
  ) {
    this.authConfigNames = {
      FB: FacebookLoginProvider.PROVIDER_ID,
      GP: GoogleLoginProvider.PROVIDER_ID
    };
  }

  public getAuthConfig (key = null) {
    return key ? this.authConfig[key] : this.authConfig;
  }

  public getAuthConfigNames (key = null) {
    return key ? this.authConfigNames[key] : this.authConfigNames;
  }

  public load() {
    let
      self = this,
      httpClient = self.httpClient;

    return new Promise( (resolve, reject) => httpClient.get('get-auth-credentials')
      .subscribe(
        (res) => {

          let authConfigNames = self.getAuthConfigNames();

          self.authConfig = new AuthServiceConfig([
            { id: authConfigNames.FB, provider: new FacebookLoginProvider(res['FB']) },
            { id: authConfigNames.GP, provider: new GoogleLoginProvider(res['GP']) }
          ]);

          resolve(self.getAuthConfig());
        },
        (err) => reject(err)
      )
    );
  }
}
