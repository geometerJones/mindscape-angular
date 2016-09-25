import { Component, OnInit } from '@angular/core';

import { AuthenticationService } from './authentication.service';

@Component({
  selector: 'my-signup',
  template: `
    <div class='row'>
      <input [(ngModel)]="username" type="text" placeholder="username" />
    </div>
    <div class='row'>
      <input [(ngModel)]="password1" type="password" placeholder="password" /> &nbsp; 
      <input [(ngModel)]="password2" type="password" placeholder="password (again)" />
    </div>
    <div class='row'>
      <input [(ngModel)]="email" type="text" placeholder="email (optional)" />
    </div>
    <div class='row'>
      <button (click)="register()" >register</button>
    </div>
    <div *ngIf="error" class='row'>
      {{error}}
    </div>
  `,
  styles: [`
    .row {
      padding: 2px;
    }
  `]
})
export class RegisterComponent {
  private username;
  private password1;
  private password2;
  private email;
  private error;

  constructor(private authenticationService: AuthenticationService) { }

  register() {
    if (this.password1 == this.password2) {
      this.error = null;

      this.authenticationService.register(this.username, this.password1, this.email).subscribe(
        (data) => {
          // login handled by authService and app.component
          // console.log('registered', data);
        }, 
        (error) => { this.error = error; }
      );
    }
    else {
      this.error = 'passwords differ';
    }
  }
}
