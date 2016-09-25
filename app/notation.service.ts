import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs';

import { Node } from './models/node';
import { Relationship } from './models/relationship';
import { Relation } from './models/relation';
import { Note } from './models/note';
import { Link } from './models/link';

import { AuthenticationService } from './authentication.service';

@Injectable()
export class NotationService {
  private notationUrl = 'api/notation'; // used to get notes
  private selectionUrl = 'api/selection';
  private noteUrl = '/api/note'; // used to post/put/delete note
  private nodeUrl = '/api/node';
  private relationUrl = '/api/relation';
  private relationshipUrl = '/api/relationship';
  private token;

  constructor(private http: Http, 
    private authenticationService: AuthenticationService) {
  }
  getNotation(): Observable<any> {
    // uses token in headers to
    // return {notation_id: number, notes: note[]} notation object
    let headers = this.headers();
    return this.http.get(this.notationUrl, {headers: headers})
      .map((res) => {
        let notation = res.json();
        console.log('notation0', notation);
        if (
          !(notation && notation.notes && notation.settings &&
          notation.settings.root_id && notation.settings.frame_id && notation.settings.current_id && 
          notation.settings.width && notation.settings.height)
        ) { console.error('notation invalid', notation); }

        notation.notes_by_id = {};
        notation.links = [];

        notation.notes.forEach((note_data, i, notes) => {
          let note = new Note(note_data, notation.settings);
          notation.notes_by_id[note.node.id] = note;
          notes[i] = note;

          note.relations.forEach((relation) => {
            let target = notation.notes_by_id[relation.target_id];
            if (target) {
              // both source and target notes are loaded
              // every pair of loaded notes will have one link for each type of relationship they share
              // relationships in a relation are grouped by type into 'modes'
              let links = Link.getLinks(note, target);
              [].push.apply(notation.links, links);
            }
          });
        });

        console.log('notation', notation);
        return notation;
      })
      .catch(this.handleError);
  }
  postSelection(params): Observable<any> {
    let headers = this.headers();
    let body = JSON.stringify({
      target_id: params.target_id,
      frame: params.frame,
      current: params.current,
      x: params.x,
      y: params.y,
      z: params.z
    });
    return this.http.post(this.selectionUrl, body, {headers: headers})
      .map((res) => {
        console.log('select note',res.json());
        return res.json();
      })
      .catch(this.handleError);
  }
  postNote(params): Observable<Note> {
    let headers = this.headers();
    let body = JSON.stringify({
      secret: params.secret,
      x: params.x - params.settings.width / 2,
      y: params.settings.height / 2 - params.y,
      z: 0,
      fixed: false,
      showMeasurement: true,
      showParagraph: true,
      showDefinitions: false,
      showPresentations: false,
      showEquations: false,
      present: params.present,
      equate: params.equate
    });
    return this.http.post(this.noteUrl, body, {headers: headers})
      .map((res) => {
        let note_data = res.json();
        console.log('post note', note_data);

        let note = new Note(note_data, params.settings);
        return note;
       })
      .catch(this.handleError);
  }
  deleteNote(note: Note): Observable<any> {
    let url = `${this.noteUrl}/${note.node.id}`;
    let headers = this.headers();

    return this.http.delete(url, headers)
      .map((res) => {
        console.log('delete note', res.json());
        return res.json();
      })
      .catch(this.handleError);
  }
  putNode(node: Node, ignoreText: boolean): Observable<Node> {
    let url = `${this.nodeUrl}/${node.id}`;
    let headers = this.headers();
    let body;
    if (ignoreText) {
      let clone = new Node(node);
      clone.name = null;
      clone.theme = null;
      clone.meta = null;
      body = JSON.stringify(clone);
    }
    else {
      body = JSON.stringify(node);
    }
    return this.http.put(url, body, {headers: headers})
      .map((res) => {
        console.log('put node', res.json());
        return res.json();
      })
      .catch(this.handleError);
  }
  postRelationship(relationship: Relationship): Observable<Relationship> {
    let body = JSON.stringify(relationship);
    let headers = this.headers();
    return this.http.post(this.relationshipUrl, body, {headers: headers})
      .map(res => {
        let relationship = new Relationship(res.json());
        console.log(relationship);
        return relationship;
      })
      .catch(this.handleError);
  }
  deleteRelationship(relationship: Relationship): Observable<any> {
    let url = `${this.relationshipUrl}/${relationship.id}`;
    let headers = this.headers();
    return this.http.delete(url, {headers: headers})
      .map(res => {
        let result = res.json();
        console.log(result);
        return result;
      })
      .catch(this.handleError);
  }
  clone(obj) {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;
    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = this.clone(obj[i]);
        }
        return copy;
    }
    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
        }
        return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  private handleError(error: any) {
    let errMsg = (error.json() && error.json().message) ? error.json().message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    return Observable.throw(errMsg);
  } 
  private headers() {
    let headers = new Headers({
      'Content-Type': 'application/json',
      'token': this.authenticationService.getToken()
    });
    return headers;
  }
}
