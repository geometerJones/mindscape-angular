import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from './authentication.service';
import { NotationService } from './notation.service';

import { CommunityComponent } from './community.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { NotationComponent } from './notation.component';
import { NoteComponent } from './note.component';

import './rxjs-operators';

@Component({
  selector: 'my-app',
  template: `
    <div id="site-header">
      <div class="header-logo">mindscape.io</div>
      <div *ngIf="!username" class="header-content">
        <a routerLink="/community">community</a>
        <a routerLink="/register">register</a>
        <a routerLink="/login">login</a>
      </div>
      <div *ngIf="username" class="header-content">
        <span>{{username}}</span>
        <a routerLink="/community">community</a>
        <a routerLink="/notation">notation</a>
        <a routerLink="/community" (click)="logout()">logout</a>
      </div>
      <div class="clear"></div>
    </div>
    <div id="site-content">
      <router-outlet></router-outlet>
    </div>
  `,
  providers: [
    AuthenticationService,
    NotationService
  ]
})
export class AppComponent implements OnInit {

  private username;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) { }

  ngOnInit() {
    // handle loginSuccess produced by authenticationService register, login, verifytoken 
    this.authenticationService.loginSuccess.subscribe(
      (data)  => { this.login(data) },
      (error) => { console.error(error); });

    this.authenticationService.verifyToken().subscribe(  // attempt to log in using token
      (data) => {
        // login is handled by loginSuccess observer
        //console.log('app verifiedtoken', data);
      },
      (error) => { 
        console.error(error);
        this.router.navigate(['Home']);
      }
    );
  }

  login(data) {
    // token is stored by authenticationService
    if (data && data.token && data.username) {
      this.username = data.username;

      // TODO check whether mobile or pc
      this.router.navigate(['Notation']);
    }
    else {
      console.error('loginSuccess error', data);
    }
  }
  logout() {
    this.username = null;
    this.authenticationService.logout();
    this.router.navigate(['/community']);
  }
};
