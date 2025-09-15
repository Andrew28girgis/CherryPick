import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { PropertiesDetails } from 'src/app/shared/models/manage-prop-shoppingCenter';
import { UploadOM } from 'src/app/shared/models/uploadOM';

@Component({
  selector: 'app-uploadOM',
  templateUrl: './uploadOM.component.html',
  styleUrls: ['./uploadOM.component.css'],
})
export class UploadOMComponent implements OnInit {
  SubmissionId!: number;
  BrokerShoppingCenters!: UploadOM | undefined;
  uploadResponse: any = null; // Store the upload response
  isFromUpload = false; // Track if we came from file upload
  showRawJson = false; // Control JSON display toggle
  imageArray: string[] = []; // Array to hold all images

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private PlacesService: PlacesService
  ) {
    // Check if we have navigation state (from file upload)
    // const navigation = this.router.getCurrentNavigation();
    // if (navigation?.extras.state?.['uploadResponse']) {
    //   this.uploadResponse = navigation.extras.state['uploadResponse'];
    //   this.isFromUpload = true;
    // }
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: any) => {
      this.SubmissionId = params['submissionId'];
    });
    this.GetSCDataFromSubmission();

    // If we have upload response, use it; otherwise fetch data normally
    // if (this.isFromUpload && this.uploadResponse) {
    //   this.BrokerShoppingCenters = this.uploadResponse;
    //   this.showToast('File uploaded successfully!');
    // }
  }

  GetSCDataFromSubmission() {
    const body: any = {
      Name: 'GetSCDataFromSubmission',
      Params: {
        Id: this.SubmissionId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        try {
          const rawJson = data.json[0].jsonResponse;
          this.BrokerShoppingCenters = JSON.parse(rawJson) as UploadOM;
        if (this.BrokerShoppingCenters?.Images) {
            this.imageArray = this.BrokerShoppingCenters.Images.split(',').map((img: string) => img.trim());
          }
        } catch (error) {
          console.error('Failed to parse jsonResponse:', error);
        }
      },
    });
  }

  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    } else {
      console.warn('Toast elements not found in DOM.');
    }
  }
}
