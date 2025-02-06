import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidbarComponent } from '../components/sidbar/sidbar.component'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SidbarComponent], // Declare SidbarComponent
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [SidbarComponent] // Export SidbarComponent so other modules can use it
})
export class SharedModule {}
