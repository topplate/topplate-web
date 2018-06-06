import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEntranceComponent } from './admin-entrance.component';

describe('AdminEntranceComponent', () => {
  let component: AdminEntranceComponent;
  let fixture: ComponentFixture<AdminEntranceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminEntranceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminEntranceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
