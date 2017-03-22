/**
 * Created by immanuelpelzer on 19.03.17.
 */
export class InformationChunk {
  constructor(private _name : string, private _content: string) {}
  public name() {
    return this._name;
  }
  public content() {
    return this._content;
  }
}
