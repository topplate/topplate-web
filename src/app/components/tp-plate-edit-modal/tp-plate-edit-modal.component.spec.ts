import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpPlateEditModalComponent } from './tp-plate-edit-modal.component';

describe('TpPlateEditModalComponent', () => {
  let component: TpPlateEditModalComponent;
  let fixture: ComponentFixture<TpPlateEditModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpPlateEditModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpPlateEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
