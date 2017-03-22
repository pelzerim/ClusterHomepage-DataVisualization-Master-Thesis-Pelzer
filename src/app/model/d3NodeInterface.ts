/**
 * Created by immanuelpelzer on 08.03.17.
 */
export interface D3NodeInterface {
  name : string;
  children : any[]
  size : number;
  didLoadChildren : boolean;
  isInFocus : boolean;

  loadChildren(): Promise<any[]>;
  loadInformation() : Promise<any[]>;
  color() : string; // should return css
  id():string;
  nameShort():string;
}
