import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faTh, faCheck, faTrash, faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';

import { AppServicesService } from './../../../shared/service/app-services.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent implements OnInit {
  temp: any = [];
  assets: any = [];
  sessionData: any;
  messages: any = [];
  distributors: any = [];
  notifications: any = [];

  heading = 'Dashboard';
  subheading = 'This is an example dashboard created using build-in elements and components.';
  icon = 'pe-7s-plane icon-gradient bg-tempting-azure';

  public labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];

  constructor(
    private router: Router,
    private apiService: AppServicesService
  ) {

  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');
    this.sessionData = JSON.parse(sessionData);
    console.log('sessionStorageDashboard---', this.sessionData);

    this.getDistributors();
  }

  toast(typeIcon, message) {
    // typeIcon = error, success, warning, info, question
    Swal.fire({
      toast: true,
      position: 'top-right',
      showConfirmButton: false,
      icon: typeIcon,
      timerProgressBar: true,
      timer: 5000,
      title: message
    })
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(''), ms)).then(() => console.log("Fired"));
  }

  getMessages() {
    if (this.distributors[0].stockists.length) {
      const stockists = [];
      (this.distributors[0].stockists).forEach(element => {
        stockists.push(parseInt(element));
      });

      this.apiService.post('/api/user/getMessages', stockists).subscribe((response: any) => {
        if (response.status === 200) {
          if (response.data.length) {
            this.messages = response.data;
          }
        }
      });
    }
  }

  getDistributors() {
    this.apiService.get('/api/user/getDistStockistDivision', this.sessionData.id).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.distributors = response.data;
          this.getMessages();
        }
      }
    });
  }
}
