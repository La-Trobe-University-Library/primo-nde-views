import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseHomePageContentComponent } from './browse-home-page-content.component';

describe('BrowseHomePageContentComponent', () => {
  let component: BrowseHomePageContentComponent;
  let fixture: ComponentFixture<BrowseHomePageContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseHomePageContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrowseHomePageContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
