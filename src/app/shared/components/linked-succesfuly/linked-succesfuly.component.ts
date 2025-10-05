import { Component } from '@angular/core';

@Component({
  selector: 'app-linked-succesfuly',
  standalone: true,
  imports: [],
  templateUrl: './linked-succesfuly.component.html',
  styleUrl: './linked-succesfuly.component.css'
})
export class LinkedSuccesfulyComponent {
  closeTab() {
    window.close();
  }
}
