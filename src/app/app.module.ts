import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { CirclesComponent } from './components/vis/circles/circles.component';
import { HomeComponent } from './components/home/home.component';

import { routing, appRoutingProviders } from './app.routes';
import {DataRelService} from "./services/relational/data-rel.service";


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
    routing
  ],
  providers: [appRoutingProviders, DataRelService],
  bootstrap: [AppComponent]
})
export class AppModule { }
