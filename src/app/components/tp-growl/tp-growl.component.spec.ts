import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpGrowlComponent } from './tp-growl.component';

describe('TpGrowlComponent', () => {
  let component: TpGrowlComponent;
  let fixture: ComponentFixture<TpGrowlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpGrowlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpGrowlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
