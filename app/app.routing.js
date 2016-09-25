"use strict";
var router_1 = require('@angular/router');
var community_component_1 = require('./community.component');
var register_component_1 = require('./register.component');
var login_component_1 = require('./login.component');
var notation_component_1 = require('./notation.component');
// navigate directly to a note
//import { NoteDetailComponent } from './note-detail.component';
var appRoutes = [
    {
        path: '',
        redirectTo: '/community',
        pathMatch: 'full'
    },
    {
        path: 'community',
        component: community_component_1.CommunityComponent
    },
    {
        path: 'register',
        component: register_component_1.RegisterComponent
    },
    {
        path: 'login',
        component: login_component_1.LoginComponent
    },
    {
        path: 'notation',
        component: notation_component_1.NotationComponent
    },
];
exports.routing = router_1.RouterModule.forRoot(appRoutes);
//# sourceMappingURL=app.routing.js.map