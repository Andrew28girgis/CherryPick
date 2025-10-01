import { Component } from '@angular/core';
interface TreeNode {
  name: string;
  role: string;
  children?: TreeNode[];
}

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.css'
})

export class TreeComponent {
  
  treeData: TreeNode[] = [
    {
      name: 'Eleanor Vance',
      role: 'CEO',
      children: [
        {
          name: 'Marcus Thorne',
          role: 'CTO',
          children: [
            {
              name: 'Isabella Rossi',
              role: 'VP of Engineering',
              children: [
                { name: 'Liam Chen', role: 'Frontend Lead' },
                { name: 'Sophia Ngo', role: 'Backend Lead' },
              ],
            },
            {
              name: 'Javier Gomez',
              role: 'VP of Infrastructure',
              children: [
                { name: 'Aiden Patel', role: 'DevOps Lead' },
              ]
            },
          ],
        },
        {
          name: 'Camila Rodriguez',
          role: 'CFO',
          children: [
            { name: 'Owen Jin', role: 'Head of Accounting' },
            { name: 'Ava Fischer', role: 'Head of Finance' },
          ],
        },
        {
            name: 'Noah Williams',
            role: 'COO',
            children: [
                { name: 'Harper Kim', role: 'Head of Operations' }
            ]
        }
      ],
    },
  ];
}
