import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpPaginationComponent } from './tp-pagination.component';

describe('TpPaginationComponent', () => {
  let component: TpPaginationComponent;
  let fixture: ComponentFixture<TpPaginationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpPaginationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
