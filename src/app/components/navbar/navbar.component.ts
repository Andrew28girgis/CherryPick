import { Component } from '@angular/core';
import { ConfigService } from 'src/app/services/config.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  logoUrl: string = '';
  color: string = '';
  fontFamily: string = '';
  constructor(private configService: ConfigService){}

  ngOnInit() {
    this.logoUrl = this.configService.getLogoUrl();
    this.color = this.configService.getColor();
    this.fontFamily = this.configService.getFontFamily();
  }
  
}
