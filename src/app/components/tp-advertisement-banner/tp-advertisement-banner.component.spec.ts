import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpAdvertisementBannerComponent } from './tp-advertisement-banner.component';

describe('TpAdvertisementBannerComponent', () => {
  let component: TpAdvertisementBannerComponent;
  let fixture: ComponentFixture<TpAdvertisementBannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpAdvertisementBannerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpAdvertisementBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
