import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockiestClaimComponent } from './stockiest-claim.component';

describe('StockiestClaimComponent', () => {
  let component: StockiestClaimComponent;
  let fixture: ComponentFixture<StockiestClaimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StockiestClaimComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StockiestClaimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
