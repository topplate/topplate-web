import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpPlateUploadModalComponent } from './tp-plate-upload-modal.component';

describe('TpPlateUploadModalComponent', () => {
  let component: TpPlateUploadModalComponent;
  let fixture: ComponentFixture<TpPlateUploadModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpPlateUploadModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpPlateUploadModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
