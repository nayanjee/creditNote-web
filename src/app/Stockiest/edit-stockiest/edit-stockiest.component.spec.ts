import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStockiestComponent } from './edit-stockiest.component';

describe('EditStockiestComponent', () => {
  let component: EditStockiestComponent;
  let fixture: ComponentFixture<EditStockiestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditStockiestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditStockiestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
