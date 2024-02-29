import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import * as moment from 'moment';

import { environment } from './../../../environments/environment';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-claim-status',
  templateUrl: './claim-status.component.html',
  styleUrls: ['./claim-status.component.css']
})
export class ClaimStatusComponent implements OnInit {
  private apiURL: any = environment.apiURL;

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Claim Status';
  subheading = 'Approve/un-approved and inprogress stockiest claim.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';

  claimForm: FormGroup;
  submitted = false;
  btnLoader = false;
  loading = false;
  showData = true;
  tempRecords: any = [];
  totalAmount: number = 0;
  selectedYear: any;
  selectedMonth: any;

  types: any = [
    { id: 'scheme', name: 'Scheme and Rate Difference' },
    { id: 'sample', name: 'Sample Sales' },
    { id: 'special', name: 'Special Discount' }
  ];
  months: any = [
    { id: 1, name: '01 - January' },
    { id: 2, name: '02 - February' },
    { id: 3, name: '03 - March' },
    { id: 4, name: '04 - April' },
    { id: 5, name: '05 - May' },
    { id: 6, name: '06 - June' },
    { id: 7, name: '07 - July' },
    { id: 8, name: '08 - August' },
    { id: 9, name: '09 - September' },
    { id: 10, name: '10 - October' },
    { id: 11, name: '11 - November' },
    { id: 12, name: '12 - December' },
  ];
  years: any = [];
  sessionData: any;
  closeResult: any;
  currentYear: any;
  currentMonth: any;
  modalReference: any;
  records: any = [];
  stockiests: any = [];
  loggedUserId: any = '';
  selectedFields: any = [];
  pdfSource: string = '';
  clickedFile: any = [];
  distributors: any = [];
  userDistributors: any = [];
  userPlantStockists: any = [];
  userPlantDivisions: any = [];

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private apiService: AppServicesService
  ) {
    
  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');
    this.sessionData = JSON.parse(sessionData);

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;

    this.delay(1000).then(any => {
      // Current Month and Year
      const currentMonth = moment().format("MM");
      this.currentMonth = parseInt(currentMonth);

      // To show previous 2 years in dropdown
      const currentYear = moment().format("YYYY");
      this.currentYear = parseInt(currentYear);
      for (var i = parseInt(currentYear); i > parseInt(currentYear) - 3; i--) {
        const year = { id: i, name: i };
        this.years.push(year);
      }

      // To show this data as predefined in the form
      if (parseInt(currentMonth) - 1 <= 0) {
        this.selectedYear = parseInt(currentYear) - 1;
        this.selectedMonth = 12;
      } else {
        this.selectedYear = currentYear;
        this.selectedMonth = parseInt(currentMonth) - 1;
      }

      $('#type').val('scheme');
      $('#month').val(this.selectedMonth);
      $('#year').val(this.selectedYear);

      $("#distributor").val($("#distributor option:eq(1)").val());
      $('#distributor_loader').hide();
      $('#distributor').show();

      this.getStockiest();
    });

    this.getDistributors();

    if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
      this.getUserDistStockistDivision();
    } else if (this.sessionData.type === 'stockist') {
      this.getStockistDistDivision();
    }

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

  validateMonth() {
    $('#err_month').hide();

    const selectedYear = $("#year option:selected").val();
    const selectedMonth = $("#month option:selected").val();

    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
    }
  }

  clear() {
    const currentMonth = moment().format("MM");
    const currentYear = moment().format("YYYY");

    $("#stockiest").val('');
    $("#type").val('');
    $('#month').val(parseInt(currentMonth) - 1);
    $('#year').val(currentYear);
    $("#status").val('');

    $('#stockiest_loader').hide();
    $('#stockiest').show();
  }

  getDistributors() {
    this.apiService.fetch('/api/distributor/getDistributor9000').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          // Getting a unique distributor
          const map = new Map();
          for (const item of response.data) {
            if (!map.has(item.plant)) {
              map.set(item.plant, true);
              this.distributors.push({
                plant: item.plant,
                organization: item.organization
              });
            }
          }
          // EOF Getting a unique distributor
        }
      }
    });
  }

  getUserDistStockistDivision() {
    this.apiService.get('/api/user/getDistStockistDivision', this.sessionData.id).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          response.data.forEach(element => {
            // get user's distributor
            const result = this.distributors.filter(element2 => {
              return element.plant === element2.plant;
            });
            this.userDistributors.push(result[0]);
            // EOF get user's distributor

            // get user's stockist plant wise
            this.userPlantStockists[element.plant] = element.stockists;

            // get user's division plant wise
            this.userPlantDivisions[element.plant] = element.divisions;
          });
        }
      }
    });
  }

  getStockistDistDivision() {
    this.apiService.get('/api/user/getStockistDistDivision', this.sessionData.id).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          response.data.forEach(element => {
            // get user's distributor
            const result = this.distributors.filter(element2 => {
              return element.plant === element2.plant;
            });
            this.userDistributors.push(result[0]);
            // EOF get user's distributor
            
            
            // get user's stockist plant wise
            this.userPlantStockists[element.plant] = element.customerId;

            // get user's division plant wise
            this.userPlantDivisions[element.plant] = element.divisions;
          });
        }
      }
    });
  }

  getStockiest() {
    let stockists = [];
    const distributor = $("#distributor option:selected").val();
    const stockist = this.userPlantStockists[distributor];

    if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
      stockist.forEach(element => {
        stockists.push(Number(element));
      });
    } else if (this.sessionData.type === 'stockist') {
      stockists.push(Number(stockist));
    }

    this.apiService.post('/api/getStockiest', stockists).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.stockiests = response.data;

          this.delay(5).then(any => {
            $("#stockiest").val($("#stockiest option:eq(1)").val());
            $('#stockiest_loader').hide();
            $('#stockiest').show();
          });
        }
      }
    });
  }

  async getData() {
    this.loading = this.showData = true;
    this.records = this.tempRecords = [];
    this.totalAmount = 0;

    $('#err_stockiest').hide();
    $('#err_status').hide();
    $('#err_month').hide();

    const distributor = $("#distributor option:selected").val();
    const stockiest = $("#stockiest option:selected").val();
    const type = $("#type option:selected").val();
    const division = $("#division option:selected").val();
    const month = $("#month option:selected").val();
    const year = $("#year option:selected").val();
    const status = $("#status option:selected").val();

    if (!stockiest || !status) {
      if (!stockiest) $('#err_stockiest').text('it\'s a required field.').show();
      if (!status) $('#err_status').text('it\'s a required field.').show();
      return;
    }

    if ((month > this.currentMonth) && (year >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
      return;
    }

    const requestData = {
      plant:distributor,
      customerId: stockiest,
      month: month,
      year: year,
      status: status
    };

    if (type) requestData['claimType'] = type;

    this.apiService.post('/api/getApprovedClaim', requestData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;
          this.tempRecords = response.data;

          if (type || division) {
            this.filterDataTwice(type, division);
          }

          this.tempRecords.forEach(element => {
            this.totalAmount = this.totalAmount + element.amount;
          });

          this.loading = false;
          this.showData = true;
        } else {
          this.loading = this.showData = false;
        }
      } else {
        this.toast('error', response.message);
      }
    });
  }

  filterDataTwice(type = '', division = '') {
    this.selectedFields.type = type;
    this.selectedFields.division = division;

    $("#type").val(this.selectedFields.type);
    $("#division").val(this.selectedFields.division);

    if (type && division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.claimType == type && el.divisionName == division;
      });
    } else if (type && !division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.claimType == type;
      });
    } else if (!type && division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.divisionName == division;
      });
    } else if (!type && !division) {
      this.tempRecords = this.records;
    }
  }

  viewPopup(content, data) {
    // console.log(data);
    this.pdfSource = '';
    this.clickedFile = data;
    const fileExtension = this.clickedFile.filename.substring(this.clickedFile.filename.length - 4);
    if (fileExtension === '.pdf' || fileExtension === '.PDF') {
      this.pdfSource = this.apiURL + '/uploads/files/' + this.clickedFile.filename;
    }

    // console.log(this.clickedFile);
    /* this.modalService.open(content, {
      size: 'lg'
    }); */
    this.modalReference = this.modalService.open(content);
    this.modalReference.result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  newTab(file) {
    window.open(this.apiURL + '/uploads/files/' + this.clickedFile.filename);
  }

  errorHandling(error: any) {
    try {
      // this.isLoading = false;
      const errorObj = error ? JSON.parse(error) : '';
      //this.toastr.error(errorObj.message, 'Error');
    } catch (error) {
      //this.toastr.error(error.message, 'Error');
    }
  }

}
