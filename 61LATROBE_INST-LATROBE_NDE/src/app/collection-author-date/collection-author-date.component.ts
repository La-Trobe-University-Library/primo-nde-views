import { Component, Input, ViewEncapsulation } from '@angular/core';
//import { tap } from 'rxjs';

@Component({
  selector: 'custom-collection-author-date',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [],
  templateUrl: './collection-author-date.component.html',
  styleUrl: './collection-author-date.component.scss'
})
export class CollectionAuthorDateComponent {
  public author: string = '';
  public hasAuthor: boolean = false;
  public date: string = '';
  public hasDate: boolean = false;
  
  @Input() private hostComponent!: any;

  ngOnInit() {
    //console.log('CollectionAuthorDateComponent initialized with hostComponent:', this.hostComponent);

    this.setDetails();
    
    /*this.hostComponent.viewModel$?.pipe(
      tap((viewModel: any) => {
        console.log('Received viewModel in CollectionAuthorDateComponent:', JSON.stringify(viewModel));

      })
    ).subscribe();*/
  }

  private setDetails() {
    this.author = this.hostComponent.recordMainDetails?.pnx?.addata?.au?.[0] || '';
    this.date = this.hostComponent.recordMainDetails?.pnx?.display?.creationdate?.[0] || '';

    this.hasAuthor = this.author !== '';
    this.hasDate = this.date !== '';
  }
}