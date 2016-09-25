"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var http_1 = require('@angular/http');
var Observable_1 = require('rxjs/Observable');
var AuthenticationService = (function () {
    function AuthenticationService(http) {
        var _this = this;
        this.http = http;
        this.registerUrl = 'api/register';
        this.loginUrl = 'api/login';
        this.verifyUrl = 'api/verifytoken';
        this.loginSuccess = new Observable_1.Observable(function (observer) {
            _this.loginSuccessObserver = observer;
        }).share(); // is there a more direct way to output to app?
    }
    AuthenticationService.prototype.getToken = function () {
        return localStorage.getItem('token');
    };
    AuthenticationService.prototype.getUsername = function () {
        return localStorage.getItem('username');
    };
    AuthenticationService.prototype.register = function (username, password, email) {
        var _this = this;
        var headers = new http_1.Headers({ 'Content-Type': 'application/json' });
        var body = JSON.stringify({
            username: username,
            password: password,
            email: email
        });
        return this.http.post(this.registerUrl, body, { headers: headers })
            .map(function (res) {
            var data = res.json();
            //console.log('registered', data);
            if (data && data.token && data.username) {
                console.log('register', data);
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                _this.loginSuccessObserver.next(data);
            }
            return data;
        })
            .catch(this.handleError);
    };
    AuthenticationService.prototype.login = function (username, password) {
        var _this = this;
        var headers = new http_1.Headers({ 'Content-Type': 'application/json' });
        var body = JSON.stringify({
            username: username,
            password: password
        });
        return this.http.post(this.loginUrl, body, { headers: headers })
            .map(function (res) {
            var data = res.json();
            //console.log('loggedin', data);
            if (data && data.token && data.username) {
                console.log('login', data);
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                _this.loginSuccessObserver.next(data);
            }
            return data;
        })
            .catch(this.handleError);
    };
    AuthenticationService.prototype.verifyToken = function () {
        var _this = this;
        var token = this.getToken();
        var username = this.getUsername();
        if (token) {
            var headers = new http_1.Headers({
                'Content-Type': 'application/json',
                'token': token,
            });
            var body = JSON.stringify({
                username: username,
                message: 'I have kept this token secret, kept it safe.'
            });
            return this.http.post(this.verifyUrl, body, { headers: headers })
                .map(function (res) {
                var data = res.json();
                // console.log('verifiedtoken', data);
                if (data && data.token && data.username) {
                    console.log('verifyToken', data);
                    _this.loginSuccessObserver.next(data);
                    return data;
                }
                else {
                    return Observable_1.Observable.throw('Something strange is afoot...');
                }
            })
                .catch(this.handleError);
        }
        else {
            return Observable_1.Observable.throw('insert token');
        }
    };
    AuthenticationService.prototype.logout = function () {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        // http request to nofify server of logout details?
    };
    AuthenticationService.prototype.handleError = function (error) {
        var errMsg = (error.json().message) ? error.json().message :
            error.status ? error.status + " - " + error.statusText : 'server error';
        return Observable_1.Observable.throw(errMsg);
    };
    AuthenticationService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http])
    ], AuthenticationService);
    return AuthenticationService;
}());
exports.AuthenticationService = AuthenticationService;
//# sourceMappingURL=authentication.service.js.map