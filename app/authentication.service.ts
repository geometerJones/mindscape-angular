import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { User } from './models/user';

@Injectable()
export class AuthenticationService {
  private registerUrl = 'api/register';
  private loginUrl = 'api/login';
  private verifyUrl ='api/verifytoken';

  loginSuccess: Observable<any>;
  private loginSuccessObserver: Observer<any>;

  constructor(private http: Http) {
    this.loginSuccess = new Observable((observer) => {
      this.loginSuccessObserver = observer;
    }).share() // is there a more direct way to output to app?
  }
  getToken() {
    return localStorage.getItem('token');
  }
  getUsername() {
    return localStorage.getItem('username');
  }
  register(username, password, email): Observable<any> {
    let headers = new Headers({'Content-Type': 'application/json'});
    let body = JSON.stringify({
      username: username,
      password: password,
      email: email
    });
    return this.http.post(this.registerUrl, body, {headers: headers})   
      .map((res) => {
        let data = res.json();
        //console.log('registered', data);
        if (data && data.token && data.username) {
          console.log('register', data);
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          this.loginSuccessObserver.next(data);
        }
        return data;
      })
      .catch(this.handleError);
  }
  login(username, password): Observable<any> {
    let headers = new Headers({'Content-Type': 'application/json'});
    let body = JSON.stringify({
      username: username,
      password: password
    });
    return this.http.post(this.loginUrl, body, {headers: headers})
      .map((res) => {
        let data = res.json();
        //console.log('loggedin', data);
        if (data && data.token && data.username) {
          console.log('login', data);
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          this.loginSuccessObserver.next(data);
        }
        return data;
      })
      .catch(this.handleError);
  }
  verifyToken(): Observable<any> {
    let token = this.getToken();
    let username = this.getUsername();
    if (token) {
      let headers = new Headers({
        'Content-Type': 'application/json',
        'token': token,
      });
      let body = JSON.stringify({
        username: username,
        message:'I have kept this token secret, kept it safe.'
      });

      return this.http.post(this.verifyUrl, body, {headers: headers})
        .map((res) => {
          let data = res.json();
          // console.log('verifiedtoken', data);
          if (data && data.token && data.username) {
            console.log('verifyToken', data);
            this.loginSuccessObserver.next(data);
            return data;
          }
          else {
            return Observable.throw('Something strange is afoot...');
          }
        })
        .catch(this.handleError);
    }
    else {
      return Observable.throw('insert token');
    }
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    // http request to nofify server of logout details?
  }
  private handleError(error: any) {
    let errMsg = (error.json().message) ? error.json().message :
      error.status ? `${error.status} - ${error.statusText}` : 'server error';
    return Observable.throw(errMsg);
  }
}
