import { Component, Input, inject, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';

@Component({
  selector: 'custom-availability-count',
  standalone: true,
  encapsulation: ViewEncapsulation.None, 
  imports: [CommonModule],
  templateUrl: './availability-count.component.html',
  styleUrl: './availability-count.component.scss'
})
  
export class AvailabilityCountComponent implements OnInit {
  @Input() private hostComponent!: any;
  public store = inject(Store);

  public filters: any[] = [];

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // output the state (for debugging)
    //this.store.select(state => state.Search)
    //  .subscribe(s => console.log('Search state:', s));

    this.store.select(state => state?.Search?.filter?.filters)
      .subscribe((filters: any[]) => {
        const tlevel = filters?.find(f => f.name === 'tlevel');
        this.filters = tlevel?.values ?? [];
        
        this.filters.forEach(element => {
          // get the count with commas
          const countWithCommas = element.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

          //console.log(`Value: ${element.value}, Count: ${countWithCommas}`);

          // create the count span
          const countSpan = this.renderer.createElement('span');
          this.renderer.addClass(countSpan, 'filter-results-count');
          this.renderer.setAttribute(countSpan, '_ngcontent-ng-c3162346997', '');
          const text = this.renderer.createText(`(~${countWithCommas})`);
          this.renderer.appendChild(countSpan, text);

          // find the target element in the DOM
          const target = document.querySelector(`nde-filters-value:has([data-qa="tlevel.${element.value}"]) .mdc-label > div`);
          console.log('Target element for value', element.value, ':', target);
          if (target) {
            this.renderer.appendChild(target, countSpan);
          }
        });
      });
  }
}
