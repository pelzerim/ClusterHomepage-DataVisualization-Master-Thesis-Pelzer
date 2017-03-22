import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { CirclesComponent } from './components/vis/circles/circles.component';
import { HomeComponent } from './components/home/home.component';

import { routing, appRoutingProviders } from './app.routes';
import {DataRelService} from "./services/relational/data-rel.service";

import { AccordionModule } from 'ng2-bootstrap/accordion';

@NgModule({
  declarations: [
    AppComponent,
    CirclesComponent,
    HomeComponent,
    CirclesComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    routing,
    AccordionModule.forRoot()
  ],
  providers: [appRoutingProviders, DataRelService],
  bootstrap: [AppComponent]
})
export class AppModule { }
