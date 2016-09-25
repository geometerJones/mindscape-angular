import { ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CommunityComponent }     from './community.component';
import { RegisterComponent }      from './register.component';
import { LoginComponent }         from './login.component';
import { NotationComponent }      from './notation.component';
// navigate directly to a note
//import { NoteDetailComponent } from './note-detail.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/community',
    pathMatch: 'full'
  },
  {
    path: 'community',
    component: CommunityComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'notation',
    component: NotationComponent
  },
  /*{
    path: 'note/:id',
    component: NoteDetailComponent
  },*/
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
