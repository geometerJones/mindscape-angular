//import { Note } from './note';

export class User {
  id: string;
  presented: number;
  presentedby: number;
  // lastmodifiedby: number; //?
  //lastmodified: number //?

  username: string;
  text: string;

  // for display;
  x: number;
  y: number;
  fixed: boolean;
  width: number;
  height: number;

  noteWidth: number;
  viewWidth: number;
  noteAutosize: boolean;
}