import { Component } from '@angular/core';
import { PlacesService } from '../../../../../src/app/services/places.service';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

 @Component({
  selector: 'app-buybox-details',
  templateUrl: './buybox-details.component.html',
  styleUrls: ['./buybox-details.component.css']
})
export class BuyboxDetailsComponent {
  buybox:any;
  buyBoxId!: number | null;
  managerOrganizationId!:number| null;
  organizationId!:number| null;
  Obj:any;
  buyBoxes:any[]=[];
  contacts:any[] = []


  constructor(    private route: ActivatedRoute,
    private modalService: NgbModal, 
    private PlacesService: PlacesService, ){
    
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = +params.get('buyboxid')!;
    });
    this.GetBuyBoxInfo(); 
    this.GetBuyBoxContacts();
  }

  openEditProperty(content: any, modalObject: any) {
     this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      scrollable: true,
    });
    // Initialize Obj with default values if properties are null
    this.Obj = {
      ...modalObject,
      MinBuildingSize: modalObject.MinBuildingSize ?? 0, // Default to 0
      MaxBuildingSize: modalObject.MaxBuildingSize ?? 0, // Default to 0
    };
    // console.log('Modal Object:', this.Obj); // Ensure Obj has updated fields
  }

  GetBuyBoxInfo() {
     const body: any = {
      Name: 'GetWizardBuyBoxesById',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data:any) => {
        this.buybox = data.json;
        // console.log(`bb`);
        // console.log(this.buybox);
        
        

        // console.log(this.buybox );
        
        this.managerOrganizationId=data.json.ManagerOrganizationId;
        this.organizationId=data.json.OrganizationId;
        //  console.log('Buybox data:', this.buybox);
      },
      error: (err) => {
        console.error('Error fetching buybox info:', err);
       },
    });
  } 

  onSubmit() { 
      const body: any = {
        Name: 'UpdateBuyBox',
        Params: {
          Name: this.Obj.Name,
          OrganizationId: this.Obj.OrganizationId,
          ManagerOrganizationId: this.Obj.ManagerOrganizationId,
          MinBuildingSize: this.Obj.MinBuildingSize,
          MaxBuildingSize: this.Obj.MaxBuildingSize,
          buyboxid: this.Obj.Id,
          Description: this.Obj.Description,
        },
      };
      
      this.PlacesService.GenericAPI(body).subscribe({
        next: (data) => {
          if (data.error) {
            alert('Failed To Update Data');
          } else {
            // console.log('Buybox updated successfully:', this.Obj);
  
            // Update the buybox in the displayed list
            const index = this.buyBoxes.findIndex((item) => item.Id == this.Obj.Id);
            if (index !== -1) {
              this.buyBoxes[index] = { ...this.Obj };
            }
            
            // Update the currently displayed buybox details
            if (this.buybox.Id === this.Obj.Id) {
              this.buybox = { ...this.Obj };
            }
  
            this.closeModal();
          }
        }
      });
     
  }

  closeModal()
  { 
    this.modalService.dismissAll();
  }
  GetBuyBoxContacts() {
    const body: any = {
     Name: 'GetBuyBoxInfo',
     MainEntity: null,
     Params: {
       buyboxid: this.buyBoxId,
     },
     Json: null,
   };
   this.PlacesService.GenericAPI(body).subscribe({
     next: (data:any) => {
      this.contacts = data.json?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]?.ManagerOrganizationContacts;
     },
     error: (err) => {
       console.error('Error fetching buybox info:', err);
      },
   });
  
 }
}
