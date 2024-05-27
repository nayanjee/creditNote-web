import { 
  MatAutocompleteModule,
  MatFormFieldModule,
  MatInputModule,
  MatSlideToggleModule,
  MatTooltipModule,
  MatBadgeModule } from '@angular/material';
import { NgModule } from '@angular/core';

@NgModule({
  exports: [ 
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatBadgeModule
  ]
 
})

export class MaterialModule {}