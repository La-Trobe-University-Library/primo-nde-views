import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'custom-prefilled-advanced-search',
  standalone: true,
  imports: [],
  templateUrl: './prefilled-advanced-search.component.html',
  styleUrl: './prefilled-advanced-search.component.scss'
})
export class PrefilledAdvancedSearchComponent implements AfterViewInit {
  async ngAfterViewInit() {
    // if there is text in the simple search field, copy it to the Advanced search field
    const simpleSearchField = document.querySelector('#main-search-bar') as HTMLInputElement;
    if(simpleSearchField) {
      // get the text from the simple search field
      const simpleSearchTerm = simpleSearchField.value;
      console.log('simpleSearchTerm: ',simpleSearchTerm);

      const advSearchField = document.querySelector('mat-form-field.search-field input') as HTMLInputElement;
      if(advSearchField) {
        // set the text in the advanced search field to the text from the simple search field
        advSearchField.value = simpleSearchTerm;

        // trigger the input event so the form control is updated and the search button is enabled
        advSearchField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }
}
