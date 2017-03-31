import {Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation, NgZone} from '@angular/core';
import * as d3 from 'd3';
import {D3Node, EmptyD3Node} from "../../../model/node";
import {D3NodeInterface} from "../../../model/d3NodeInterface";
import {Color} from "../../../model/colors";
import {D3DataService} from "../../../services/dataServiceInterface";
import {FCTypeFilter, FCFilter} from "../../../model/facettedSearch";

@Component({
  selector: 'vis-circles',
  templateUrl: './circles.component.html',
  styleUrls: ['./circles.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CirclesComponent implements OnInit {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private data: D3DataService;
  private chart: any;
  private width: number;
  public height: number;
  private settings = {
    iconsEnabled: false,
    factorWhenToLoadNewData: 0.3 // caclulates diamater * factorWhenToLoadNewData
  };

  //private selectedData: D3NodeInterface;
  private translate: any;
  private zoomToNode: any;
  private reloadCirclesForFilter: any;
  //public focusedNodesLadder = [];

  constructor(private zone: NgZone) {

  }

  ngOnInit() {
    this.createCircles();
  }


  //ngOnChanges() {}

  public focusNode(node: any, index: number) {
    console.log("Focus node from outside", node);
    this.zoomToNode(node, d3.select("#circle-" + node.data.id()).node())

  }

  public didSelectFilter(filter: any, value: any) {
    if (filter.dbName == "typeFilter") {
      let f: FCTypeFilter = (filter as FCTypeFilter);
      f.didSelectIndex(value).then((children) => {

        f.facettedSearch.parentNode.children = children;
        this.reloadCirclesForFilter(filter);
      }).catch((err) => {
        console.log("error fitering " , err);
        filter.loading = false;
      });
    }

  }

  createCircles() {
    let element = this.chartContainer.nativeElement; // Direkter link auf chart
    this.width = element.offsetWidth;
    this.height = element.offsetWidth > 600 ? 600 : element.offsetWidth;

    let svg = d3.select(element).append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    // Hinzufügen, und selekteieren (append) von setzen von width & height (attr)
    let diameter = +svg.attr("width");
    let radius = diameter / 2;
    let diameterMinus = diameter * this.settings.factorWhenToLoadNewData;
    console.log(diameterMinus)
    let g = svg.append("g").attr("transform", "translate(" + radius + "," + radius + ")"); // Rücken in die mitte

    let fontSize = d3.interpolateNumber(2, 20);

    // width of circle
    let ipnmin = 5, ipnmax = 25;
    let ipn = d3.interpolateNumber(ipnmin, ipnmax);
    let widthOfCircle = (percent: number) => {
      return percent > 1 ? ipn(1) : percent < 0 ? ipn(0) : ipn(percent);
    };

    // let color = (d3.scaleLinear()
    //   .domain([-1, 5]) as any)
    //   .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"]) // .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    //   .interpolate(d3.interpolateHcl); // Ne farbe in nem kontinurierlichen Spektrum  https://github.com/d3/d3-scale/blob/master/README.md#scaleLinear

    let pack = d3.pack()
      .size([diameter, diameter]);
    //.padding(2); // Erstellt packlayout, aber noch nix drin
    pack.padding(function (d: any) {
      return 6;
    })

    let root; // Root node

    this.data.getRoot().then((rootObject) => {
      root = d3.hierarchy(rootObject) // Macht ne hierachie aus den daten/Erweitert daten mit werten wie data,depth, height, parent usw
        .sum(function (d: any) {
          return d.size;
        })
      // .sort(function (a, b) {
      //   return b.value - a.value;
      // });

      let focus = root,
        nodes: any = pack(root).descendants(), // pack(root) Legt die kreise aus, verteilt x,y koordinaten und radius; descendants: array of descendant nodes
        view,
        mouseoveredCircle, mouseoveredCircleSelection,
        currentDepth = 0;
      this.data.currentFocusPath.push(root);

      // START seamless zoom
      let transform = {k: 1};
      let transform0 = {k: -1};

      let translate = (transform) => {
        // current view x center transform.x -radius
        // view = [((transform.x - radius) * -1), ((transform.y - radius) * -1), transform.k];
        // console.log(view)
        //g.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
        // let rect = {
        //   x : transform.x *-1 +radius,
        //   y: transform.y *-1 +radius,
        //   width : this.width,
        //   height: this.height
        // }
        // let intersects = ( circle :any,  rect :any) => {
        //   let circleDistance = {x:0,y:0}
        //   circleDistance.x = Math.abs(circle.x - rect.x);
        //   circleDistance.y = Math.abs(circle.y - rect.y);
        //
        //   if (circleDistance.x > (rect.width/2 + circle.r)) { return false; }
        //   if (circleDistance.y > (rect.height/2 + circle.r)) { return false; }
        //
        //   if (circleDistance.x <= (rect.width/2)) { return true; }
        //   if (circleDistance.y <= (rect.height/2)) { return true; }
        //
        //   let cornerDistance_sq = Math.pow((circleDistance.x - rect.width/2), 2) +
        //     Math.pow((circleDistance.y - rect.height/2), 2);
        //
        //   return (cornerDistance_sq <= Math.pow(circle.r, 2));
        // }

        node
          .filter((d: any) => {
            if (mouseoveredCircle) {
              let w = this.width + diameter;
              let mx = mouseoveredCircle.x * transform.k;
              let tx = d.x * transform.k

              var a = mx - tx
              if (Math.abs(a) > w) return false;


              let my = mouseoveredCircle.y * transform.k;
              let ty = d.y * transform.k
              var b = my - ty
              if (Math.abs(b) > w) return false;

              var c = Math.sqrt(a * a + b * b);
              //console.log(c);
              // if(d.data.name == "Nachwuchsfoerderungen") {
              //   console.log("translate(" + ((transform.x + d.x * transform.k) - radius) + "," + ((transform.y + d.y * transform.k ) - radius) + ")")
              // }
              return c < w;
            }
            return true;
            // return intersects(d, rect)
            // return (d.depth >= currentDepth - 2 && d.depth <= currentDepth + 1);
          })
          .each(function (c) {
            let sel = d3.select(this);
            // do translate & radius
            sel.attr("transform", function (d: any) { // Translate everything
              //console.log(transform.x, d.x, transform.k,d.x * transform.k, ((transform.x + d.x * transform.k) - radius) )
              return "translate(" + ((transform.x + d.x * transform.k) - radius) + "," + ((transform.y + d.y * transform.k ) - radius) + ")";
            });
            sel.select("circle")
              .attr("r", function (d: any) { // Radius of everything
                return d.r * transform.k;
              });


            // sel.select("text").style("display", function (d: any) { // Only show curremtdepth -1 & +1
            //     return (d.parent == focus) || (d.depth == currentDepth && d != focus) ? "inline" : "none";
            //     //return (d.depth >= currentDepth - 2 ) && (d.depth <= currentDepth + 1 ) ? "inline" : "none"; // TODO: Kommt auch woanders hin?
            //   })
          })

        // let fcircle= circle
        //   .filter((d: any) => {
        //   if (mouseoveredCircle) {
        //     var a = mouseoveredCircle.x * transform.k - d.x * transform.k
        //     var b = mouseoveredCircle.y * transform.k - d.y * transform.k
        //     var c = Math.sqrt( a*a + b*b );
        //     //console.log(c);
        //     // if(d.data.name == "Nachwuchsfoerderungen") {
        //     //   console.log("translate(" + ((transform.x + d.x * transform.k) - radius) + "," + ((transform.y + d.y * transform.k ) - radius) + ")")
        //     // }
        //     return  c < this.width + diameter;
        //   }
        //   return true;
        //    //d.r * transform.k * .01 < this.width;
        //     //WORKING: return d.parent == focus || d.parent == focus.parent || (focus.parent.parent && d.parent == focus.parent.parent) || d == focus || d == focus.parent;
        //   })
        //   console.log(fcircle.size());
        //
        //   fcircle.attr("r", function (d: any) { // Radius of everything
        //     return d.r * transform.k;
        //   });

        if (mouseoveredCircleSelection) {
          // mouseoveredCircleSelection.style("fill-opacity", function (e: any) { // Do zoom effect
          //   //console.log(e.data.name)
          //   if (e == mouseoveredCircle) {
          //     return (((100 / diameterMinus) * (e.r * transform.k * 2)) / 100) - 0.1
          //   } else {
          //     return 1;
          //   }
          // });
          mouseoveredCircleSelection.transition().attr("stroke-dasharray", function (e: any) {
            //console.log(e.data.name)
            let ct = 100 - (((100 / diameterMinus) * (e.r * transform.k * 2)) );
            if (ct > 0) {
              if (e == mouseoveredCircle) {
                //console.log(widthOfCircle( (((100 / diameterMinus) * (e.r * transform.k * 2)) / 100)))
                //return widthOfCircle((((100 / diameterMinus) * (e.r * transform.k * 2)) / 100) ) + "px";
                return ct + "px";
              } else {
                return "none";
              }
            }
          });
          mouseoveredCircleSelection.style("stroke-opacity", function (e: any) {
            //console.log(e.data.name)
            if (e == mouseoveredCircle) {
              return Math.max((((100 / diameterMinus) * (e.r * transform.k * 2)) / 100), 0.5);
              //console.log(widthOfCircle( (((100 / diameterMinus) * (e.r * transform.k * 2)) / 100)))
              //return widthOfCircle((((100 / diameterMinus) * (e.r * transform.k * 2)) / 100) ) + "px";
            } else {
              return 1;
            }
          });
        }

        adjustFontSizeForCurrentFocus();
        transform0 = transform;
      };
      this.translate = translate;


      // START Adjust font size
      let adjustFontSizeForCurrentFocus = () => {
        let zoomiZoom = () => {
          currentText
            .each(function (d, i) {
              let sel = d3.select(this);
              sel.style("font-size", function (d: any) { // Do font of icons
                let size;
                if (sel.attr("class") == "icon") {
                  size = d.r * transform.k / 4;
                } else {
                  size = d.r * transform.k / (d.data.nameShort().length + 10);
                }
                size *= 10 / 2;
                size += 1;

                // if (sel.attr("class") != "icon") {
                //   console.log(Math.round(size))
                // }
                sel.style("display", function (d) {
                  return size < 8 ? "none" : "inline";
                });
                return Math.round(size) + 'px';
              });

            })
        }

        let currentText = node.selectAll("text").filter(function (d: any) {
          return d != focus && (d.parent == focus || d.parent == focus.parent);
        });
        if (currentText.size() > 300) { // Too many stuff
          // hide parent nodes
          let sel = node.selectAll("text").filter(function (d: any) {
            return d.parent == focus.parent;
          });
          if (sel.size() > 30) { // too many parent nodes
            sel.style("display", "none");
            currentText = node.selectAll("text").filter(function (d: any) {
              return d != focus && (d.parent == focus && d.parent != focus.parent);
            })
            zoomiZoom()
          } else { // nothing we can do
            // do not do icons and lable of current node
            node.selectAll("text").filter(function (d: any) {
              return (d.parent == focus);
            }).style("display", "none");
            currentText = node.selectAll("text").filter(function (d: any) {
              return d != focus && (d.parent == focus.parent);
            });
            zoomiZoom()

          }

        } else {
          zoomiZoom()
        }


        // currentText.filter(".icon")
        //   .style("font-size", function (d) { // Do font of icons
        //     var size = d.r * transform.k / 3;
        //     size *= 10 / 2;
        //     size += 1;
        //     return Math.round(size) + 'px';
        //   })
        //
        // currentText.filter(".label")
        //   .style("font-size", function (d) { // Do font of icons
        //     //console.log(d)
        //     var size = d.r * transform.k / (d.data.name.length + 3);
        //     size *= 10 / 2;
        //     size += 1;
        //     return Math.round(size) + 'px';
        //   })
      };
      // END Adjust font size

      let zoomStartEnd = () => {
        if (d3.event) {
          transform = d3.event.transform;
          //console.log("zoom", d3.event.transform);
        }

        if (!transform) {
          console.log("no transform, not zooming")
          return;
        }

        let zoomFactor = transform.k;
        // g.selectAll("text").style("font-size",  (d: any) => {
        //   return fontSize((10 - (radius / (d.r * zoomFactor))) / 10);
        // })

        // Decide if loading new data
        let d: any = mouseoveredCircle;
        // Functions
        let focusNode = (d): Promise<boolean> => {
          if (focus != d && !(d.data instanceof EmptyD3Node)) {
            console.log("focus ", d.data.name, d);
            if (d.depth > currentDepth) { // go in
              this.data.currentFocusPath.push(d);
            } else if (d.depth == currentDepth) { // stay same level
              this.data.currentFocusPath.pop();
              this.data.currentFocusPath.push(d);
            } else { // go out
              this.data.currentFocusPath.pop();
            }
            // Focus
            if (focus) {
              d3.select("#circle-" + focus.data.id()).classed("node-focus", false);
              d3.select("#circle-" + focus.data.id())
                .attr("stroke-dasharray", "none");
            }
            focus = d;
            d3.select("#circle-" + focus.data.id()).classed("node-focus", true);
            // loading (50);
            // let loading = (px : string) => {
            //   d3.select("#circle-" + focus.data.id())
            //     .transition()
            //     .duration(2000)
            //     .attr("stroke-dasharray",
            //       px + "px").on("end", function(x : any) {
            //     loading(px + 20)
            //   });
            // }


            mouseoveredCircle = focus; // For the zoom performance thingy in translate

            //this.data.currentSelectedData = d.data;

            currentDepth = d.depth;
            return new Promise<any>((resolve) => {
              resolve(true);
            });
          } else {
            return new Promise<any>((resolve) => {
              resolve(false);
            });
          }
        };

        // Remove child node
        let removeChildNodesOfNode = (parent, depth) => {
          if (parent && depth > 0) { // Always keep first 2 layers
            console.log("removeing children ");
            let removeChidren = (node) => { // Actual removal function
              for (let child of node.children) { // Remove all from this layer
                if (child.children && child.children.length != 0) {
                  console.log("removing " + child.data.name);
                  removeChidren(child);
                  nodes = nodes.filter(function (elem) {
                    return child.children.indexOf(elem) === -1;
                  });
                  child.data.children = null;
                  child.data.didLoadChildren = false;
                  child.children = null; // Das hier ist nicht genug, es müssen auch die kindeskinder gelöscht werden, da sonst die size von Ihnen mit reingerechnet wird
                }
              }
            };
            removeChidren(parent); // Actual removal function

            // nodes = nodes.filter( function ( elem ) {
            //   return parent.children.indexOf( elem ) === -1;
            // });
            // parent.data.didLoadChildren = false;
            // parent.children = [];
            //text.remove();

            makeCirclesAndText(nodes);
            this.translate(transform);
          }
        };

        // Function if node d is big enough
        let isNear = (d) => {
          return d.r * 2 * zoomFactor > diameterMinus;
        };

        // check if mouseover node is near enought to focus
        if (!d) {
          // Noting
        }
        else if (isNear(d)) {
          if (focus != d) {
            console.log("focus near");
            if (d.depth != currentDepth) {
              removeChildNodesOfNode(focus, focus.depth);
            }
            // lade daten weil nah
            focusNode(d).then((didFocus) => {
              if (didFocus) {
                loadDataForNode(d).then(() => {

                  this.data.currentSelectedData = d.data;
                  this.data.currentSelectedData.loadInformation().then((infos) => {
                  }).catch(error => console.log(error));
                  transitionText();
                });
              }
            });

          } else {
            console.log("not focussing because already focused");
          }
        } else if (!isNear(d)) { // check if parent is on same level as now and focus if so
          if (d.parent.depth == currentDepth) {
            focusNode(d.parent).then((didFocus) => {
              if (didFocus) {
                console.log("focusing parent on same level as currentdeopth")
                loadDataForNode(focus).then(() => {
                  this.data.currentSelectedData = focus.data;
                  this.data.currentSelectedData.loadInformation().then((infos) => {
                  }).catch(error => console.log(error));
                  transitionText();
                });
              }
            });
          }
        }
        // else if ((focus != d.parent) && isNear(d.parent)) { // make sure that parent is focused
        //   console.log("same layer")
        //   // Lade auf selber ebene
        //   //removeChildNodesOfNode(focus)
        //   focusNode(d.parent);
        //   loadDataForNode(d.parent).then(() => {
        //     transitionText(focus);
        //   });
        // }
        // Check zoomed out of focus
        if (!isNear(focus)) { // is not big enough
          if (focus.parent) {

            console.log("zooming out");
            let focus0 = focus;
            removeChildNodesOfNode(focus0.parent, focus0.depth);
            focusNode(focus.parent).then((didFocus) => {
              this.data.currentSelectedData = focus.data;
              this.data.currentSelectedData.loadInformation().then((infos) => {
              }).catch(error => console.log(error));
              transitionText();

            })

          }

        }
      };

      let zoomed = () => {
        if (d3.event) transform = d3.event.transform;
        if (!transform) {
          console.log("no transofrm")
          return;
        }
        let t0 = transform0.k;
        this.translate(transform);
        //console.log(t0, transform.k,t0 >transform.k );
        if (t0 > transform.k) {
          // Zooming out, do
          zoomStartEnd();
        }
        //
      };
      // END seamless zoom


      // START Mouseover
      let mouseover = (d: any) => {
        //console.log("d", d.x * transform.k, d.y * transform.k, d.r * transform.k)
        if (d.depth == currentDepth + 1 || d.depth == currentDepth) {
          // if (d.parent != focus) {
          //   mouseoveredCircle = d.parent;
          // } else {

          // }
          // console.log(d.data.name)

          // START The reinzoomen hitnergundfarbe
          mouseoveredCircleSelection = circle.filter(function (e: any) {
            return e == mouseoveredCircle || e == d;
          });

          mouseoveredCircleSelection.attr("stroke-dasharray", function (e: any) {
            //console.log(e.data.name)
            let ct = 100 - (((100 / diameterMinus) * (e.r * transform.k * 2)) );
            if (ct > 0) {
              if (e == d) {
                //console.log(widthOfCircle( (((100 / diameterMinus) * (e.r * transform.k * 2)) / 100)))
                //return widthOfCircle((((100 / diameterMinus) * (e.r * transform.k * 2)) / 100) ) + "px";
                return ct + "px";
              } else {
                return "none";
              }
            }

          });

          mouseoveredCircleSelection.style("stroke-opacity", function (e: any) {
            //console.log(e.data.name)
            if (e == d) {
              return Math.max((((100 / diameterMinus) * (e.r * transform.k * 2)) / 100), 0.5);
              //console.log(widthOfCircle( (((100 / diameterMinus) * (e.r * transform.k * 2)) / 100)))
              //return widthOfCircle((((100 / diameterMinus) * (e.r * transform.k * 2)) / 100) ) + "px";
            } else {
              return 1;
            }
          });


          // END The reinzoomen hitnergundfarbe


          // // START Mouseover text anzeigen
          // let reclacIconSize = (selection) => {
          //   selection.style("font-size", function (d: any) { // Do font of icons
          //     let size;
          //     size = d.r * transform.k / 4;
          //     size *= 10 / 2;
          //     size += 1;
          //     return Math.round(size) + 'px';
          //   });
          // }
          //
          // if (mouseoveredCircle && mouseoveredCircle["oldState"]) {
          //   let oldSelText = d3.select("#text-" + mouseoveredCircle.data.id())
          //   oldSelText.style("display", mouseoveredCircle["oldState"].textDisplay);
          //   oldSelText.style("font-size", mouseoveredCircle["oldState"].textFontSize);
          //   if (this.settings.iconsEnabled) {
          //     let oldSelIcon = d3.select("#icon-" + mouseoveredCircle.data.id())
          //     oldSelIcon.style("display", mouseoveredCircle["oldState"].iconDisplay);
          //     reclacIconSize(oldSelIcon);
          //   }
          //
          //   mouseoveredCircle["oldState"] = undefined;
          // }
          //
          //
          // let oldState;
          // if (d != focus && d.depth == currentDepth + 1) {
          //   //console.log(d.data.name + " " + focus.data.name)
          //   let selectedText = d3.select("#text-" + d.data.id());
          //   let selectedIcon = d3.select("#icon-" + d.data.id());
          //   oldState = {
          //     textDisplay: selectedText.style("display"),
          //     textFontSize: selectedText.style("font-size")
          //
          //   }
          //   if (this.settings.iconsEnabled) {
          //     oldState["iconDisplay"] = selectedIcon.style("display")
          //   }
          //   //console.log(d.data.name)
          //
          //
          //   selectedText.style("display", "inline");
          //   selectedText.style("font-size", function (d) {
          //     let oldFontSize = selectedText.style("font-size");
          //     let fs = 20;
          //     if (+oldFontSize.replace("px", "") < fs) { // Should not make it smaller
          //       return fs + "px";
          //     }
          //     return oldFontSize;
          //   });
          //
          //
          //   if (this.settings.iconsEnabled) {
          //     selectedIcon.style("display", "inline");
          //     reclacIconSize(selectedIcon);
          //   }
          // if (oldState) mouseoveredCircle["oldState"] = oldState;

          // // END Mouseover text anzeigen

          // }
          mouseoveredCircle = d;

          // START Never show focused text you fuckface
          d3.select("#text-" + focus.data.id()).style("display", "none");
          if (this.settings.iconsEnabled) d3.select("#icon-" + focus.data.id()).style("display", "none");
          // END Never show focused text

          //d3.event.stopPropagation();
        } else if (d.parent) {
          mouseover(d.parent);
        }
      };
      // END Mouseover

      let isInFocusLadder = (d) => {
        return this.data.currentFocusPath.indexOf(d) != -1;
      };

      // START Transition of text
      let transitionText = () => {
        // text.filter(".label") // TEXT
        // // .filter(function (d: any) {
        // //   return d.parent == focus || d == focus || isInFocusLadder(d); // old  d.depth === currentDepth + 1
        // // })
        // //   .style("fill-opacity", function (d: any) {
        // //     //console.log("node ", d.data.name, _dhis.focusedNodesLadder.indexOf(d) != -1)
        // //     return (d.parent == focus && !isInFocusLadder(d)) ? 1 : 0;
        // //   })
        //   .style("display", function (d: any) {
        //     //console.log("node ", d.data.name, _dhis.focusedNodesLadder.indexOf(d) != -1)
        //     return (d.parent == focus && !isInFocusLadder(d)) ? "inline" : "none";
        //   });

        g.selectAll("text").each(function (d, i) {
          d3.select(this).style("display", function (d: any) { // Only show curremtdepth -1 & +1
            return (d.parent == focus) || (d.depth == currentDepth && d != focus) ? "inline" : "none";
            //return (d.depth >= currentDepth - 2 ) && (d.depth <= currentDepth + 1 ) ? "inline" : "none"; // TODO: Kommt auch woanders hin?
          })
        });


        // .filter(".icon") // ICONS


        adjustFontSizeForCurrentFocus();
        // .filter(function (d: any) {
        //   return d.parent == focus || d == focus; // old  d.depth === currentDepth + 1
        // })
        // .on("start", function (d: any) {
        //
        // })
        // .on("end", function (d: any) {
        //   if (_dhis.focusedNodesLadder.indexOf(d) != -1) this.style.display = "none";
        // });

        // circle.transition()
        //   .filter(function (d: any) {
        //     return d == focus; // old  d.depth === currentDepth + 1
        //   })
        // circle.style("fill", function (d: any) {
        //   return d == focus ? "red" : d.data.color();
        // });


        node
          .style("display", function (d: any) { // Only show curremtdepth -1 & +1
            //return d.r * transform.k * .01 < this.width  ? "inline" : "none";
            return d == focus || isInFocusLadder(d)
            || d == focus.parent || (d.parent && (d.parent == focus || (focus.parent && d.parent == focus.parent)))
            || (focus.parent && (focus.parent.parent && d.parent == focus.parent.parent)) ? "inline" : "none";
          });

        // circle.exit().remove();
        // text.exit().remove();
        // icons = g.selectAll("icons")
        //   .style("fill-opacity", function (d: any) {
        //     return d.parent === root ? 1 : 0;
        //   })
        //   .style("display", function (d: any) {
        //     return d.parent === root ? "inline" : "none";
        //   })
      };
      // END Transition of text
      this.reloadCirclesForFilter = (filter: FCFilter) => {
        // START add nodes
        console.log(nodes.length);

        nodes = nodes.filter(function (el) {
          return focus.children.indexOf(el) < 0;
        });
        console.log(nodes.length);

        let newVirtualNodes = virtualNodesByParentNode(focus, filter.facettedSearch.parentNode.children);
        focus.children = newVirtualNodes;
        focus.children = newVirtualNodes;
        nodes.push.apply(nodes, newVirtualNodes);
        //text.remove();
        makeCirclesAndText(nodes);
        // zoom to current focus again (do the transformation of the updated elements)
        //zoomTo(view);
        zoomed();
      };

      //START Make circles enter
      let makeCirclesAndText = (nodes: any) => {
        const transitionTime = 500;
        let container = g.selectAll("g").data(nodes, (d: any) => {
          return d.data.id()
        });

        let containerEnter = container.enter().append("g").attr("id", function (d, i) {
          return "container-" + d.data.id();
        });
        // circle = g.selectAll("circle")
        //   .data(nodes, (d: any) => {
        //     return d.data.id()
        //   });
        let _dhis = this;
        circle = containerEnter.append("circle")
          .classed("node", true)
          .classed("node-focus", function (d) {
            return d == focus
          })
          .attr("id", function (d, i) {
            return "circle-" + d.data.id();
          })
          // tooltip
          // .attr("title", function (d) {
          //   return d.data.name;
          // })
          // .attr("data-container", "body")
          // .attr("data-toggle", "tooltip")
          // .call(d3tip({
          //   html: d => "Whoot"
          // }))
          // tooltip end
          .on("click", function (d) {
            _dhis.zoomToNode(d, this)
            d3.event.stopPropagation();
          })
          .on("mouseover", function (d: any) {
            div.transition()
              .duration(200)
              .style("opacity", .9);
            div.html(d.data.tooltip())
              .style("left", (d3.event.pageX + 10) + "px")
              .style("top", (d3.event.pageY) + "px");
            mouseover(d);
          })
          .on("mousemove", function (d: any) {
            //mouseover(d)
            div
              .style("left", (d3.event.pageX + 10) + "px")
              .style("top", (d3.event.pageY ) + "px");
          })
          .on("mouseout", function (d) {
            div.transition()
              .duration(500)
              .style("opacity", 0);
          })
          // .style("fill3-opacity", 0)
          //.transition().duration(2000)

          .style("fill", function (d: any) {
            return "white";//d.data.color();
          })
          .style("stroke-opacity", "0")
          .style("fill-opacity", 1)
          .style("stroke", function (d: any) {
            return d.data.color();//d.data.color();
          })
          .transition().duration(transitionTime)
          .style("stroke-opacity", "1")
        // stroke-dasharray: ;
        // .attr("stroke-dasharray", function (d: any) {
        //   return "5,5";//d.data.color();
        // })
        //.style("stroke");

        //.transition()


        container.exit().remove();
        circle = g.selectAll("circle");

        // text = g.selectAll("text")
        //   .data(nodes, (d: any) => {
        //     return d.data.id();
        //   })

        // if (this.settings.iconsEnabled) {
        //   containerEnter.append('text')
        //     .attr("class", "icon")
        //     .attr("id", function (d, i) {
        //       return "icon-" + d.data.id();
        //     })
        //     .style("fill", function (d) {
        //       return Color.colorIconForTable(d.data.tableName)
        //     })
        //     .style("display", "inline")
        //     .text(function (d) {
        //       return DataRelService.iconForTableName[d.data.tableName];
        //     });
        // }

        containerEnter.append("text")
          .attr("class", "label")
          .attr("id", function (d, i) {
            return "text-" + d.data.id();
          })
          .style("fill-opacity", "0")
          .style("display", "inline")
          // .style("font-size",  (d: any) => {
          //   return fontSize((100 - this.width / d.r) / 100);
          // })
          .text(function (d: any) {
            //console.log(d)
            return d.data.nameShort();// + " d:" + d.depth;
          })
          .transition().duration(transitionTime)
          .style("fill-opacity", "1")


        //text.exit().remove();
        //text = g.selectAll("text");

        // icons = g.selectAll("icons")
        //   .data(nodes, (d:D3NodeInterface)=> {return d.data.id()})
        //   .enter().append('text')
        //   .attr("class", "icon")
        //   .style("fill-opacity", function (d: any) {
        //     return d.parent === root ? 1 : 0;
        //   })
        //   .style("display", function (d: any) {
        //     return d.parent === root ? "inline" : "none";
        //   })
        //   .text(function(d) { return '\uf118' });
        // icons.exit().remove()
        //node = g.selectAll("circle,text");
        node = g.selectAll("g");
        // .filter(function (d: any) {
        //   return (d.parent == focus ||d.parent == focus.parent);
        // });
        //console.log("current nodes", node.size())
        // This needs to happen

        //transform0.k = -1; // make sure radius setting happens
      };
      // END make circles enter


      let circle, text, node;// icons;
      //focus = root;
      makeCirclesAndText(nodes);
      transitionText();

      svg
        .style("background", "white") // background color of svg
        .on("click", function () {
          // TODO: Zoom out
        });

      /// START Init zoom
      let d3zoom = d3.zoom()
        .scaleExtent([0.9, Infinity])
        .on("zoom", () => {
          zoomed();
        })
        .on("end", () => {
          zoomStartEnd();
        })


      let t = d3.zoomTransform(svg.node() as any)
      svg.call(d3zoom.transform, t.scale(1))

      //console.log("outside", d3.event.transform);
      // .on("end", () => {
      //   zoomStartEnd()
      // });
      svg.call(d3zoom);
      svg.on("wheel", function () {
        d3.event.preventDefault();
      });
      // END init zoom

      // START tooltip
      let div = d3.select("app-home").append("div")
        .attr("class", "tooltip")
        .style("pointer-events", "none")
        .style("opacity", 0);

      // END tooltip

      //zoomTo([root.x, root.y, root.r * 2]);
      let virtualNodesByParentNode;
      let loadDataForNode = (d): Promise<any> => {
        if (!d.data.didLoadChildren) {

          //console.log("No children, loading.");
          let dataObject = d.data as D3Node;
          return dataObject.loadChildren().then((children) => {
            d.children = children;
            d.data.children = children;

            if ((d.data as D3NodeInterface).facettedSearch) {
              (d.data as D3NodeInterface).facettedSearch.doFilters();
            }

            // START virtual nodes
            // http://stackoverflow.com/questions/29387379/inserting-nodes-into-d3-pack-layout-pagination-on-zoom
            // http://fiddle.jshell.net/wfvwgqb9/2/
            virtualNodesByParentNode = (d3NodeParentElement, nodeChildrenElementArray) => {
              //root.children[0].children[0].children = subnode_subnodes; already happened
              // we need to do this because otherwise, the parent node object will be changed
              let d3NodeParentElementClone = Object.assign(Object.create(d3NodeParentElement), d3NodeParentElement);
              // Mach mir nen pack
              let pack = d3.pack()
                .size([d3NodeParentElementClone.r * 2 - (d3NodeParentElementClone.r * 2 * .1), d3NodeParentElementClone.r * 2 - (d3NodeParentElementClone.r * 2 * .1)])
              //.padding(1); // -1 is important to avoid edge overlap
              pack.padding(function (d: any) {
                return d.r / transform.k * .002;
              })

              d3NodeParentElementClone.children = nodeChildrenElementArray;

              d3NodeParentElementClone = d3.hierarchy(d3NodeParentElementClone) // Macht ne hierachie aus den daten/Erweitert daten mit werten wie data,depth, height, parent usw
                .sum(function (d: any) {
                  return d.size;
                });
              // .sort(function (a, b) {
              //   if(a.data.type() < b.data.type()) return -1;
              //   if(a.data.type() > b.data.type()) return 1;
              //   return 0;
              // });

              let nodes = pack(d3NodeParentElementClone).descendants();
              // absolute x,y coordinates calculation
              let curChildnode;
              for (let i = 1; i < nodes.length; i++) {
                curChildnode = nodes[i];
                curChildnode.x = curChildnode.x - nodes[0].x + d3NodeParentElement.x;
                curChildnode.y = curChildnode.y - nodes[0].y + d3NodeParentElement.y;
                curChildnode.depth = d3NodeParentElement.depth + 1;
                curChildnode.parent = d3NodeParentElement;
              }
              nodes.splice(0, 1);


              return nodes;
            };
            // END virtual nodes

            // START add nodes
            let virtualNodes = virtualNodesByParentNode(d, children);
            d.children = virtualNodes;
            nodes.push.apply(nodes, virtualNodes);
            //text.remove();
            makeCirclesAndText(nodes);
            // zoom to current focus again (do the transformation of the updated elements)
            //zoomTo(view);
            zoomed();
            // END add nodes
            return new Promise<any>((resolve) => {
              resolve(true);
            });
          }).catch((error) => {
            console.log(error)
            console.log(error.text())
          });
        } else {
          //console.log("Already loaded, only zooming");
          return new Promise<any>((resolve) => {
            resolve(true);
          });
        }
      };

      this.zoomToNode = (d, selection) => {
        console.log(d, selection)
        let k = this.width / ((d.r ) * 2);
        //radius der circle = return d.r * transform.k;
        // this.width = d.r * k
        // this.w / d.r


        //return "translate(" + ((transform.x + d.x * transform.k) - radius) + "," + ((transform.y + d.y * transform.k ) - radius) + ")";
        // transformOfParent + radius = transform.x + d.x * transform.k
        // parentX = (transform.x + d.x * k) - radius
        //
        // parentX + radius - (d.x * k) = transform.x

        let transformOfParent = d3.select(selection.parentNode).attr("transform").replace("translate(", "").replace(")", "").split(",")
        let parentX = parseFloat(transformOfParent[0])
        let parentY = parseFloat(transformOfParent[1]);

        let t = {
          x: (parentX + radius - ((d.x ) * k)),
          y: (parentY + radius - ((d.y ) * k)),
          k: k
        }
        // console.log("transparent",transformOfParent,parentX, parentY )
        // console.log("t", t)
        if (parentX && parentY) {

          //call()
          svg.transition().duration(750).call(d3zoom.transform as any, d3.zoomIdentity.translate(t.x, t.y).scale(t.k))

        }


        // k
        //   :
        //   8.574211496120679
        // x
        //   :
        //   -1409.4885302610078
        // y
        //   :
        //   -431.7854057568835


      };


      /**
       * Zoom to node d
       * @param d
       */
      let zoom = (d) => {
        //let focus0 = focus;
        focus = d;

        // START The zoom
        let transition = d3.transition("bla")
          .duration(750)
          .tween("zoom", function () {
            let i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]); // was focus.r * 2 + margin
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
      };

      // START Old zoom
      function zoomTo(v) { // v ) [x,y, diameter] of circle
        let k = diameter / v[2]; // Fa
        view = v;
        node.attr("transform", function (d: any) {
          return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function (d: any) {
          return d.r * k;
        });
      }

      // END Old zoom
    });
  }

}
