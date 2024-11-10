import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Kanban } from 'src/models/userKanban';
import { KanbanCard, KanbanOrganization } from 'src/models/kanbans';
@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css'],
})
export class KanbanComponent {
  sidebarItems!: any[];
  collapse!: boolean;
  lists = [
    {
      id: 'todoList',
      title: 'To Do',
      items: ['Task 1', 'Task 2', 'Task 3']
    },
    {
      id: 'inProgressList',
      title: 'In Progress',
      items: ['Task 4', 'Task 5']
    },
    {
      id: 'doneList',
      title: 'Done',
      items: ['Completed Task 1', 'Completed Task 2']
    }
  ];
  kanbans:Kanban[]=[];
  kanbanList:KanbanCard[]=[] ;
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private authService: AuthService

  ) {
    this.sidebarItems = [
      {
        title: 'Projects',
        icon: 'fa-solid fa-house',
        link: '/dashboard',
      },
      {
        title: 'Stake Holders',
        icon: 'fa-solid fa-list',
        link: '/kanban',
      },
      {
        title: 'Proper Items',
        icon: 'fa-solid fa-gear',
        link: '/settings',
      },
      {
        title: 'Tasks',
        icon: 'fa-solid fa-right-from-bracket',
        link: '/logout',
      },
      {
        title: 'Source',
        icon: 'fa-solid fa-gear',
        link: '/settings',
      },
      {
        title: 'Corpus',
        icon: 'fa-solid fa-gear',
        link: '/settings',
      },
      
    ];
    this.collapse = false;
  }


  ngOnInit(): void {
    this.GetUserKanbans();
  }
  

  GetUserKanbans(): void {
    const body: any = {
      Name: 'GetUserKanbans',
      Params: {
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.kanbans = data.json ;   
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }
  
  GetKanbanDetails(kanban:Kanban){
    const body: any = {
      Name: 'GetKanbanDetails',
      Params: {
        kanbanId: kanban.Id
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
          this.kanbanList = data.json; 
          
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  } 

  getConnectedLists(currentId: string) {
    return this.kanbanList[0].kanbanStages
      .map(stage => stage.Id.toString())
      .filter(id => id !== currentId);
  }

  drop(event: CdkDragDrop<any[]>) {
    let movedItem;
  
    if (event.previousContainer === event.container) {
      // Moving within the same container
      movedItem = event.container.data[event.previousIndex];
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to a different container
      movedItem = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
  
      // Update the kanbanStageId to reflect the new stage
      const newStageId = parseInt(event.container.id, 10); // Convert the container id to a number
      movedItem.kanbanStageId = newStageId;
    }
  
    // `movedItem` now contains the item that was moved with an updated kanbanStageId
    console.log('Moved item:', movedItem);
    console.log('After move:', this.kanbanList);
      
    // Optional: Call a function to handle the updated list
    this.postDrag(movedItem);
  }
  
  


  postDrag(movedItem:KanbanOrganization){
    
    console.log('Kanban list after drop:', movedItem);
    let body:any = {} ;
    body.json = movedItem;
    body.mainEntity = 'kanban.kanbanOrganization';
    body.name = 'kanbanOrganizations';
    body.params = {}; 

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => { 
          
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  changeCollapse(): void {
    this.collapse = !this.collapse; 
  }

  logout(): void {
    // Implement logout logic here
  }


  
}
