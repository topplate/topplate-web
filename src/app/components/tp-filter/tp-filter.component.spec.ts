import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpFilterComponent } from './tp-filter.component';

describe('TpFilterComponent', () => {
  let component: TpFilterComponent;
  let fixture: ComponentFixture<TpFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
