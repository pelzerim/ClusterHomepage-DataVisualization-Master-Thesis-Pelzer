/**
 * Created by immanuelpelzer on 25.01.17.
 */
import { ModuleWithProviders }         from '@angular/core';
import { Routes, RouterModule }        from '@angular/router';
import {HomeComponent} from "./components/home/home.component";

const appRoutes: Routes = [
  { path: '', component: HomeComponent }
];

export const appRoutingProviders: any[] = [
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
