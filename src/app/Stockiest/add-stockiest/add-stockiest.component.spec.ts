import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStockiestComponent } from './add-stockiest.component';

describe('AddStockiestComponent', () => {
  let component: AddStockiestComponent;
  let fixture: ComponentFixture<AddStockiestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStockiestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStockiestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
