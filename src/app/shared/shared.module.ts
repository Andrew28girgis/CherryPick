import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidbarComponent } from '../components/sidbar/sidbar.component'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';

@NgModule({
  declarations: [SidbarComponent ,    HeaderComponent,
  ], // Declare SidbarComponent

  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule
  ],
  exports: [SidbarComponent ,HeaderComponent ] // Export SidbarComponent so other modules can use it
})
export class SharedModule {}
