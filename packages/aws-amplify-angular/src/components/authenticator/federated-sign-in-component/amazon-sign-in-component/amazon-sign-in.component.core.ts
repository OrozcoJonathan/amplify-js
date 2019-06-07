// tslint:disable
/*
 * Copyright 2017-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
// tslint:enable

import { Component, Input, OnInit  } from '@angular/core';
import { AmplifyService } from '../../../../providers';
import { constants, setLocalStorage } from '../../common'
import * as AmplifyUI from '@aws-amplify/ui';

const template = `
  <button id={{amplifyUI.amazonSignInButton}} class={{amplifyUI.signInButton}} variant="amazonSignInButton" (click)="onSignIn()">
    <span class={{amplifyUI.signInButtonIcon}}>
      <svg viewBox='0 0 248 268' xmlns='http://www.w3.org/2000/svg'><g id='Artboard-Copy-2' fill='none' fill-rule='evenodd'><path d='M139.056521,147.024612 C133.548808,156.744524 124.782731,162.726926 115.087401,162.726926 C101.790721,162.726926 93.9937779,152.612964 93.9937779,137.68681 C93.9937779,108.224571 120.447551,102.879017 145.533369,102.879017 L145.533369,110.365976 C145.533369,123.831358 145.876354,135.063787 139.056521,147.024612 M207.206992,162.579655 C209.400505,165.692256 209.887066,169.437725 207.063416,171.770186 C199.996315,177.653081 187.429476,188.590967 180.513926,194.716661 L180.46208,194.621133 C178.176838,196.663031 174.862638,196.810303 172.27828,195.445057 C160.780281,185.9162 158.686473,181.494078 152.405048,172.403055 C133.405233,191.751331 119.909143,197.534719 95.309886,197.534719 C66.1281801,197.534719 43.4791563,179.599451 43.4791563,143.669212 C43.4791563,115.616003 58.6782107,96.5105248 80.4019706,87.1727225 C99.2063636,78.9096034 125.464714,77.4528107 145.533369,75.1641337 L145.533369,70.694248 C145.533369,62.4749122 146.167493,52.7510201 141.297893,45.6541312 C137.110277,39.2856386 129.018206,36.6586354 121.859376,36.6586354 C108.658413,36.6586354 96.9171331,43.4171982 94.0416364,57.4199213 C93.4593582,60.532522 91.1701278,63.5933787 88.003492,63.7406501 L54.4387473,60.1424518 C51.6150972,59.5095829 48.4484614,57.2248862 49.2740201,52.8982915 C56.9712583,12.2553679 93.7983558,0 126.732964,0 C143.587124,0 165.606011,4.47386604 178.902691,17.2148315 C195.760839,32.917146 194.149604,53.8694866 194.149604,76.6726704 L194.149604,130.542157 C194.149604,146.734049 200.87372,153.830938 207.206992,162.579655 Z M233.826346,208.038962 C230.467669,203.683255 211.550709,205.9821 203.056405,206.998432 C200.470662,207.321077 200.076227,205.042397 202.406981,203.404973 C217.475208,192.664928 242.201125,195.766353 245.081698,199.363845 C247.966255,202.981502 244.336653,228.071183 230.172839,240.049379 C228.001452,241.888455 225.929671,240.904388 226.89783,238.468418 C230.077218,230.430525 237.204944,212.418868 233.826346,208.038962 Z M126.768855,264 C74.0234043,264 42.0764048,241.955028 17.7852554,217.541992 C12.9733903,212.705982 6.71799208,206.295994 3.31151296,200.690918 C1.90227474,198.372135 5.59096074,195.021875 8.0442063,196.84375 C38.2390146,219.267578 82.1011654,239.538304 125.529506,239.538304 C154.819967,239.538304 191.046475,227.469543 220.66851,214.867659 C225.146771,212.966167 225.146771,219.180222 224.511585,221.060516 C224.183264,222.03242 209.514625,236.221149 189.247207,247.047411 C170.304273,257.166172 146.397132,264 126.768855,264 Z' id='Fill-6' fill='#FFF' /></g></svg>
    </span>
    <span class={{amplifyUI.signInButtonContent}} style="color: var(--color-white);">
        Sign In with Amazon
    </span>
  </button>
`

@Component({
  selector: 'amplify-auth-amazon-sign-in-core',
  template
})
export class AmazonSignInComponentCore implements OnInit  {
  @Input() amazonClientId: string;
  protected logger: any;
  amplifyUI: any;

  constructor(protected amplifyService: AmplifyService) {
    this.logger = this.amplifyService.logger('AmazonSignInComponent', 'INFO');
    this.amplifyUI = AmplifyUI;
  }

  ngOnInit() {
    if (!this.amplifyService.auth() || 
      typeof this.amplifyService.auth().federatedSignIn !== 'function' || 
      typeof this.amplifyService.auth().currentAuthenticatedUser !== 'function') {
      this.logger.warn('No Auth module found, please ensure @aws-amplify/auth is imported');
    }

    if (this.amazonClientId && !(<any>window).amazon) {
      this.createScript();
    }
  }

  async onSignIn() { 
    try {
      const response: any = await this.amazonAuthorize()
      console.log(response)

      const payload = { provider: constants.AMAZON };
      setLocalStorage(constants.AUTH_SOURCE_KEY, payload, this.logger);

      const { access_token, expires_in } = response;
      const date = new Date();
      const expires_at = expires_in * 1000 + date.getTime();
      if (!access_token) {
          return;
      }

      const userInfo: any = await this.amazonRetrieveProfile()
      const amazonUser = { name: userInfo.profile.Name };

      await this.amplifyService.auth().federatedSignIn('amazon', {
        token: access_token,
        expires_at
      }, amazonUser);
      this.logger.debug(`Signed in with federated identity: ${constants.AMAZON}`);

      const user = await this.amplifyService.auth().currentAuthenticatedUser();
      this.amplifyService.setAuthState({ state: 'signedIn', user: user });
    } catch (error) {
      this.logger.error(error)
    }    
  }

  initAmazon() {
    const amz = (<any>window).amazon;
    this.logger.debug('init amazon');
    amz.Login.setClientId(this.amazonClientId);
  }

  amazonAuthorize() {
    const amz = (<any>window).amazon;
    const options = { scope: 'profile' };
    return new Promise((resolve, reject) => {
      amz.Login.authorize(options, (response: any) => {
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response)
        }
      })
    })
  }

  amazonRetrieveProfile() {
    const amz = (<any>window).amazon;
    return new Promise((resolve, reject) => {
      amz.Login.retrieveProfile(response => {
        if (!response.success) {
          reject('Get user Info failed')
        } else {
          resolve(response)
        }
      })
    })
  }
 
  createScript() {
    const script = document.createElement('script');
    script.src = 'https://api-cdn.amazon.com/sdk/login1.js';
    script.async = true;
    script.onload = this.initAmazon.bind(this);
    document.body.appendChild(script);
  }
}