import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicePageNoticeComponent } from './service-page-notice.component';

describe('ServicePageNoticeComponent', () => {
  let component: ServicePageNoticeComponent;
  let fixture: ComponentFixture<ServicePageNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicePageNoticeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicePageNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
