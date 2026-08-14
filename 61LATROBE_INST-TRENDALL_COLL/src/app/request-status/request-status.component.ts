import { Component, AfterViewInit, OnDestroy, Renderer2, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'custom-request-status',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [],
  templateUrl: './request-status.component.html',
  styleUrl: './request-status.component.scss'
})
export class RequestStatusComponent implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  constructor(
    private store: Store<any>,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    // check if the requests lists is on the page (with or without results)
    const requestResults = document.querySelector('nde-requests-page nde-account-section-results, nde-requests-page nde-no-results, nde-requests-overview .no-items-to-display, nde-requests-overview mat-card-content ul');

    if (!requestResults) {
      // if it's not in the DOM yet, set a timeout to recheck
      setTimeout(() => this.ngAfterViewInit(), 100);
      return;
    }

    this.store
      .select(state => state?.account?.requestsList)
      .pipe(takeUntil(this.destroy$))
      .subscribe(requestList => {
        //console.log('RequestList: '+requestList[0].type);
        this.updateRequestItems(requestList ?? []);
      }); 
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateRequestItems(requestList: any[]): void {
    let requestItems = document.querySelectorAll('div[data-qa="requests-item-status-indication"]');
    if(requestItems.length == 0) requestItems = document.querySelectorAll('nde-requests-overview a.item-details h4');

    requestItems.forEach((el, index) => {
      const request = requestList[index];
      if (!request) return;

      //console.log('Request type: ', request.type);

      let statusText: string = "Request created";
      switch(request.type) {
        case 'holds':
          statusText = 'In process';
          break;
        case 'ill':
          statusText = 'Pending';
          break;
      }

      let fullStatusText = '<p class="updated-request-status"><strong>Status:</strong> '+statusText+'</p>';

      this.renderer.setProperty(el, 'innerHTML', fullStatusText);
    });
  }
}
