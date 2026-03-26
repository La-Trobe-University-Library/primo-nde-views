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
    // get the filters from the store and listen for changes
    this.store.select(state => state?.Search?.filter?.filters)
      .subscribe((filters: any[]) => {
        // get the tlevel filter values
        const tlevel = filters?.find(f => f.name === 'tlevel');
        this.filters = tlevel?.values ?? [];

        // get the newrecords filter values and add them to the filters array
        const newrecords = filters?.find(f => f.name === 'newrecords');
        if (newrecords) {
          this.filters = this.filters.concat(newrecords.values);
        }

        // update the DOM with the new counts
        this.injectCountsIntoDom();
      });
  }
  
  ngAfterViewInit() {
    const targetNode = document.querySelector('nde-search-filters-side-nav') as HTMLElement | null;

    if (!targetNode) {
      // if it's not in the DOM yet, set a timeout to recheck`
      setTimeout(() => this.ngAfterViewInit(), 100);
      return;
    }

    // create a MutationObserver to watch for changes in the filters sidebar
    const observer = new MutationObserver((mutations) => {
      this.injectCountsIntoDom();
    });
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }

  private injectCountsIntoDom() {
    if (!this.filters?.length) return;

    this.filters.forEach(element => {
      // format count with commas
      const countWithCommas = element.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      //console.log(`Injecting count for ${element.value}: ${countWithCommas}`);

      // create the count span (with a tilde as it's an approximation)
      const countSpan = this.renderer.createElement('span');
      this.renderer.addClass(countSpan, 'filter-results-count');
      this.renderer.setAttribute(countSpan, '_ngcontent-ng-c3162346997', '');
      const text = this.renderer.createText(`(~${countWithCommas})`);
      this.renderer.appendChild(countSpan, text);

      // find the target element in the DOM (either tlevel or newrecords)
      let target = document.querySelector(`nde-filters-value:has([data-qa="tlevel.${element.value}"]) .mdc-label > div`);
      if (!target) target = document.querySelector(`nde-filters-value:has([data-qa="newrecords.${element.value}"]) .mdc-label > div`);
      if (!target) return;

      // prevent any duplicates
      if (target.querySelector('.filter-results-count')) return;

      // append count
      this.renderer.appendChild(target, countSpan);
    });
  }
}
