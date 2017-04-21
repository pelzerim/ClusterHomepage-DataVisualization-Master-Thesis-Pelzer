///<reference path="../../model/facettedSearch.ts"/>
import {
  FacettedSearch, FCFilter, FCTypeFilter, FCTypeFilterOption, FCStringFilter,
  FCSizeFilter, FCSizeFilterOption
} from "../../model/facettedSearch";
import {D3NodeInterface} from "../../model/d3NodeInterface";
import {SemD3Node} from "../../model/node";
/**
 * Created by immanuelpelzer on 31.03.17.
 */
export class FSFacettedSearch implements FacettedSearch {

  public activeFilters : boolean  = false;
  filters: FCFilter[];
  namedFilters : {} = {};
  constructor(public parentNode : D3NodeInterface) {

  }



  public doFilters() {
    let fs = [];
    // Type fiter
    if(this.parentNode.children) {

      // Size filter
      let sf = new FSSizeFilter(this)
      fs.push(sf);
      this.namedFilters[FILTERSIZE] = sf;

      // String filter
      let fsf = new FSStringFilter(this);
      fs.push(fsf);
      this.namedFilters[FILTERSTRING] = fsf;

      // type filter
      let tf = new FSTypeFilter(this.parentNode.children, this);
      fs.push(tf);
      this.namedFilters[TYPEFILTER] = tf;

      // Predicate filter
      tf = new FSPredicateFilter(this.parentNode.children, this);
      fs.push(tf);
      this.namedFilters[PREDICATEFILTER] = tf;

    }

    this.filters = fs;
  }

  public reloadChildren() : Promise<any[]> {
    return this.parentNode.loadChildrenWithFilter(this.filters);
  }

  getData(): any {
    let out = {};
    this.filters.forEach((item , index) => {
      let data = item.getData();
      if (data) out[item.dbName] = data;
    });
    return out;
  }

}

const FILTERSIZE = "sizeFilter";
export class FSSizeFilter implements FCSizeFilter {
  options: FCSizeFilterOption[] = [];


  message: string = "";

  isShowing(): boolean {
    return true;
  }

  value: string = "";
  title: string = "Size of circles by";
  dbName: string = FILTERSIZE;
  loading: boolean = false;

  constructor(public facettedSearch : FacettedSearch) {
    let a = new FSSizeFilterOption("Count of content", "children");
    //this.value = a.dbName;
    this.options.push(a);
    this.options.push(new FSSizeFilterOption("None", "none"));
  }

  getData(): any {
    if (this.value) {
      return { value: this.value };
    } else {
      return null;
    }
  }

  didSelectIndex(index: number) {
    this.value = this.options[index].dbName;
    this.loading = true;
    this.facettedSearch.activeFilters = true;
    return this.facettedSearch.reloadChildren().then((children) => {
      this.loading = false;
      this.message = children.length ? "" : "No results.";
      return children;
    });
  }
}

export class FSSizeFilterOption implements FCSizeFilterOption {
  constructor(public title : string, public dbName : string){

  }
}

const FILTERSTRING = "stringFilter";
export class FSStringFilter implements FCStringFilter {
  message: string = "";

  isShowing(): boolean {
    return true;
  }

  value: string = "";
  title: string = "Text Filter";
  dbName: string = FILTERSTRING;
  loading: boolean = false;

  constructor(public facettedSearch : FacettedSearch) {
  }

  getData(): any {
    if (this.value) {
      return { value: this.value };
    } else {
      return null;
    }
  }

  execute() {
    this.loading = true;
    this.facettedSearch.activeFilters = true;
    return this.facettedSearch.reloadChildren().then((children) => {
      this.loading = false;
      this.message = children.length ? "" : "No results.";
      return children;
    });
  }

}



const TYPEFILTER = "typeFilter";
export class FSTypeFilter implements FCTypeFilter {
  message: string = "";

  options: FCTypeFilterOption[] = [];
  title: string = "Restrict to types";
  dbName: string = TYPEFILTER; // DO NOT CHANGE
  loading: boolean = false;
  _isShowing : boolean = false;
  private hasBeenUsed = false;

  isShowing(): boolean {
    return this._isShowing;
  }

  constructor(forChildren : D3NodeInterface[], public facettedSearch : FacettedSearch) {
    if (!forChildren && !facettedSearch) return;
    let addingMap = {};
    for (let child of forChildren) {
        let semNode = child as D3NodeInterface;
        if (semNode.typeInDB() in addingMap) {
          addingMap[semNode.typeInDB()].count++;
        } else {
          let c = new FSTypeFilterOption(semNode.type(), semNode.typeInDB(), false);
          //console.log(c)
          c.comment = semNode.comment();
          addingMap[semNode.typeInDB()] = c;
          this.options.push(c);
        }
    }
    this._isShowing = this.options.length > 1;
  }

  didSelectIndex(index: number) : Promise<any[]>  {
    this.loading = true;
    this.hasBeenUsed = true;
    this.facettedSearch.activeFilters = true;
    this.options[index].value = !this.options[index].value;
    //console.log(this.options[index].value);
    return this.facettedSearch.reloadChildren().then((children) => {
      this.loading = false;
      return children;
    });
  }

  getData(): [{type: string; value: boolean}] {
    if (!this.hasBeenUsed) return null;
    let data : any = [];
    let anySelections = false;
    for (let o of this.options) {
      data.push({
        type : o.type,
        value : o.value
      });
      if (o.value == true) anySelections = true;
    }
    return anySelections ? data : null;
  }
}

const PREDICATEFILTER = "predicateFilter";
export class FSPredicateFilter extends FSTypeFilter {
  title: string = "Restrict to relationships";
  constructor(forChildren : D3NodeInterface[], public facettedSearch : FacettedSearch) {
    super(null, null);
    this.dbName =  PREDICATEFILTER;
    let addingMap = {};
    for (let child of forChildren) {
      if (child instanceof SemD3Node) {
        let semNode = child as SemD3Node;
        if (semNode.predicateConnectingParentToThisURI) {
          let val = semNode.predicateConnectingParentToThisURI.getValue();
          if (val in addingMap) {
            addingMap[val].count++;
          } else {

            let c = new FSTypeFilterOption(semNode.predicateConnectingParentToThisURI.valueLabel, semNode.predicateConnectingParentToThisURI.getValue(), false);
            console.log(c)
            //c.comment = semNode.comment();
            addingMap[val] = c;
            this.options.push(c);
          }
        }

      }

    }
    console.log(this.options);
    this._isShowing = this.options.length > 1;
  }

}


export class FSTypeFilterOption implements FCTypeFilterOption {
  comment: string;
  public count = 1;
  constructor(public name : string, public type : string, public value : boolean) {
  }

  getBadgeValue(): string {
    return this.count + "";
  }

}
