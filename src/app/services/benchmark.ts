/**
 * Created by immanuelpelzer on 31.03.17.
 */
/**
 * Created by immanuelpelzer on 24.03.17.
 */
import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


@Injectable()
export class BenchmarkService {
  runs = {
    sql: null,
    sparql: null
  };
  timeout : any;
  timer : any;
  private baseUrl = 'http://localhost:8888';
  constructor(private http: Http) {
    let _dhis = this;
   this.timer = function(name, mode) {
      var start = performance.now();
      return {
        stop: function() {
          var end  = performance.now();
          var time = end - start;
          _dhis.addRun(BenchmarkTask[name], time, mode);
        }
      }
    };
  }

  public save() : Promise<any> {
    let url = this.baseUrl + "/saveBenchmark";
    console.log("QUERYING: " + url);
    // Prepare filter
    let payload = this.runs;

    let bodyString = JSON.stringify(payload);

    return this.http
      .post(url, bodyString)
      .map((res: Response) => {
        //console.log("success saving:", res)
        this.runs = {
          sql: {},
          sparql: {}
        }
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }

  public addRun(task : string, time : number, mode : string) {
    if ((this.runs[mode] == null)) {
      this.runs[mode] = {};
    }
    if (task in this.runs[mode]) {
      this.runs[mode][task].push(time);
    } else{
      this.runs[mode][task] = [];
      this.runs[mode][task].push(time);
    }

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.save().catch((err) => {
        console.log("rror", err);
      });
    }, 10000);

  }

}

export enum BenchmarkTask {
  GetClassWithFacettedSearch,
  GetClass,
  GetRoot,
  GetInformation,
  GetChildren,
  GetChildrenWithFacettedSearch
}
