import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailabilityCountComponent } from './availability-count.component';

describe('AvailabilityCountComponent', () => {
  let component: AvailabilityCountComponent;
  let fixture: ComponentFixture<AvailabilityCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilityCountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvailabilityCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
