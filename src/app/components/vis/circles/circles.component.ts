import {Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataRelService} from "../../../services/relational/data-rel.service";
import {D3Node} from "../../../model/node";

@Component({
  selector: 'vis-circles',
  templateUrl: './circles.component.html',
  styleUrls: ['./circles.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CirclesComponent implements OnInit {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private data: Array<any>;
  private margin: any = {top: 20, bottom: 20, left: 20, right: 20};
  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private yScale: any;
  private colors: any;
  private xAxis: any;
  private yAxis: any;

  constructor(private relData: DataRelService) {
  }

  ngOnInit() {
    //this.createChart();
    this.createCircles();
    // if (this.data) {
    //   this.updateChart();
    // }
  }

  ngOnChanges() {
    if (this.chart) {
      this.updateChart();
    }
  }

  createCircles() {
    let element = this.chartContainer.nativeElement; // Direkter link auf chart
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight); // Hinzufügen, und selekteieren (append) von setzen von width & height (attr)
    let margin = 20;
    let diameter = +svg.attr("width");
    let g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")"); // Rücken in die mitte

    // let color = (d3.scaleLinear()
    //   .domain([-1, 5]) as any)
    //   .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"]) // .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    //   .interpolate(d3.interpolateHcl); // Ne farbe in nem kontinurierlichen Spektrum  https://github.com/d3/d3-scale/blob/master/README.md#scaleLinear

    let pack = d3.pack()
      .size([diameter - margin, diameter - margin])
      //.padding(2); // Erstellt packlayout, aber noch nix drin


    this.relData.getRoot().then(rootObject => {
      //if (error) throw error;
      var root;
      root = d3.hierarchy(rootObject) // Macht ne hierachie aus den daten/Erweitert daten mit werten wie data,depth, height, parent usw
        .sum(function (d: any) {
          return d.size;
        })
        .sort(function (a, b) {
          return b.value - a.value;
        });

      let focus = root,
        nodes: any = pack(root).descendants(), // pack(root) Legt die kreise aus, verteilt x,y koordinaten und radius; descendants: array of descendant nodes
        view;

      var circle = g.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", function (d: any) {
          return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
        })
        .style("fill", function (d: any) {
          return d.data.color();
        })
        .on("click", function (d) {
          if (focus !== d) loadAndZoom(d);
          d3.event.stopPropagation();
        });

      var text = g.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .style("fill-opacity", function (d: any) {
          return d.parent === root ? 1 : 0;
        })
        .style("display", function (d: any) {
          return d.parent === root ? "inline" : "none";
        })
        .text(function (d: any) {
          return d.data.name;
        });

      var node = g.selectAll("circle,text");

      svg
        .style("background", "white")
        .on("click", function () {
          loadAndZoom(root);
        });

      zoomTo([root.x, root.y, root.r * 2 + margin]);


      let loadAndZoom = (d) => {
        if (!d.data.didLoadChildren) {
          console.log("No children, loading.");
          let dataObject = d.data as D3Node;
          dataObject.loadChildren().then((children) => {
            d.children = children;
            console.log("Zooming to ")
            // START virtual nodes
            // http://stackoverflow.com/questions/29387379/inserting-nodes-into-d3-pack-layout-pagination-on-zoom
            // http://fiddle.jshell.net/wfvwgqb9/2/
            let virtualNodesByParentNode = (d3NodeParentElement, nodeChildrenElementArray) => {
              //root.children[0].children[0].children = subnode_subnodes; already happened
              // we need to do this because otherwise, the parent node object will be changed
              let d3NodeParentElementClone = Object.assign(Object.create(d3NodeParentElement), d3NodeParentElement);
              // Mach mir nen pack
              let pack = d3.pack()
                .size([d3NodeParentElementClone.r * 2 , d3NodeParentElementClone.r * 2 ]); // -1 is important to avoid edge overlap

              d3NodeParentElementClone.children = nodeChildrenElementArray;

              d3NodeParentElementClone = d3.hierarchy(d3NodeParentElementClone) // Macht ne hierachie aus den daten/Erweitert daten mit werten wie data,depth, height, parent usw
                .sum(function (d: any) {
                  return d.size;
                })
                .sort(function (a, b) {
                  return b.value - a.value;
                });

              let nodes = pack(d3NodeParentElementClone).descendants();
              // absolute x,y coordinates calculation
              var curChildnode;
              for (let i = 1; i < nodes.length; i++) {
                curChildnode = nodes[i];
                curChildnode.x = curChildnode.x - nodes[0].x + d3NodeParentElement.x;
                curChildnode.y = curChildnode.y - nodes[0].y + d3NodeParentElement.y;
                curChildnode.depth = d3NodeParentElement.depth + 1;
                curChildnode.parent = d3NodeParentElement;
              }
              nodes.splice(0, 1);


              return nodes;
            }
            // END virtual nodes

            // START add nodes
            let virtualNodes = virtualNodesByParentNode(d,children);
            d.children = virtualNodes;
            nodes.push.apply(nodes, virtualNodes);
            circle = g.selectAll("circle")
              .data(nodes)
              .enter().append("circle")
              .attr("class", function (d : any) {
                return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
              })
              .style("fill", function (d : any) {
                return d.data.color();
              })
              .on("click", function (d) {
                if (focus !== d) loadAndZoom(d), d3.event.stopPropagation();
              });
            text.remove();
            text = g.selectAll("text")
              .data(nodes)
              .enter().append("text")
              .attr("class", "label")
              .style("fill-opacity", function (d: any) {
                return d.parent === root ? 1 : 0;
              })
              .style("display", function (d: any) {
                return d.parent === root ? "inline" : "none";
              })
              .text(function (d: any) {
                return d.data.name;
              });


            circle = g.selectAll("circle");
            node = g.selectAll("circle,text");
            // zoom to current focus again (do the transformation of the updated elements)
            zoomTo(view);
            zoom(d);
            // END add nodes
          }).catch((error) => {
            console.log(error)
          });
        } else {
          console.log("Already loaded, only zooming");
          zoom(d);
        }
      }

      /**
       * Zoom to node d
       * @param d
       */
      let zoom = (d) => {
        let focus0 = focus;
        focus = d;

        // START The zoom
        let transition = d3.transition("bla")
          .duration(750)
          .tween("zoom", function (d) {
            var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]); // was focus.r * 2 + margin
            return function (t) {
              zoomTo(i(t));
            };
          });

        transition.selectAll("text")
          .filter(function (d: any) {
            return d.parent === focus || this.style.display === "inline";
          })
          .style("fill-opacity", function (d: any) {
            return d.parent === focus ? 1 : 0;
          })
          .on("start", function (d: any) {
            if (d.parent === focus) this.style.display = "inline";
          })
          .on("end", function (d: any) {
            if (d.parent !== focus) this.style.display = "none";
          });
        // END The zoom

      }

      function zoomTo(v) {
        var k = diameter / v[2];
        view = v;
        node.attr("transform", function (d: any) {
          // console.log("translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")");
          // console.log(d)
          // console.log(v)
          return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function (d: any) {
          return d.r * k;
        });
      }
    });
  }

  createChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // define X & Y domains
    let xDomain = this.data.map(d => d[0]);
    let yDomain = [0, d3.max(this.data, d => d[1])];

    // create scales
    this.xScale = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.width]);
    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);

    // bar colors
    this.colors = d3.scaleLinear().domain([0, this.data.length]).range(<any[]>['red', 'blue']);

    // x & y axis
    this.xAxis = svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)
      .call(d3.axisBottom(this.xScale));
    this.yAxis = svg.append('g')
      .attr('class', 'axis axis-y')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .call(d3.axisLeft(this.yScale));
  }

  updateChart() {
    // update scales & axis
    this.xScale.domain(this.data.map(d => d[0]));
    this.yScale.domain([0, d3.max(this.data, d => d[1])]);
    this.colors.domain([0, this.data.length]);
    this.xAxis.transition().call(d3.axisBottom(this.xScale));
    this.yAxis.transition().call(d3.axisLeft(this.yScale));

    let update = this.chart.selectAll('.bar')
      .data(this.data);

    // remove exiting bars
    update.exit().remove();

    // update existing bars
    this.chart.selectAll('.bar').transition()
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(d[1]))
      .attr('width', d => this.xScale.bandwidth())
      .attr('height', d => this.height - this.yScale(d[1]))
      .style('fill', (d, i) => this.colors(i));

    // add new bars
    update
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(0))
      .attr('width', this.xScale.bandwidth())
      .attr('height', 0)
      .style('fill', (d, i) => this.colors(i))
      .transition()
      .delay((d, i) => i * 10)
      .attr('y', d => this.yScale(d[1]))
      .attr('height', d => this.height - this.yScale(d[1]));
  }

}
