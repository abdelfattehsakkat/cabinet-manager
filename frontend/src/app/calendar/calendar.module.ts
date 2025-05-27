import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarViewComponent } from './calendar-view/calendar-view.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  { path: '', component: CalendarViewComponent }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    CalendarViewComponent
  ]
})
export class CalendarModule { }
