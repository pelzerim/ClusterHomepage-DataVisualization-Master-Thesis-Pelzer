import {Component, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {DataRelService} from "../../services/relational/data-rel.service";
import {D3DataService} from "../../services/dataServiceInterface";
import {CirclesComponent} from "../vis/circles/circles.component";
import {D3NodeInterface} from "../../model/d3NodeInterface";
import {DataSemService} from "../../services/semantic/data-sem";
import {Benchmark} from "../../model/benchmark";
import {Http, Headers} from "@angular/http";

//import {Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('circles') private ciclesContainer: CirclesComponent;
  private maxLenghtOfBreadcrumbs = 3;
  private data: D3DataService;
  private bgOfSidebar: string;

  public heightOfSidebar = "200px";

  /// Benchmark
  public benchmark : Benchmark;

  constructor(private relData: DataRelService, private semData : DataSemService, private http: Http) {
    // SETTINGS
    this.data = this.semData;
     //this.data = this.relData;


    this.bgOfSidebar = "white";
    this.benchmark = new Benchmark(this.data.name(), http);
  }

  ngAfterViewInit() {
    //console.log(this.ciclesContainer)
    //this.heightOfSidebar = this.ciclesContainer.height < 600 ? this.ciclesContainer.height + "px" : "600px";
    this.heightOfSidebar = this.ciclesContainer.height + "px";
    this.ciclesContainer.benchmark = this.benchmark;
  }

  last10Focuses(): D3NodeInterface[] {
    //if (this.data.currentFocusPath.length == 1) return this.data.currentFocusPath;
    return this.data.currentFocusPath.slice(Math.max(this.data.currentFocusPath.length - this.maxLenghtOfBreadcrumbs, 0))
  }

  focusNode(node, i) {
    this.ciclesContainer.focusNode(node, i);
  }

  didSelectFilter(filter, value) {
    console.log(value);
    this.ciclesContainer.didSelectFilter(filter, value);
  }


  ngOnInit() {

  }




}
