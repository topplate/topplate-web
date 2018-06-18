import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyTermPageComponent } from './privacy-term-page.component';

describe('PrivacyTermPageComponent', () => {
  let component: PrivacyTermPageComponent;
  let fixture: ComponentFixture<PrivacyTermPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrivacyTermPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyTermPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
