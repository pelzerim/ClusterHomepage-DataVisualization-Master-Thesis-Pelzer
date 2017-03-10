/**
 * Created by immanuelpelzer on 08.03.17.
 */
export interface D3NodeInterface {
  name : string;
  children : any[]
  size : number;

  loadChildren(): Promise<any[]>;
}
