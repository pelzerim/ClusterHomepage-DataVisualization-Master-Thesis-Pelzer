import {D3NodeInterface} from "../model/d3NodeInterface";
import {ColorMode} from "../model/colors";
/**
 * Created by immanuelpelzer on 19.03.17.
 */
export interface D3DataService {
  name() : string;
  colorMode() : ColorMode;
  getRoot(): Promise<D3NodeInterface>;
  currentFocusPath : D3NodeInterface[];
  currentSelectedData : D3NodeInterface;
}
