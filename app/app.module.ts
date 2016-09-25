import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { HttpModule }    from '@angular/http';

import { routing } from './app.routing';

import { AppComponent }  from './app.component';
import { NotationComponent } from './notation.component';
import { NoteComponent } from './note.component';
import { RelationComponent } from './relation.component';

import { AuthenticationService } from './authentication.service';
import { NotationService } from './notation.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    routing
  ],
  declarations: [
    AppComponent,
    NotationComponent,
    NoteComponent,
    RelationComponent
  ],
  providers: [
    AuthenticationService,
    NotationService
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
