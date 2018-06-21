import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCharitiesComponent } from './admin-charities.component';

describe('AdminCharitiesComponent', () => {
  let component: AdminCharitiesComponent;
  let fixture: ComponentFixture<AdminCharitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminCharitiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminCharitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
