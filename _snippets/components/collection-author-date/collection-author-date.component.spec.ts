import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionAuthorDateComponent } from './collection-author-date.component';

describe('CollectionAuthorDateComponent', () => {
  let component: CollectionAuthorDateComponent;
  let fixture: ComponentFixture<CollectionAuthorDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionAuthorDateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionAuthorDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
