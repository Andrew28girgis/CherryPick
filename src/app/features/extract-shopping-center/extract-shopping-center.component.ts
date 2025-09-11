import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { shoppingCenterDTO } from 'src/app/shared/models/shoppingCenterData';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-extract-shopping-center',
  templateUrl: './extract-shopping-center.component.html',
  styleUrls: ['./extract-shopping-center.component.css'],
})
export class ExtractShoppingCenterComponent implements OnInit {
  shoppingId: number | null = null;
  shoppingData: shoppingCenterDTO[] = [];
  galleryImages: string[] = [];
  @ViewChild('galleryModal', { static: false }) galleryModal!: TemplateRef<any>;

  constructor(
    public activatedRoute: ActivatedRoute,
    private placesService: PlacesService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.shoppingId = id !== null ? Number(id) : null;
    });
    this.GetShoppingCenterData();
  }

  GetShoppingCenterData() {
    const body: any = {
      Name: 'GetShoppingCenterData',
      Params: {
        ShoppingCenterId: this.shoppingId,
      },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.shoppingData = res.json;
        // Initialize maps and other UI elements here
      },
    });
  }

  hasContacts(): boolean {
    if (!this.shoppingData[0]?.Place) return false;
    return this.shoppingData[0].Place.some(
      (place: any) =>
        place.C && place.C.some((c: any) => c.CO && c.CO.length > 0)
    );
  }
  openGallery() {
    if (this.shoppingData[0]?.Images) {
      // Split the images string into an array
      this.galleryImages = this.shoppingData[0].Images.split(',');
      this.modalService.open(this.galleryModal, { size: 'xl', centered: true });
    }
  }
}
