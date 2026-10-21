import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomNoticeComponent } from './custom-notice.component';

describe('CustomNoticeComponent', () => {
  let component: CustomNoticeComponent;
  let fixture: ComponentFixture<CustomNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomNoticeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
