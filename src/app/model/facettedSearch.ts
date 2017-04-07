import {D3NodeInterface} from "./d3NodeInterface";
/**
 * Created by immanuelpelzer on 31.03.17.
 */
export interface FacettedSearch {
  parentNode : D3NodeInterface;
  filters : FCFilter[];
  doFilters();
  reloadChildren() : Promise<any[]>;
  getData() : any;
  activeFilters : boolean;
  namedFilters : any;
}

// TYPE FILTER
export interface FCFilter {
  title : string;
  dbName : string;
  loading : boolean;
  facettedSearch : FacettedSearch;
  message: string;
  getData() : any;
  isShowing() : boolean;
}

// String filter
export interface FCStringFilter extends FCFilter{
  value : string;
  execute();
}

// Size Filter
export interface FCSizeFilter extends FCFilter{
  options : FCSizeFilterOption[];
  didSelectIndex(index : number);
}

export interface FCSizeFilterOption {
  dbName : any;
  title : any;
}

// Type filter
export interface FCTypeFilter extends FCFilter{
  options : FCTypeFilterOption[] ;
  didSelectIndex(index : number);
}

export interface FCTypeFilterOption {
  name : string;
  value : boolean;
  type : string;
  comment : string;
  getBadgeValue() : string;
}

