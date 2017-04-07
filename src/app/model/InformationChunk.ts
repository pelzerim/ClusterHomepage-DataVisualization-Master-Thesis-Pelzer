/**
 * Created by immanuelpelzer on 19.03.17.
 */
export class InformationChunk {
  isCollapsed = false;
  isURL = false;
  constructor(protected _name : string, protected _content: string) {

  }
  public name() {
    return this._name;
  }
  public content() {
    return this._content;
  }

  public contentShort() {
    return this._content.length > 100 ? this._content.substr(0,99) + "..." : this._content;
  }



}

export class SemanticInformationChunk extends InformationChunk{
  constructor(public predicate : SemData, public object : SemData) {
    super(predicate.getValueFormatted(), object.getValue());
  }
  public setPredicateLabel(label : string) {
    this._name = label;
  }
}

export class SemData {
  public type : string;
  public typeLabel : string;

  public value : string;
  public valueLabel : string;
  public datatype : string; // Of value

  constructor(private input : any) {
    if (input) {
      this.type = "type" in input ? input.type : null ;
      this.value ="value" in input ?  input.value : "no value given";
      this.datatype ="datatype" in input ? input.datatype : null;
    }

  }
  public getValue() {
    return this.value;
  }

  public getValueFormatted() {
    if (this.typeLabel) return this.typeLabel;
    let spl =  this.value.split("/");
    if (spl.length > 0) {
      let last = spl[spl.length -1];
      if (last.indexOf("#") != -1) {
        let htslp = last.split("#");
        return htslp[htslp.length -1];
      } else {
        return last;
      }
    }
  }
}


export class SemDataURI extends SemData {
  public comment : string;
  constructor(uri : string) {
    super({
        type: "uri",
        value : uri
      });
  }
  public getValue() {
    return this.value;
  }
}
