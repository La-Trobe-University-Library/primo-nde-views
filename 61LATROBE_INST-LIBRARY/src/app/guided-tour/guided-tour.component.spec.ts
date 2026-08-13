import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuidedTourComponent } from './guided-tour.component';

describe('GuidedTourComponent', () => {
  let component: GuidedTourComponent;
  let fixture: ComponentFixture<GuidedTourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuidedTourComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuidedTourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
