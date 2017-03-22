import {D3NodeInterface} from "../model/d3NodeInterface";
/**
 * Created by immanuelpelzer on 19.03.17.
 */
export interface D3DataService {
  getRoot(): Promise<D3NodeInterface>;
  currentFocusPath : D3NodeInterface[];
  currentSelectedData : D3NodeInterface;
}
