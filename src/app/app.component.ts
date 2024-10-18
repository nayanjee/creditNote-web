import { Component, HostListener } from '@angular/core';
import { AppServicesService } from './shared/service/app-services.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})

export class AppComponent {
  title = 'La Renon Healthcare Pvt. Ltd.';

  constructor(
    private apiService: AppServicesService,
  ) { }

  doBeforeUnload() {
    console.log('document.visibilityState1--', document.visibilityState);
    // Alert the user window is closing 
    return false;
  }

  doUnload() {
    console.log('document.visibilityState2--', document.visibilityState);
    // Clear session or do something
  }
}
