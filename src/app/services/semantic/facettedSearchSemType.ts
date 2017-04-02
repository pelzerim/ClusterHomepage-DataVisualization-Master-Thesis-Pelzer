import {FacettedSearch, FCFilter, FCTypeFilter, FCTypeFilterOption, FCStringFilter} from "../../model/facettedSearch";
import {D3NodeInterface} from "../../model/d3NodeInterface";
import {SemD3Node} from "../../model/node";
/**
 * Created by immanuelpelzer on 31.03.17.
 */
export class FSFacettedSearch implements FacettedSearch {

  filters: FCFilter[];

  constructor(public parentNode : D3NodeInterface) {

  }

  public doFilters() {
    let fs = [];
    // Type fiter
    if(this.parentNode.children) {
      // type filter
      fs.push(new FSTypeFilter(this.parentNode.children, this))
      // String filter
      fs.push(new FSStringFilter(this));
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

const FILTERSTRING = "stringFilter";

export class FSStringFilter implements FCStringFilter {
  message: string = "";
  isShowing(): boolean {
    return true;
  }

  value: string = "";
  title: string = "Filter names";
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
  title: string = "Restrict types";
  dbName: string = TYPEFILTER; // DO NOT CHANGE
  loading: boolean = false;
  _isShowing : boolean = false;


  isShowing(): boolean {
    return this._isShowing;
  }

  constructor(forChildren : D3NodeInterface[], public facettedSearch : FacettedSearch) {
    let addingMap = {};
    for (let child of forChildren) {
        let semNode = child as D3NodeInterface;
        if (semNode.typeInDB() in addingMap) {
          addingMap[semNode.typeInDB()].count++;
        } else {
          let c = new FSTypeFilterOption(semNode.type(), semNode.typeInDB(), true);
          //console.log(c)
          addingMap[semNode.typeInDB()] = c;
          this.options.push(c);
        }
    }
      this._isShowing = this.options.length > 1;
  }

  didSelectIndex(index: number) : Promise<any[]>  {
    this.loading = true;
    this.options[index].value = !this.options[index].value;
    //console.log(this.options[index].value);
    return this.facettedSearch.reloadChildren().then((children) => {
      this.loading = false;
      return children;
    });
  }

  getData(): [{type: string; value: boolean}] {
    let data : any = [];
    for (let o of this.options) {
      data.push({
        type : o.type,
        value : o.value
      })
    }
    return data;
  }

}

export class FSTypeFilterOption implements FCTypeFilterOption {
  public count = 1;
  constructor(public name : string, public type : string, public value : boolean) {
  }

  getBadgeValue(): string {
    return this.count + "";
  }

}
