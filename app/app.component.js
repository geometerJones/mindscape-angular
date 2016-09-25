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
var router_1 = require('@angular/router');
var authentication_service_1 = require('./authentication.service');
var notation_service_1 = require('./notation.service');
require('./rxjs-operators');
var AppComponent = (function () {
    function AppComponent(router, authenticationService) {
        this.router = router;
        this.authenticationService = authenticationService;
    }
    AppComponent.prototype.ngOnInit = function () {
        var _this = this;
        // handle loginSuccess produced by authenticationService register, login, verifytoken 
        this.authenticationService.loginSuccess.subscribe(function (data) { _this.login(data); }, function (error) { console.error(error); });
        this.authenticationService.verifyToken().subscribe(// attempt to log in using token
        function (data) {
            // login is handled by loginSuccess observer
            //console.log('app verifiedtoken', data);
        }, function (error) {
            console.error(error);
            _this.router.navigate(['Home']);
        });
    };
    AppComponent.prototype.login = function (data) {
        // token is stored by authenticationService
        if (data && data.token && data.username) {
            this.username = data.username;
            // TODO check whether mobile or pc
            this.router.navigate(['Notation']);
        }
        else {
            console.error('loginSuccess error', data);
        }
    };
    AppComponent.prototype.logout = function () {
        this.username = null;
        this.authenticationService.logout();
        this.router.navigate(['/community']);
    };
    AppComponent = __decorate([
        core_1.Component({
            selector: 'my-app',
            template: "\n    <div id=\"site-header\">\n      <div class=\"header-logo\">mindscape.io</div>\n      <div *ngIf=\"!username\" class=\"header-content\">\n        <a routerLink=\"/community\">community</a>\n        <a routerLink=\"/register\">register</a>\n        <a routerLink=\"/login\">login</a>\n      </div>\n      <div *ngIf=\"username\" class=\"header-content\">\n        <span>{{username}}</span>\n        <a routerLink=\"/community\">community</a>\n        <a routerLink=\"/notation\">notation</a>\n        <a routerLink=\"/community\" (click)=\"logout()\">logout</a>\n      </div>\n      <div class=\"clear\"></div>\n    </div>\n    <div id=\"site-content\">\n      <router-outlet></router-outlet>\n    </div>\n  ",
            providers: [
                authentication_service_1.AuthenticationService,
                notation_service_1.NotationService
            ]
        }), 
        __metadata('design:paramtypes', [router_1.Router, authentication_service_1.AuthenticationService])
    ], AppComponent);
    return AppComponent;
}());
exports.AppComponent = AppComponent;
;
//# sourceMappingURL=app.component.js.map