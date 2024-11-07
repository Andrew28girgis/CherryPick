import { Component } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
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
  
  constructor() {
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

  
  changeCollapse(): void {
    this.collapse = !this.collapse; 
  }

  logout(): void {
    // Implement logout logic here
  }

  

  getConnectedLists(currentId: string) {
    return this.lists
      .map(list => list.id)
      .filter(id => id !== currentId);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      return;
    } 

    const previousList = this.lists.find(list => list.id === event.previousContainer.id);
    const currentList = this.lists.find(list => list.id === event.container.id);

    if (previousList && currentList) {
      const movedItem = previousList.items.splice(event.previousIndex, 1)[0];
      currentList.items.splice(event.currentIndex, 0, movedItem);
    }
  }
 

  
}
