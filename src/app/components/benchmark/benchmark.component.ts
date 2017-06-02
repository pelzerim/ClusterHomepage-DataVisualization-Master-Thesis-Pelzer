import {Component, OnInit} from '@angular/core';
import {DataRelService} from "../../services/relational/data-rel.service";
import {DataSemService} from "../../services/semantic/data-sem";
import * as _ from "lodash";
import * as Benchmark from "benchmark";
import {SemD3Node, SemD3NodeType, RelD3Node} from "../../model/node";
import {SemDataURI} from "../../model/InformationChunk";
import {RelD3ConceptWrapper} from "../../model/nodeWrapper";
import {D3NodeInterface} from "../../model/d3NodeInterface";

const SEMANTIC = 'SEMANTIC';
const RELATIONAL = 'RELATIONAL';

@Component({
  selector: 'app-benchmark',
  templateUrl: './benchmark.component.html',
  styleUrls: ['./benchmark.component.css']
})


export class BenchmarkComponent implements OnInit {
  resultsSem = []; counters = {};
  resultsRel = [];
  allSuites = "";
  nrOfSamples = 50;
  results = "";

  allInstancesSemantic = [];
  allInstancesRelational = [];

  // Those need to be set to the data located in the benchmarkData file (on root level of this app)
  allPerson : any;
  allPubications : any;
  allProject : any;

  constructor(private relData: DataRelService, private semData: DataSemService) {
    let _dhis = this;

    let mk = (into: any, tableName: string) => {
      let dummyParent = new RelD3ConceptWrapper(tableName, null, 100, tableName, this.relData);
      //allProject["results"]["bindings"] // ["identifier"]["value"] && ["s"]["value"]
      for (let single of into["results"]["bindings"]) {
        // Sieben verschidene kind konzepte
        let semItemLarge = new SemD3Node(this.semData);
        semItemLarge.uri = new SemDataURI(single["s"]["value"]);
        semItemLarge.semD3NodeType = SemD3NodeType.Instance;
        this.allInstancesSemantic.push(semItemLarge);
        //let relItemLarge = new RelD3ConceptWrapper("Large test node", null,100,"content_publikation", this.relData);
        let relItemLarge = new RelD3Node("test node", 0, tableName, single["identifier"]["value"], this.relData, dummyParent);
        this.allInstancesRelational.push(relItemLarge);
      }
      console.log("Number of unique items", this.allInstancesSemantic.length);
    };

    // Uncommet these for unique becnhmark
    //mk(this.allPerson, "content_mitglied");
    //mk(this.allPubications, "content_publikation");
    //mk(this.allProject, "content_projekt");


    setTimeout(() => {
      console.log("Starting benchmark ...");
      let suite = new Benchmark.Suite;
      suite.on('error', function(evt) {
        console.log('error in suite', evt.target.error);
      });

      this.runClassBenchmark(suite);
      this.benchmarkGetRoot(suite);
      //this.benchmarkGetAllTheChildren("GetChildrenUniqueInstances",suite);
      //this.benchmarkGetAllInformation("GetInformationUniqueInstances",suite);
      this.runChildrenBenchmark(suite);
      this.runInformationBenchmark(suite);
      suite
        .on('cycle', function (event) {
          _dhis.results += String(event.target) + "<br>";
          console.log();
        })
        .on('complete', function () {
          this.forEach((item) => {
            let s = item.stats;
            let split = item.name.split("-");

            let st = `(${s.mean},${split[0]}) +- (${s.sem}, ${s.sem})`;
            if (split[1] == SEMANTIC) {
              _dhis.resultsSem.push(st);
            } else if (split[1] == RELATIONAL) {
              _dhis.resultsRel.push(st);
            }
            _dhis.pprintData();
          })
        });
      suite.run();
    }, 2000);

  }


  private benchmarkGetAllTheChildren(currentSuiteName, suite) {
    let _dhis = this;
    let currentSuite = currentSuiteName;
    this.allSuites += currentSuite + ", ";
    suite
      .add(currentSuite + "-" + SEMANTIC, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          if (!_dhis.counters[currentSuite + "-" + SEMANTIC]) _dhis.counters[currentSuite + "-" + SEMANTIC] = 0;
          if (_dhis.counters[currentSuite + "-" + SEMANTIC] > _dhis.allInstancesSemantic.length -1) _dhis.counters[currentSuite + "-" + SEMANTIC] = 0;
          let semItem = _dhis.allInstancesSemantic[_dhis.counters[currentSuite + "-" + SEMANTIC]];
          semItem.loadChildren().then((children) => {
            semItem.children = null;
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });
          _dhis.counters[currentSuite + "-" + SEMANTIC]++;
        }
      })
      .add(currentSuite + "-" + RELATIONAL, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          if (!_dhis.counters[currentSuite + "-" + RELATIONAL]) _dhis.counters[currentSuite + "-" + RELATIONAL] = 0;
          if (_dhis.counters[currentSuite + "-" + RELATIONAL] > _dhis.allInstancesRelational.length -1) _dhis.counters[currentSuite + "-" + RELATIONAL] = 0;

          let relItem = _dhis.allInstancesRelational[_dhis.counters[currentSuite + "-" + RELATIONAL]];
          relItem.loadChildren().then((children) => {
            relItem.children = null;
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });
          _dhis.counters[currentSuite + "-" + RELATIONAL]++;
        }
      })
  }

  private benchmarkGetAllInformation(currentSuiteName, suite) {
    let _dhis = this;
    let currentSuite = currentSuiteName;
    this.allSuites += currentSuite + ", ";
    suite
      .add(currentSuite + "-" + SEMANTIC, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          if (!_dhis.counters[currentSuite + "-" + SEMANTIC]) _dhis.counters[currentSuite + "-" + SEMANTIC] = 0;
          if (_dhis.counters[currentSuite + "-" + SEMANTIC] > _dhis.allInstancesSemantic.length -1) _dhis.counters[currentSuite + "-" + SEMANTIC] = 0;
          let semItem = _dhis.allInstancesSemantic[_dhis.counters[currentSuite + "-" + SEMANTIC]];

          semItem.loadInformation().then((children) => {
            semItem.information = null;
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });

          _dhis.counters[currentSuite + "-" + SEMANTIC]++;
        }
      })
      .add(currentSuite + "-" + RELATIONAL, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          if (!_dhis.counters[currentSuite + "-" + RELATIONAL]) _dhis.counters[currentSuite + "-" + RELATIONAL] = 0;
          if (_dhis.counters[currentSuite + "-" + RELATIONAL] > _dhis.allInstancesRelational.length -1) _dhis.counters[currentSuite + "-" + RELATIONAL] = 0;

          let relItem = _dhis.allInstancesRelational[_dhis.counters[currentSuite + "-" + RELATIONAL]];

          relItem.loadInformation().then((children) => {
            relItem.information = null;
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });

          _dhis.counters[currentSuite + "-" + RELATIONAL]++;
        }
      })
  }




  private pprintData() {
    console.log("RESULTS RESULTS RESULTS RESULTS RESULTS RESULTS RESULTS RESULTS RESULTS RESULTS RESULTS RESULTS RESULTS ");
    console.log("");
    let out = "SEMANTIC RESULTS: \n";
    this.resultsSem.forEach((item) => {
      out += item + "\n";
    })
    out += "RELATIONAL RESULTS: \n";
    this.resultsRel.forEach((item) => {
      out += item + "\n";
    })
    console.log(out)
    this.results = out;
  }

  private benchmarkGetRoot(suite) {
    let _dhis = this;
    let currentSuite = "Get Root Classes";
    this.allSuites += currentSuite + ", ";
    suite
      .add(currentSuite + "-" + SEMANTIC, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          _dhis.semData.getRoot().then((children) => {
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });
        }
      })

      .add(currentSuite + "-" + RELATIONAL, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          _dhis.relData.getRoot().then((children) => {
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });
        }
      })
      // add listeners


  }

  private runChildrenBenchmark(suite) {
    let dummyParent = new RelD3ConceptWrapper("Large test node", null,100,"content_publikation", this.relData);;
    // Sieben verschidene kind konzepte
    let semItemLarge = new SemD3Node(this.semData);
    semItemLarge.uri = new SemDataURI("http://interdisciplinary-laboratory.hu-berlin.de/sd/projekt/das-technische-bild");
    semItemLarge.semD3NodeType = SemD3NodeType.Instance;

    //let relItemLarge = new RelD3ConceptWrapper("Large test node", null,100,"content_publikation", this.relData);
    let relItemLarge = new RelD3Node("test node", 0, "content_projekt", "166", this.relData, dummyParent);
    this.benchmarkGetChildren(semItemLarge, relItemLarge, "GetChildrenFromInstance Large", suite);

  // 2 kind konzepte
    let semItemSmall = new SemD3Node(this.semData);
    semItemSmall.uri = new SemDataURI("http://interdisciplinary-laboratory.hu-berlin.de/sd/mitglied/jonas-oppenlander");
    semItemSmall.semD3NodeType = SemD3NodeType.Instance;

    let relItemSmall = new RelD3Node("test node", 0, "content_mitglied", "2619", this.relData, dummyParent);
    this.benchmarkGetChildren(semItemSmall, relItemSmall, "GetChildrenFromInstance Small", suite);
  }

  private runInformationBenchmark(suite) {
    let dummyParent = new RelD3ConceptWrapper("Large test node", null,100,"content_publikation", this.relData);;
    // Sieben verschidene kind konzepte
    let semItemLarge = new SemD3Node(this.semData);
    semItemLarge.uri = new SemDataURI("http://interdisciplinary-laboratory.hu-berlin.de/sd/projekt/das-technische-bild");
    semItemLarge.semD3NodeType = SemD3NodeType.Instance;

    //let relItemLarge = new RelD3ConceptWrapper("Large test node", null,100,"content_publikation", this.relData);
    let relItemLarge = new RelD3Node("test node", 0, "content_projekt", "166", this.relData, dummyParent);

    let _dhis = this;
    let currentSuite = "GetInformationForInstance";
    this.allSuites += currentSuite + ", ";
    suite
      .add(currentSuite + "-" + SEMANTIC, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          semItemLarge.loadInformation().then((children) => {
            semItemLarge.information = null;
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });
        }
      })
      .add(currentSuite + "-" + RELATIONAL, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          relItemLarge.loadInformation().then((children) => {
            relItemLarge.information = null;
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });
        }
      })
  }





  ////////////////  DONE ////////////////////////////////////////////////////////////////////////////////////////////////
  private runClassBenchmark(suite) {
    let semItemLarge = new SemD3Node(this.semData);
    semItemLarge.uri = new SemDataURI("http://purl.org/dc/elements/1.1/BibliographicResource");
    semItemLarge.semD3NodeType = SemD3NodeType.Class;


    let relItemLarge = new RelD3ConceptWrapper("Large test node", null,100,"content_publikation", this.relData);
    this.benchmarkGetChildren(semItemLarge, relItemLarge, "GetCildrenFromClass Large", suite);


    let semItemSmall = new SemD3Node(this.semData);
    semItemSmall.uri = new SemDataURI("http://xmlns.com/foaf/0.1/Project");
    semItemSmall.semD3NodeType = SemD3NodeType.Class;

    let relItemSmall = new RelD3ConceptWrapper("Small test node", null,100,"content_projekt", this.relData);
    this.benchmarkGetChildren(semItemSmall, relItemSmall, "GetCildrenFromClass Small", suite);
  }

  private benchmarkGetChildren(semItem : D3NodeInterface, relItem : D3NodeInterface, currentSuiteName, suite) {
    let _dhis = this;
    let currentSuite = currentSuiteName;
    this.allSuites += currentSuite + ", ";
    suite
      .add(currentSuite + "-" + SEMANTIC, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          semItem.loadChildren().then((children) => {
            semItem.children = null;
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });
        }
      })
      .add(currentSuite + "-" + RELATIONAL, {
        defer: true,
        minSamples: _dhis.nrOfSamples,
        fn(deferred) {
          relItem.loadChildren().then((children) => {
            relItem.children = null;
            deferred.resolve();
          }).catch((error: any) => {
            deferred.resolve();
          });
        }
      })
  }



  ngOnInit() {
  }



}
