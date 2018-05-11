import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpInfiniteListComponent } from './tp-infinite-list.component';

describe('TpInfiniteListComponent', () => {
  let component: TpInfiniteListComponent;
  let fixture: ComponentFixture<TpInfiniteListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpInfiniteListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpInfiniteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
