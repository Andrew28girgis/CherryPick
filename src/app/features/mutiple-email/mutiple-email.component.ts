import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import {
  Cotenant,
  Generated,
  ManagerOrganization,
  ShoppingCenterManager,
} from 'src/app/shared/models/emailGenerate';
import { RelationNames } from 'src/app/shared/models/emailGenerate';
import { BuyBoxOrganizationsForEmail } from 'src/app/shared/models/buyboxOrganizationsForEmail';

@Component({
  selector: 'app-mutiple-email',
  templateUrl: './mutiple-email.component.html',
  styleUrl: './mutiple-email.component.css'
})
export class MutipleEmailComponent implements OnInit {
  prompts: any[] = [];
  selectedPromptId: string = '';
  selectedPromptText: string = '';
  isLandingSelected: boolean = false;
  isISCcSelected: boolean = false;
  buyBoxId!: any;
  OrgBuybox!: any;
  bodyTemplates: string[] = [];
  bodyTemplate: string = '';
  emailBody: string = '';
  emailTemplates: {
    organizationId: number,
    template: string
  }[] = [];

  // GetBuyBoxInfo
  generated: Generated[] = [];
  ManagerOrganizationName: string = '';
  BuyBoxOrganizationName: string = '';
  selectedContactId: number = 0;
  ShoppingCenterNames: {
    CenterName: string;
    CotenantsWithActivityType: Cotenant[];
    CotenantsWithoutActivityType: Cotenant[];
    ShoppingCenterManager: ShoppingCenterManager[];
  }[] = [];
  showRelationNames: boolean = false;
  showClientProfile: boolean = false;
  showShoppingCenterDescription: boolean = false;
  showOrganizationManagers: boolean = false;
  showMangerDescriptionDetails: boolean = false;
  showMangerContactSignature: boolean = false;
  showBuyBoxDescriptionDetails: boolean = false;
  showBuyBoxDescription: boolean = false;
  ShoppingCenterDescription: any;
  ShoppingCenterName: any;
  ShoppingCenterNameText: any;
  ShoppingCenterDescriptionText: any;
  managerOrganizations: ManagerOrganization[] = [];
  showMangerDescription: boolean = false;
  MangerDescription: string = '';
  MangerSignature: string = '';
  BuyBoxDescriptionDetails: string = '';
  BuyBoxDescription: string = '';
  selectedShoppingCenter: string = '';
  groupedActivityTypes: any[] = [];

  // GetRetailRelationCategories
  relationCategoriesNames: RelationNames[] = [];
  buybox: any;
  showMinBuildingSize: boolean = false;
  showMaxBuildingSize: boolean = false;
  // GetBuyBoxOrganizationsForEmail
  shoppingCenterOrganization!: number;
  BuyBoxOrganizationsForEmail: BuyBoxOrganizationsForEmail[] = [];
  CheckGetSavedTemplates: any[] = [];
  organizationId: any;

  // updateEmailBody
  selectedContact: number[] = [];
  RepresentativeOrganizationContactsThatWillReceiveThisEmail: string =
    'Representative Organization Contacts that will receive this email:';
  showCotenantsWithActivity: boolean = false;
  showCotenantsWithoutActivity: boolean = false;


  constructor(
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
  ) {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = params.get('buyboxid');
    });
  }

  async ngOnInit() {
    this.GetPrompts();
    if (this.buyBoxId) {
      this.GetOrgbuyBox(this.buyBoxId);
    }

    this.GetBuyBoxInfo();
    this.GetRetailRelationCategories();
    this.GetBuyBoxInfoDetails();
    // this.GetBuyBoxOrganizationsForEmail();
  }
  // GetBuyBoxInfo
  GetBuyBoxInfo() {
    // this.spinner.show();
    const body: any = {
      Name: 'GetBuyBoxInfo',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.generated = data.json || [];

        this.ManagerOrganizationName =
          this.generated?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]?.ManagerOrganizationName;
        this.BuyBoxOrganizationName =
          this.generated?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.Name;
        this.selectedContactId =
          this.generated?.[0]?.Buybox?.[0]?.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]?.ManagerOrganizationContacts?.[0]?.ContactId;

        const buyBox = this.generated?.[0]?.Buybox?.[0];
        if (buyBox) {
          this.ManagerOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.ManagerOrganization?.[0]
              ?.ManagerOrganizationName || '';
          this.BuyBoxOrganizationName =
            buyBox.BuyBoxOrganization?.[0]?.Name || '';
        }

        // Extract Shopping Centers safely
        this.ShoppingCenterNames =
          this.generated?.[0]?.BuyBoxShoppingCenters?.map((center) => ({
            CenterName: center.CenterName,
            ShoppingCenterManager: center.ShoppingCenterManager || [],
            CotenantsWithActivityType: (
              center.Cotenants?.filter((co) => co.ActivityType) || []
            ).map((co) => ({ ...co, selected: false })),

            CotenantsWithoutActivityType:
              center.Cotenants?.filter((cotenant) => !cotenant.ActivityType) ||
              [],
          })) || [];

        this.generated?.[0]?.Releations?.forEach((r) => {
          r.relationSelect = true;
        });

        this.showRelationNames = true;
        this.showClientProfile = true;
        this.showOrganizationManagers = true;
        this.showShoppingCenterDescription = true;
        this.showMangerDescriptionDetails = true;
        this.showMangerContactSignature = true;
        this.onCheckShoppingCenterDescriptionChange();
        this.onOrganizationManagersChange();
        this.onMangerDescriptionDetailsChange();
        this.onMangerContactSignatureChange();
        this.showBuyBoxDescriptionDetails = true;
        this.onCheckboxBuyBoxDescriptionDetailsChange();
        this.showBuyBoxDescription = true;
        this.onCheckboxBuyBoxDescriptionChange();
        this.updateGroupedActivityTypes();
        // this.spinner.hide();
      },
    });
  }
  onCheckShoppingCenterDescriptionChange() {
    if (this.showShoppingCenterDescription) {
      if (this.generated?.[0]?.BuyBoxShoppingCenters) {
        this.ShoppingCenterDescription =
          this.generated[0].BuyBoxShoppingCenters
        // .find(
        //   (center) => Number(center.ID) === Number(this.CenterId)
        // );
        if (this.ShoppingCenterDescription) {
          const managerDescription =
            this.ShoppingCenterDescription.ShoppingCenterManager?.[0]
              ?.Description;
          const managerName =
            this.ShoppingCenterDescription.ShoppingCenterManager?.[0]?.Name;
          this.ShoppingCenterName = managerName || 'No name available';
          this.ShoppingCenterNameText = this.ShoppingCenterName;
          this.ShoppingCenterDescriptionText =
            managerDescription || 'No description available';
        } else {
          this.ShoppingCenterName = 'No name available';
          this.ShoppingCenterDescriptionText = 'No description available';
        }
      } else {
        this.ShoppingCenterName = 'No name available';
        this.ShoppingCenterDescriptionText = 'No description available';
      }
    } else {
      this.ShoppingCenterName = '';
      this.ShoppingCenterDescriptionText = '';
    }
  }
  onOrganizationManagersChange() {
    // this.spinner.show();
    if (this.showOrganizationManagers) {
      this.loadManagerOrganizations();
      this.showMangerDescription = true;
      // this.spinner.hide();
    } else {
      this.managerOrganizations = [];
      // this.spinner.hide();
    }
    this.updateEmailBody();
  }
  loadManagerOrganizations() {
    const buyBoxOrganization = this.generated[0]?.Buybox[0]?.BuyBoxOrganization;

    if (buyBoxOrganization && buyBoxOrganization.length > 0) {
      const managerData = buyBoxOrganization[0]?.ManagerOrganization;
      if (managerData && managerData.length > 0) {
        this.managerOrganizations = managerData;
        this.managerOrganizations.forEach((manager) => {
          manager.ManagerOrganizationContacts.forEach((contact) => {
            contact.selected = true;
          });
          manager.showDescription = true;
        });
      }
    }
    this.selectManagerTenantsByDefault();
  }
  selectManagerTenantsByDefault() {
    this.managerOrganizations.forEach((manager: any) => {
      manager.ManagerOrganizationContacts.forEach((contact: any) => {
        contact.assistantSelected = true;
      });
    });
    this.showMangerDescription = true;
    this.onMangerDescriptionChange();
    this.onAssistantCheckboxChange(this.managerOrganizations);
    this.onContactCheckboxChange();
  }
  onMangerDescriptionChange() {
    if (this.showMangerDescription) {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          contact.selected = true;
          if (contact.AssistantName) {
            contact.assistantSelected = true;
          }
        });
      });
    } else {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          contact.selected = false;
          contact.assistantSelected = false;
        });
      });
    }
    this.updateEmailBody();
  }
  onAssistantCheckboxChange(contact: any) {
    if (!contact.assistantSelected) {
      contact.selectedAssistantName = false;
    }
    this.updateEmailBody();
  }
  onContactCheckboxChange() {
    this.updateEmailBody();
  }
  onMangerDescriptionDetailsChange() {
    if (this.showMangerDescriptionDetails) {
      this.MangerDescription =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.ManagerOrganization[0].ManagerOrganizationDescription || '';
    } else {
      this.MangerDescription = '';
    }
    this.updateEmailBody();
  }
  onMangerContactSignatureChange() {
    if (this.showMangerContactSignature) {
      this.MangerSignature =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.ManagerOrganization[0].ManagerOrganizationDescription || '';
    } else {
      this.MangerSignature = '';
    }
    this.updateEmailBody();
  }
  onCheckboxBuyBoxDescriptionDetailsChange() {
    if (this.showBuyBoxDescriptionDetails) {
      this.BuyBoxDescriptionDetails =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]
          ?.BuyBoxOrganizationDescription || '';
    } else {
      this.BuyBoxDescriptionDetails = '';
    }
  }
  onCheckboxBuyBoxDescriptionChange() {
    if (this.showBuyBoxDescription) {
      this.BuyBoxDescription = this.generated[0]?.Buybox[0]?.Description || '';
    } else {
      this.BuyBoxDescription = '';
    }
  }
  updateGroupedActivityTypes() {
    if (!this.selectedShoppingCenter) return;
    this.groupedActivityTypes = this.getCotenantsWithActivityType(
      this.selectedShoppingCenter
    );
    // Force reset
    this.groupedActivityTypes.forEach((activity) => {
      activity.selected = false;
      activity.Cotenants.forEach((co: any) => (co.selected = false));
    });
  }
  getCotenantsWithActivityType(centerName: string): any[] {
    const center: any = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    this.groupedActivityTypes = center.CotenantsWithActivityType.reduce(
      (result: any, cotenant: any) => {
        const activityType = cotenant.ActivityType || 'Other';
        let group = result.find(
          (item: any) => item.ActivityType === activityType
        );
        if (!group) {
          group = { ActivityType: activityType, Cotenants: [] };
          result.push(group);
        }
        group.Cotenants.push(cotenant);
        return result;
      },
      []
    );
    return center ? this.groupedActivityTypes : [];
  }
  // GetRetailRelationCategories
  GetRetailRelationCategories() {
    // this.spinner.show();

    const body: any = {
      Name: 'GetRetailRelationCategories',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.relationCategoriesNames = data.json;
        this.relationCategoriesNames?.forEach((r) => (r.selected = true));
        // this.spinner.hide();
      },
    });
  }
  // GetBuyBoxInfoDetails
  GetBuyBoxInfoDetails() {
    // this.spinner.show();
    const body: any = {
      Name: 'GetWizardBuyBoxesById',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.buybox = data.json;
        this.showMinBuildingSize = true;
        this.showMaxBuildingSize = true;
        this.onCheckboxdetailsChangeMin(true, true);
        // this.spinner.hide();
      }
    });
  }
  onCheckboxdetailsChangeMin(
    showMinBuildingSize: any,
    showMaxBuildingSize: any
  ) {
    if (
      showMinBuildingSize?.target?.checked &&
      showMaxBuildingSize?.target?.checked
    ) {
      this.updateEmailBody();
    } else {
      if (
        showMinBuildingSize?.target &&
        typeof showMinBuildingSize.target.showMinBuildingSize !== 'undefined'
      ) {
        showMinBuildingSize.target.showMinBuildingSize =
          !showMinBuildingSize.target.showMinBuildingSize;
      }
      if (
        showMaxBuildingSize?.target &&
        typeof showMaxBuildingSize.target.showMinBuildingSize !== 'undefined'
      ) {
        showMaxBuildingSize.target.showMinBuildingSize =
          !showMaxBuildingSize.target.showMinBuildingSize;
      }
      this.updateEmailBody();
    }
  }
  // GetBuyBoxOrganizationsForEmail
  // async GetBuyBoxOrganizationsForEmail() {
  //   this.spinner.show();

  //   if (this.OrgBuybox && Array.isArray(this.OrgBuybox) && this.OrgBuybox.length > 0) {
  //     const organizationIds = this.OrgBuybox.map((item: any) => item.id);

  //     this.bodyTemplates = [];

  //     if (organizationIds.length > 0) {
  //       for (let id of organizationIds) {
  //         const body: any = {
  //           Name: 'GetShoppingCenterManagerContacts',
  //           MainEntity: null,
  //           Params: {
  //             buyboxid: this.buyBoxId,
  //             organizationid: id,
  //           },
  //           Json: null,
  //         };

  //         try {
  //           const data = await this.PlacesService.GenericAPI(body).toPromise();
  //           if (data?.json && Array.isArray(data.json)) {
  //             this.BuyBoxOrganizationsForEmail = data.json;

  //             // Processing contacts and centers
  //             this.BuyBoxOrganizationsForEmail[0].Contact.forEach((c: any) => {
  //               c.selected = true;
  //               c.Centers?.forEach((ShoppingCenter: any) => {
  //                 ShoppingCenter.selected = true;
  //               });
  //             });

  //             await this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);

  //             this.updateEmailBody();

  //             const currentEmailTemplate = {
  //               organizationId: id,
  //               template: this.emailBody
  //             };
  //             this.emailTemplates.push(currentEmailTemplate);
  //             this.bodyTemplates.push(this.emailBody);
  //           }
  //         } catch (error) {
  //           console.error(`Error processing organization ID: ${id}`, error);
  //         }

  //         await new Promise(resolve => setTimeout(resolve, 0));
  //       }

  //       this.spinner.hide();
  //     } else {
  //       this.spinner.hide();
  //     }
  //   } else {
  //     this.organizationId = null;
  //     this.spinner.hide();
  //   }
  // }
  async GetBuyBoxOrganizationsForEmail() {
    this.spinner.show();

    try {
      if (this.OrgBuybox && Array.isArray(this.OrgBuybox) && this.OrgBuybox.length > 0) {
        const organizationIds = this.OrgBuybox.map((item: any) => item.id);

        this.bodyTemplates = [];

        if (organizationIds.length > 0) {
          for (let id of organizationIds) {
            const body: any = {
              Name: 'GetShoppingCenterManagerContacts',
              MainEntity: null,
              Params: {
                buyboxid: this.buyBoxId,
                organizationid: id,
              },
              Json: null,
            };

            try {
              const data = await this.PlacesService.GenericAPI(body).toPromise();
              if (data?.json && Array.isArray(data.json)) {
                this.BuyBoxOrganizationsForEmail = data.json;

                this.BuyBoxOrganizationsForEmail[0].Contact.forEach((c: any) => {
                  c.selected = true;
                  c.Centers?.forEach((ShoppingCenter: any) => {
                    ShoppingCenter.selected = true;
                  });
                });

                await this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);


                this.updateEmailBody();

                const currentEmailTemplate = {
                  organizationId: id,
                  template: this.emailBody
                };
                this.emailTemplates.push(currentEmailTemplate);
                this.bodyTemplates.push(this.emailBody);
              }
            } catch (error) {
              console.error(`Error processing organization ID: ${id}`, error);
            }

            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      } else {
        this.organizationId = null;
      }
    } finally {
      this.spinner.hide();
    }
  }


  updateEmailBody() {
    let emailContent = '';
    if (this.selectedShoppingCenter) {
      emailContent += `Shopping Center Representative Organization: ${this.getManagerName(
        this.selectedShoppingCenter
      )}\n\n`;
    }

    const selectedContacts = this.BuyBoxOrganizationsForEmail[0]?.Contact || [];
    if (selectedContacts?.length > 0) {
      this.selectedContact = [];

      emailContent += `${this.RepresentativeOrganizationContactsThatWillReceiveThisEmail}\n`;

      const countSelectedContacts = selectedContacts.filter(contact => contact.selected && contact?.Centers?.length > 0).length;

      if (this.isISCcSelected == false) {
        emailContent += `- Create ${countSelectedContacts} Email For each Contact and shopping Center\n `;
      }
      selectedContacts.forEach((contact) => {
        if (contact.selected && contact?.Centers?.length > 0) {
          emailContent += `- Name: ${contact.Firstname} ${contact.Lastname}\n `;
          emailContent += `- id: ${contact.id}\n `;
          this.selectedContact.push(contact.id);
        }
        contact.Centers?.forEach((sp) => {
          if (sp.selected) {
            emailContent += ` Shopping Center: ${sp.CenterName} \n `;
          }
        });
      });

      emailContent += '\n';
    }

    if (this.showCotenantsWithActivity) {
      const anySelected = this.groupedActivityTypes.some((activity: any) =>
        activity.Cotenants.some((co: any) => co.selected)
      );

      if (anySelected) {
        emailContent += 'Cotenants in the shopping center:\n';
        this.groupedActivityTypes.forEach((activity) => {
          const selectedCotenants = activity.Cotenants.filter(
            (co: any) => co.selected
          );
          if (selectedCotenants.length > 0) {
            emailContent += `${activity.ActivityType}:\n`;
            selectedCotenants.forEach((co: any) => {
              emailContent += `- ${co.CotenantName}\n`;
            });
          }
        });
        emailContent += '\n';
      }
    }

    if (this.showCotenantsWithoutActivity) {
      const cotenantsWithout = this.getCotenantsWithoutActivityType(
        this.selectedShoppingCenter
      ).filter((co) => co.selected);
      if (cotenantsWithout.length > 0) {
        emailContent += 'Cotenants without shopping center:\n';
        cotenantsWithout.forEach((co) => {
          emailContent += `- ${co.CotenantName}\n`;
        });
      }
    }

    if (this.showClientProfile) {
      emailContent +=
        'New Tenant that wish to open on this shopping center: (' +
        this.BuyBoxOrganizationName +
        ')' +
        '\n\n';
    }

    if (this.showMinBuildingSize) {
      emailContent +=
        'The Required Min Unit Size for Lease (' +
        this.buybox?.MinBuildingSize +
        ' Sqft)' +
        '\n';
    }

    if (this.showMaxBuildingSize) {
      emailContent +=
        'The Required Max Unit Size for Lease (' +
        this.buybox?.MaxBuildingSize +
        ' Sqft)' +
        '\n\n';
    }

    if (this.showRelationNames) {
      const organizationName =
        this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]?.Name ||
        'No Organization Name';

      const categoryMap: { [key: string]: string[] } = {};
      this.relationCategoriesNames?.forEach((selectedRelation) => {
        if (selectedRelation.selected) {
          this.generated[0]?.Releations?.forEach((relation) => {
            if (
              relation.RetailRelationCategoryId === selectedRelation.id &&
              relation.relationSelect &&
              this.isRelationCategoryMatched(relation)
            ) {
              const categoryName = this.getRelationCategoryName(
                relation.RetailRelationCategoryId
              );

              if (!categoryMap[categoryName]) {
                categoryMap[categoryName] = [];
              }
              categoryMap[categoryName].push(relation.Name);
            }
          });
        }
      });

      // Build the email content
      for (const category in categoryMap) {
        // Add organization name and category
        emailContent += `${organizationName} ${category}\n`;
        // Add the relations under this category
        categoryMap[category].forEach((relationName) => {
          emailContent += `- ${relationName}\n`;
        });
        emailContent += '\n'; // Add spacing between categories
      }
    }

    if (this.showOrganizationManagers) {
      this.managerOrganizations.forEach((manager) => {
        emailContent +=
          this.BuyBoxOrganizationName +
          ` Representative Brokerage Company: ${manager.ManagerOrganizationName}\n\n`;

        manager.ManagerOrganizationContacts.forEach((contact) => {
          if (contact.selected) {
            emailContent += `Broker on Charge Assistant that is sending this email: ${contact.Firstname} ${contact.LastName}\n\n`;
          }
        });
      });
    }

    if (this.showMangerDescriptionDetails) {
      this.managerOrganizations.forEach((manager) => {
        emailContent += `${manager.ManagerOrganizationName} Description: ${this.MangerDescription}\n`;
      });
    }

    if (this.showBuyBoxDescriptionDetails) {
      emailContent +=
        this.BuyBoxOrganizationName +
        ' Description: (' +
        this.BuyBoxDescriptionDetails +
        ')' +
        '\n\n';
    }

    if (this.showBuyBoxDescription) {
      emailContent +=
        'BuyBox Description: (' + this.BuyBoxDescription + ')' + '\n\n';
    }

    if (this.showShoppingCenterDescription) {
      emailContent +=
        this.ShoppingCenterName +
        ' Description: (' +
        this.ShoppingCenterDescriptionText +
        ')' +
        '\n\n';
    }

    if (this.showMangerContactSignature) {
      this.managerOrganizations.forEach((manager) => {
        manager.ManagerOrganizationContacts.forEach((contact) => {
          if (contact.selected) {
            emailContent += `\nUse This Email Signature:\n`;
            emailContent += `${contact.EmailSignature}\n\n`;
          }
        });
      });
    }

    if (this.isLandingSelected) {
      const landingLink = 'https://cp.cherrypick.com/tenant/' + this.buyBoxId;
      emailContent += `\nLanding page: <a href="${landingLink}">${landingLink}</a>`;
    }

    this.emailBody = emailContent;
  }

  async OnCheckGetSavedTemplates(organizationid: number): Promise<void> {
    // this.spinner.show();

    const body: any = {
      Name: 'GetSavedTemplates',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
        organizationid: organizationid,
      },
      Json: null,
    };

    return new Promise((resolve, reject) => {
      this.PlacesService.GenericAPI(body).subscribe({
        next: (data) => {
          this.CheckGetSavedTemplates = data.json;
          // this.spinner.hide();
          resolve();
        },
        error: (err) => {
          console.error('Error in OnCheckGetSavedTemplates:', err);
          // this.spinner.hide();
          reject(err);
        }
      });
    });
  }

  // updateEmailBody
  getManagerName(centerName: string): string {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return center?.ShoppingCenterManager?.[0]?.Name || 'No Manager';
  }

  getCotenantsWithoutActivityType(centerName: string): Cotenant[] {
    const center = this.ShoppingCenterNames.find(
      (c) => c.CenterName === centerName
    );
    return center ? center.CotenantsWithoutActivityType : [];
  }

  isRelationCategoryMatched(relation: any): boolean {
    return this.relationCategoriesNames.some(
      (category) => category.id === relation.RetailRelationCategoryId
    );
  }

  getRelationCategoryName(id: number): string {
    const category = this.relationCategoriesNames.find(
      (category) => category.id === id
    );
    return category ? category.name : 'Unknown Category';
  }

  // updateEmailBody() {
  //   let emailContent = '';
  //   if (this.selectedShoppingCenter) {
  //     emailContent += `Shopping Center Representative Organization: ${this.getManagerName(
  //       this.selectedShoppingCenter
  //     )}\n\n`;
  //   }

  //   const selectedContacts = this.BuyBoxOrganizationsForEmail[0]?.Contact || [];
  //   if (selectedContacts?.length > 0) {
  //     this.selectedContact = [];

  //     emailContent += `${this.RepresentativeOrganizationContactsThatWillReceiveThisEmail}\n`;

  //     const countSelectedContacts = selectedContacts.filter(contact => contact.selected && contact?.Centers?.length > 0).length;

  //     if (this.isISCcSelected == false) {
  //       emailContent += `- Create ${countSelectedContacts} Email For each Contact and shopping Center\n `;
  //     }
  //     selectedContacts.forEach((contact) => {
  //       if (contact.selected && contact?.Centers?.length > 0) {

  //         emailContent += `- Name: ${contact.Firstname} ${contact.Lastname}\n `;
  //         emailContent += `- id: ${contact.id}\n `;
  //         this.selectedContact.push(contact.id);
  //       }
  //       contact.Centers?.forEach((sp) => {
  //         if (sp.selected) {
  //           emailContent += ` Shopping Center: ${sp.CenterName} \n `;
  //         }
  //       });
  //     });

  //     emailContent += '\n';
  //   }

  //   if (this.showCotenantsWithActivity) {
  //     const anySelected = this.groupedActivityTypes.some((activity: any) =>
  //       activity.Cotenants.some((co: any) => co.selected)
  //     );

  //     if (anySelected) {
  //       emailContent += 'Cotenants in the shopping center:\n';
  //       this.groupedActivityTypes.forEach((activity) => {
  //         const selectedCotenants = activity.Cotenants.filter(
  //           (co: any) => co.selected
  //         );
  //         if (selectedCotenants.length > 0) {
  //           emailContent += `${activity.ActivityType}:\n`;
  //           selectedCotenants.forEach((co: any) => {
  //             emailContent += `- ${co.CotenantName}\n`;
  //           });
  //         }
  //       });
  //       emailContent += '\n';
  //     }
  //   }

  //   if (this.showCotenantsWithoutActivity) {
  //     const cotenantsWithout = this.getCotenantsWithoutActivityType(
  //       this.selectedShoppingCenter
  //     ).filter((co) => co.selected);
  //     if (cotenantsWithout.length > 0) {
  //       emailContent += 'Cotenants without shopping center:\n';
  //       cotenantsWithout.forEach((co) => {
  //         emailContent += `- ${co.CotenantName}\n`;
  //       });
  //     }
  //   }

  //   if (this.showClientProfile) {
  //     emailContent +=
  //       'New Tenant that wish to open on this shopping center: (' +
  //       this.BuyBoxOrganizationName +
  //       ')' +
  //       '\n\n';
  //   }

  //   if (this.showMinBuildingSize) {
  //     emailContent +=
  //       'The Required Min Unit Size for Lease (' +
  //       this.buybox?.MinBuildingSize +
  //       ' Sqft)' +
  //       '\n';
  //   }

  //   if (this.showMaxBuildingSize) {
  //     emailContent +=
  //       'The Required Max Unit Size for Lease (' +
  //       this.buybox?.MaxBuildingSize +
  //       ' Sqft)' +
  //       '\n\n';
  //   }

  //   if (this.showRelationNames) {
  //     const organizationName =
  //       this.generated[0]?.Buybox[0]?.BuyBoxOrganization[0]?.Name ||
  //       'No Organization Name';

  //     const categoryMap: { [key: string]: string[] } = {};
  //     this.relationCategoriesNames?.forEach((selectedRelation) => {
  //       if (selectedRelation.selected) {
  //         this.generated[0]?.Releations?.forEach((relation) => {
  //           if (
  //             relation.RetailRelationCategoryId === selectedRelation.id &&
  //             relation.relationSelect &&
  //             this.isRelationCategoryMatched(relation)
  //           ) {
  //             const categoryName = this.getRelationCategoryName(
  //               relation.RetailRelationCategoryId
  //             );

  //             if (!categoryMap[categoryName]) {
  //               categoryMap[categoryName] = [];
  //             }
  //             categoryMap[categoryName].push(relation.Name);
  //           }
  //         });
  //       }
  //     });

  //     // Build the email content
  //     for (const category in categoryMap) {
  //       // Add organization name and category
  //       emailContent += `${organizationName} ${category}\n`;
  //       // Add the relations under this category
  //       categoryMap[category].forEach((relationName) => {
  //         emailContent += `- ${relationName}\n`;
  //       });
  //       emailContent += '\n'; // Add spacing between categories
  //     }
  //   }

  //   if (this.showOrganizationManagers) {
  //     this.managerOrganizations.forEach((manager) => {
  //       emailContent +=
  //         this.BuyBoxOrganizationName +
  //         ` Representative Brokerage Company: ${manager.ManagerOrganizationName}\n\n`;

  //       manager.ManagerOrganizationContacts.forEach((contact) => {
  //         if (contact.selected) {
  //           emailContent += `Broker on Charge Assistant that is sending this email: ${contact.Firstname} ${contact.LastName}\n\n`;
  //         }
  //       });
  //     });
  //   }

  //   if (this.showMangerDescriptionDetails) {
  //     this.managerOrganizations.forEach((manager) => {
  //       emailContent += `${manager.ManagerOrganizationName} Description: ${this.MangerDescription}\n`;
  //     });
  //   }

  //   if (this.showBuyBoxDescriptionDetails) {
  //     emailContent +=
  //       this.BuyBoxOrganizationName +
  //       ' Description: (' +
  //       this.BuyBoxDescriptionDetails +
  //       ')' +
  //       '\n\n';
  //   }

  //   if (this.showBuyBoxDescription) {
  //     emailContent +=
  //       'BuyBox Description: (' + this.BuyBoxDescription + ')' + '\n\n';
  //   }

  //   if (this.showShoppingCenterDescription) {
  //     emailContent +=
  //       this.ShoppingCenterName +
  //       ' Description: (' +
  //       this.ShoppingCenterDescriptionText +
  //       ')' +
  //       '\n\n';
  //   }

  //   if (this.showMangerContactSignature) {
  //     this.managerOrganizations.forEach((manager) => {
  //       manager.ManagerOrganizationContacts.forEach((contact) => {
  //         if (contact.selected) {
  //           emailContent += `\nUse This Email Signature:\n`;
  //           emailContent += `${contact.EmailSignature}\n\n`;
  //         }
  //       });
  //     });
  //   }

  //   if (this.isLandingSelected) {
  //     const landingLink = 'https://cp.cherrypick.com/tenant/' + this.buyBoxId;
  //     emailContent += `\nLanding page: <a href="${landingLink}">${landingLink}</a>`;
  //   }

  //   this.emailBody = emailContent;
  // }


  GetPrompts() {
    // this.spinner.show();
    const categoryBody = {
      name: 'GetPromptsCategoryId',
      params: {
        Name: 'Availability',
      },
    };
    this.PlacesService.GenericAPI(categoryBody).subscribe({
      next: (catResponse: any) => {
        const categoryId = catResponse?.json?.[0]?.Id;
        if (!categoryId) {
          // this.spinner.hide();
          return;
        }
        const promptsBody = {
          name: 'GetPrompts',
          MainEntity: null,
          params: {
            Id: categoryId,
          },
          Json: null,
        };
        this.PlacesService.GenericAPI(promptsBody).subscribe({
          next: (promptsResponse: any) => {
            const promptsData = promptsResponse?.json || [];
            if (promptsData.length > 0) {
              this.prompts = promptsData.map((prompt: any) => ({
                id: prompt?.Id || null,
                name: prompt?.Name || 'Unnamed Prompt',
                promptText: prompt?.PromptText || 'No prompt text available',
              }));
            } else {
              this.prompts = [];
            }
            // this.spinner.hide();
          }
        });
      }
    });
  }

  updatePrompt() {
    const selectedPrompt = this.prompts.find(
      (prompt) => prompt.id == this.selectedPromptId
    );
    if (selectedPrompt) {
      this.selectedPromptText =
        selectedPrompt.promptText || 'No prompt text available';
    } else {
      this.selectedPromptText = 'No prompt text available';
    }
  }

  GetOrgbuyBox(buyboxId: number): void {
    // this.spinner.show();
    const body: any = {
      Name: 'GetOrganizationsByBuyBox',
      MainEntity: null,
      Params: {
        BuyBoxId: buyboxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.OrgBuybox = data.json;
          this.GetBuyBoxOrganizationsForEmail();
          // this.spinner.hide();
        } else {
          this.OrgBuybox = [];
          // this.spinner.hide();
        }
      },
    });
  }
  GenerateEmailall: any;

  // GenerateEmail() {
  //   // this.spinner.show();

  //   this.updateEmailBody();
  //   if (!this.selectedPromptId) {
  //     this.showToast('Please select a prompt to Generate.');
  //     // this.spinner.hide();
  //     return;
  //   }

  //   const promptId = Number(this.selectedPromptId);
  //   const IsCC = this.isISCcSelected;
  //   console.log(this.emailTemplates);
  //   const context = '';
  //   const OrganizaitonsId =;

  //   console.log('isISCcSelected', IsCC);
  //   console.log('promptId', promptId);
  //   console.log('context', context);
  //   console.log('OrganizaitonsId', OrganizaitonsId);

  //   this.PlacesService.generateEmail(promptId, context, OrganizaitonsId, IsCC).subscribe({
  //     next: (data: any) => {
  //       console.log(data);
  //       this.GenerateEmailall= data;

  //       // this.emailSubject = data?.emailSubject || 'No subject received';
  //       // let generatedBody = data?.emailBody || '';


  //       // this.emailBodyResponse = generatedBody;

  //       // if (this.isLandingSelected) {
  //       //   this.emailBodyResponse += landingSnippet;
  //       // }

  //       // this.emailId = data?.id || 'No body received';
  //       this.spinner.hide();
  //     },
  //   });
  //   // this.spinner.hide();
  // }
  GenerateEmail() {
    this.updateEmailBody();

    if (!this.selectedPromptId) {
      this.showToast('Please select a prompt to Generate.');
      return;
    }

    const promptId = Number(this.selectedPromptId);
    const IsCC = this.isISCcSelected;

    this.emailTemplates.forEach((emailTemplate, index) => {
      const context = emailTemplate.template;
      const OrganizaitonsId = emailTemplate.organizationId;
      this.PlacesService.generateEmail(promptId, context, OrganizaitonsId, IsCC)
        .subscribe({
          next: (data: any) => {
            console.log(`Response for template ${index}:`, data);
            this.GenerateEmailall = data;
          },
          error: (error: any) => {
            console.error(`Error for template ${index}:`, error);
          }
        });
    });
  }

  objectEmailSavedtemplate :any;
  SaveTemplate(emailItem: any) {
    this.spinner.show();
    let contactId: any;
    this.managerOrganizations[0].ManagerOrganizationContacts.forEach((c) => {
      if (c.selected) {
        contactId = c.ContactId;
      }
    });
    let contacts = emailItem.recieverIds.join(',');
    var body: any = {
      Name: 'SaveTemplate',
      MainEntity: null,
      Params: {
        // organizationid: this.shoppingCenterOrganization,
        Body: emailItem.emailBody,
        subject: emailItem.emailSubject,
        buyboxid: this.buyBoxId,
        contactid: contactId,
        contactids: contacts,
      },
      Json: null,
    };


    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.showToast('Email Saved successfully!');
        this.objectEmailSavedtemplate = data?.json[0];
        this.GenerateEmailall = this.GenerateEmailall.filter((item: any) => item !== emailItem);
        this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
        this.spinner.hide();
      },
    });
  }

  SaveAndSendTemplate(recieverIds?: any) {
    this.SaveTemplate(recieverIds);
    setTimeout(() => {
      const body = {
        name: 'SendTemplate',
        params: {
          id: +this.objectEmailSavedtemplate?.templateId,
        },
      };
      this.PlacesService.GenericAPI(body).subscribe({
        next: (response: any) => {
          this.OnCheckGetSavedTemplates(this.BuyBoxOrganizationsForEmail[0].Id);
          this.showToast('Email Save and Send successfully!');
          this.MoveStage();
        }
      });
    }, 2000);
  }

  MoveStage() {
    const body = {
      name: 'ChangeDealStage',
      params: {
        stageid: 8,
        // microdealid: this.microDealId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (response: any) => { },
    });
  }


  SendEmailTemplate() {
    console.log(this.emailTemplates);
  }

  onIncludeLandingChange(event: any): void {
    this.isLandingSelected = event.target.checked;

    const landingLink = 'https://cp.cherrypick.com/tenant/' + this.buyBoxId;

    if (!this.emailBody) {
      this.emailBody = "";
    }

    if (event.target.checked) {
      if (!this.emailBody.includes(landingLink)) {
        this.emailBody += `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;
      }
    } else {
      const snippet = `<br>Landing page: <a href="${landingLink}">${landingLink}</a>`;
      this.emailBody = this.emailBody.replace(snippet, '');
    }

    this.updateEmailTemplates();
  }

  onISCCChange(event: any): void {
    this.isISCcSelected = event.target.checked;
    this.updateEmailBody();
    this.updateEmailTemplates();
  }

  updateEmailTemplates() {
    this.emailTemplates.forEach((template) => {
      template.template = this.emailBody;
    });
  }

  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage!.innerText = message;
    toast!.classList.add('show');
    setTimeout(() => {
      toast!.classList.remove('show');
    }, 3000);
  }

  closeToast() {
    const toast = document.getElementById('customToast');
    toast!.classList.remove('show');
  }
}
