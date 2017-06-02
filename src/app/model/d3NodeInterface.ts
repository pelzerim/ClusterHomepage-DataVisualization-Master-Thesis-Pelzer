import {FCFilter, FacettedSearch} from "./facettedSearch";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export interface D3NodeInterface {
  name : string;
  children : any[]
  size : number;
  didLoadChildren : boolean;
  timer : any;
  stopTimer();
  isInFocus : boolean;
  facettedSearch  : FacettedSearch;

  type() : string;
  typeInDB() : string;

  loadChildren(): Promise<any[]>;
  loadChildrenWithFilter(filter : FCFilter[]): Promise<any[]>;
  loadInformation() : Promise<any[]>;
  color() : string; // should return css
  id():string;
  nameShort():string;
  comment() : string;

  tooltip() : string;
}
