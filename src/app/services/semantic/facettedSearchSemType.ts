import {FacettedSearch, FCFilter, FCTypeFilter, FCTypeFilterOption} from "../../model/facettedSearch";
import {D3NodeInterface} from "../../model/d3NodeInterface";
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
      fs.push(new FSTypeFilter(this.parentNode.children, this))
    }

    this.filters = fs;
  }

  public reloadChildren() : Promise<any[]> {
    return this.parentNode.loadChildrenWithFilter(this.filters);
  }

  getData(): any {
    let out = {};
    this.filters.forEach((item , index) => {
      out[item.dbName] = item.getData();
    });
    return out;
  }

}

const TYPEFILTER = "typeFilter";
export class FSTypeFilter implements FCTypeFilter {
  options: FCTypeFilterOption[] = [];
  title: string = "Auf Typ beschränken";
  dbName: string = TYPEFILTER; // DO NOT CHANGE
  loading: boolean = false;

  constructor(forChildren : D3NodeInterface[], public facettedSearch : FacettedSearch) {
    let addingMap = {};
    for (let child of forChildren) {
        if (child.typeOriginal() in addingMap) {
          addingMap[child.typeOriginal()].count++;
        } else {
          let c = new FSTypeFilterOption(child.type(), child.typeOriginal(), true);
          //console.log(c)
          addingMap[child.typeOriginal()] = c;
          this.options.push(c);
        }
    }
    if (this.options.length ==1 ) {
      this.options = [];
    }
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
