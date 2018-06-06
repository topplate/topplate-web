import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPlatesComponent } from './admin-plates.component';

describe('AdminPlatesComponent', () => {
  let component: AdminPlatesComponent;
  let fixture: ComponentFixture<AdminPlatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPlatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPlatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
