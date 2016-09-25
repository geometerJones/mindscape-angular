import { Component, OnInit } from '@angular/core';

import { AuthenticationService } from './authentication.service';

@Component({
  selector: 'my-login',
  template: `
    <div class='row'>
      <input [(ngModel)]="username" type="text" placeholder="username" />
    </div>
    <div class='row'>
      <input [(ngModel)]="password" type="password" placeholder="password" />
    </div>
    <div class='row'>
      <button (click)="login()" >Login</button>
    </div>
    <div *ngIf="error" class="row">
      {{error}}
    </div>
  `,
  styles: [`
    .row {
      padding: 2px;
    }
  `],
})
export class LoginComponent {
  private username;
  private password;
  private error;

  constructor(private authenticationService: AuthenticationService) { }

  login() {
    this.error = null;

    this.authenticationService.login(this.username, this.password).subscribe(
      (data) => {
        // login handled by authService, app.component
        // console.log('login', data);
      }, 
      (error) => { this.error = error; }
    );
  }
}
