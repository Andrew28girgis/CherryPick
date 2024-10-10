import {
  Directive,
  ElementRef,
  HostListener,
  OnInit,
  Renderer2,
} from '@angular/core';
import { NgControl, NgModel } from '@angular/forms';

@Directive({
  selector: '[appNumberFormat]',
})
export class NumberFormatDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private control: NgControl,
    private renderer: Renderer2,
    private ngModel: NgModel
  ) {}

  ngOnInit(): void {
    const initialValue = this.ngModel.model;
    const formattedValue = initialValue
      ? initialValue
          .replace(/[^0-9]/g, '')
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : '';
    this.control.control?.setValue(formattedValue);
    this.renderer.setProperty(this.el.nativeElement, 'value', formattedValue);
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    const formattedValue = value
      .replace(/[^0-9]/g, '')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    this.control.control?.setValue(formattedValue);
    this.renderer.setProperty(this.el.nativeElement, 'value', formattedValue);
  }
}
