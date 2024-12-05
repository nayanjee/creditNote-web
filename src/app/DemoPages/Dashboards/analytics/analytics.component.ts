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

    this.getDistStockistDivision();
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
    if (this.distributors.length) {
      const stockistDivision = [];
      (this.distributors).forEach(element => {
        (element.stockists).forEach(element2 => {
          const divisions = [];
          (element.divisions).forEach(element3 => {
            divisions.push(parseInt(element3));
          });

          const sd = {
            stockist: parseInt(element2),
            divisions: divisions
          };
          stockistDivision.push(sd);          
        });
      });
      
      const reqData = { data: stockistDivision };
      this.apiService.post('/api/user/getMessages', reqData).subscribe((response: any) => {
        if (response.status === 200) {
          if (response.data.length) {
            this.messages = response.data;
          }
        }
      });
    }
  }

  getDistStockistDivision() {
    this.apiService.get('/api/user/getDistStockistDivision', this.sessionData.id).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.distributors = response.data;
          
          this.getMessages();
        }
      }
    });
  }

  completed(id) {
    const reqData = { id: id, status: 1 };
    this.apiService.post('/api/user/updateMessageStatus', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        // const result = (this.messages).find(({ _id }) => _id === id);
        var foundIndex = (this.messages).findIndex(x => x._id == id);
        this.messages[foundIndex].status = 1;
        console.log(this.messages);
        

        this.toast('success', 'Status updated successfully.');
      } else {
        this.toast('error', response.message);
      }
    });
  }

  inprogress(id) {
    const reqData = { id: id, status: 0 };
    this.apiService.post('/api/user/updateMessageStatus', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        var foundIndex = (this.messages).findIndex(x => x._id == id);
        this.messages[foundIndex].status = 0;
        console.log(this.messages);
        

        this.toast('success', 'Status updated successfully.');
      } else {
        this.toast('error', response.message);
      }
    });
  }
}
