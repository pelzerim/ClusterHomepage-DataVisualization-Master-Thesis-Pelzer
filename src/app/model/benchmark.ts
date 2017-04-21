import {Http, Headers, Response} from "@angular/http";
import {Observable} from 'rxjs/Rx';

/**
 * Created by immanuelpelzer on 14.04.17.
 */
export class Benchmark {
  public running = true;
  currentTask: BenchmarkTask;
  oldTasks: BenchmarkTask[] = [];
  public userId: string = "99999";
  public didEnterId = false;

  constructor(public type: string, private http : Http) {
    this.currentTask = new BenchmarkTask(1, this.userId, this.type, this.http);

  }

  public update() {
    this.currentTask.userId = this.userId;
  }

  public nextTask(compl : boolean) {
    let oldTask = this.currentTask;
    oldTask.stop(compl);
    this.oldTasks.push(oldTask);
    this.currentTask = new BenchmarkTask(oldTask.number+1, this.userId, this.type, this.http)
  }
}


export class BenchmarkTask {
  public countClicks: number;
  public countZoom: number;
  public countTotal: number;
  public startTime: Date;
  public time: number;
  public completed: boolean = false;

  public running: boolean = false;
  public userId : string;
  constructor(public number: number, public id: string, public type: string, private http : Http) {
    this.userId = id;
    this.countClicks = 0;
    this.countZoom = 0;
    this.countTotal = 0;
  }

  public start() {
    this.startTime = new Date();
    this.running = true;
  }

  public stop(completed: boolean) {
    this.completed = completed;
    this.running = false;
    this.time = new Date().getTime() - this.startTime.getTime();
    this.sendBenchmark()
  }

  public addClick() {
    if (this.running) {
      this.countClicks++;
      this.countTotal++;
    }
  }

  public addZoom() {
    if (this.running) {
      this.countZoom++;
      this.countTotal++;
    }
  }

  public toJson() {
    return {
      userId : this.userId,
      clicks: this.countClicks,
      zooms: this.countZoom,
      total: this.countTotal,
      time: this.time,
      completed: this.completed,
      date: new Date().toISOString()
    }
  }

  public sendBenchmark() {
    // tasknuber, userid type
    console.log("saving ", this.toJson());

    return this.http
      .post("http://localhost:8888/saveCSV/" + this.number + "/" + this.userId + "/" + this.type, this.toJson())
      .map((res: Response) => {
          console.log(res);
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();

  }
}
