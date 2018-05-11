import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpScrollableComponent } from './tp-scrollable.component';

describe('TpScrollableComponent', () => {
  let component: TpScrollableComponent;
  let fixture: ComponentFixture<TpScrollableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpScrollableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpScrollableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
