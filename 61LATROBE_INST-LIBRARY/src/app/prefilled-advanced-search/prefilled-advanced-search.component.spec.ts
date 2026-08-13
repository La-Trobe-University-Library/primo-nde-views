import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrefilledAdvancedSearchComponent } from './prefilled-advanced-search.component';

describe('PrefilledAdvancedSearchComponent', () => {
  let component: PrefilledAdvancedSearchComponent;
  let fixture: ComponentFixture<PrefilledAdvancedSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrefilledAdvancedSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrefilledAdvancedSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
