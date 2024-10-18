import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faDownload } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import * as moment from 'moment';
import * as XLSX from 'xlsx-js-style';

import { environment } from './../../../environments/environment';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-claims',
  templateUrl: './claims.component.html',
  styleUrls: ['./claims.component.css']
})
export class ClaimsComponent implements OnInit {
  private apiURL: any = environment.apiURL;

  faStar = faStar;
  faPlus = faDownload;
  heading = 'Stockist Claims';
  subheading = 'Accepted, Rejected and Inprogress claim.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';

  claimForm: FormGroup;
  submitted = false;
  btnLoader = false;
  loading = false;
  showData = true;
  accField = false;
  allField = false;
  optionField = false;
  tempRecords: any = [];
  accAmount: number = 0;
  totalAmount: number = 0;
  selectedYear: any;
  selectedMonth: any;

  types: any = [
    { id: 'scheme', name: 'Scheme and Rate Difference' },
    { id: 'sample', name: 'Sample Sales' },
    { id: 'special', name: 'Special Discount' }
  ];
  status: any = [
    { id: 'inprogress', name: 'Inprogress' }
    /* { id: 'approved', name: 'Accepted' },
    { id: 'rejected', name: 'Rejected' } */
  ];
  months: any = [
    { id: 1, name: '01 - Jan' },
    { id: 2, name: '02 - Feb' },
    { id: 3, name: '03 - Mar' },
    { id: 4, name: '04 - Apr' },
    { id: 5, name: '05 - May' },
    { id: 6, name: '06 - Jun' },
    { id: 7, name: '07 - Jul' },
    { id: 8, name: '08 - Aug' },
    { id: 9, name: '09 - Sep' },
    { id: 10, name: '10 - Oct' },
    { id: 11, name: '11 - Nov' },
    { id: 12, name: '12 - Dec' },
  ];
  years: any = [];
  sessionData: any;
  closeResult: any;
  currentYear: any;
  currentMonth: any;
  modalReference: any;
  records: any = [];
  divisions: any = [];
  stockiests: any = [];
  loggedUserId: any = '';
  selectedFields: any = [];
  pdfSource: string = '';
  clickedFile: any = [];
  distributors: any = [];
  userDistributors: any = [];
  userPlantStockists: any = [];
  userPlantDivisions: any = [];
  clickedRecord: any = [];
  urlData: any = [];

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService
  ) {

  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');
    this.sessionData = JSON.parse(sessionData);

    const currentYear = moment().format("YYYY");
    const currentMonth = moment().format("MM");

    this.urlData = {
      urlYear: this.activatedRoute.snapshot.params['year'],
      urlMonth: this.activatedRoute.snapshot.params['month'],
      urlStockist: this.activatedRoute.snapshot.params['stockist'],
      urlDistributor: this.activatedRoute.snapshot.params['distributor']
    }
    
    this.currentMonth = this.urlData.urlMonth ? parseInt(this.urlData.urlMonth) : parseInt(currentMonth);
    this.currentYear = parseInt(currentYear);
    for (var i = parseInt(currentYear); i > parseInt(currentYear) - 3; i--) {
      const year = { id: i, name: i };
      this.years.push(year);
    }

    // To show this data as predefined in the form
    if (this.currentMonth - 1 <= 0) {
      this.selectedYear = this.urlData.urlYear ? parseInt(this.urlData.urlYear) : parseInt(currentYear);
      this.selectedMonth = 12;
    } else {
      this.selectedYear = this.urlData.urlYear ? parseInt(this.urlData.urlYear) : parseInt(currentYear);
      this.selectedMonth = this.currentMonth;
    }
    this.selectedFields['month'] = this.selectedMonth;
    this.selectedFields['year'] = this.selectedYear;
    this.selectedFields['division'] = 0;
    this.selectedFields['type'] = 0;
    this.selectedFields['status'] = 'inprogress';

    this.getDistributors();

    this.delay(1000).then(any => {
      this.isDistributors();
    });
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

    /* const selectedYear = $("#year option:selected").val();
    const selectedMonth = $("#month option:selected").val();
    console.log('Month--', selectedMonth, this.currentMonth);

    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
    } */
  }

  clear() {
    const currentMonth = moment().format("MM");
    const currentYear = moment().format("YYYY");

    this.selectedFields = {
      distributor: this.selectedFields.distributor,
      stockiest: this.selectedFields.stockiest,
      type: 0,
      division: 0,
      month: parseInt(currentMonth),
      year: parseInt(currentYear),
      status: 'inprogress'
    }

    this.tempRecords = [];
    this.totalAmount = 0.00;
  }

  isDistributors() {
    if (this.distributors[0]) {
      if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
        this.getUserDistStockistDivision();
      } else if (this.sessionData.type === 'stockist') {
        this.getStockistDistDivision();
      } else if (this.sessionData.type === 'distributor') {
        this.getDivisionCustomerIds();
      }
    } else {
      this.getDistributors();

      this.delay(1000).then(any => {
        this.isDistributors();
      });
    }
  }

  getDivisionCustomerIds() {
    this.apiService.get('/api/user/getDivisionCustomerIds', this.sessionData.id).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          if (response.data[0].distCustomerIds.length) {
            const result = this.distributors.filter(element => {
              return element.plant === response.data[0].code;
            });
            this.userDistributors.push(result[0]);

            // get user's division plant wise
            this.userPlantDivisions[response.data[0].code] = response.data[0].divisions[0].divisions;

            this.getDistributorStockists(result[0]);

            this.delay(500).then(any => {
              this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
              $('#distributor_loader').hide();
              $('#distributor').show();

              // $("#stockiest").val($("#stockiest option:eq(1)").val());
              // $('#stockiest_loader').hide();
              // $('#stockiest').show();

              this.getStockiest();
              this.getDivisions();
            });
          }
        }
      }
    });
  }

  getDistributorStockists(plant) {
    const reqData = {
      plant: plant.plant
    }
    this.apiService.post('/api/stockiest/distributorStockiest', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          const stockists = [];
          response.data.forEach(element => {
            stockists.push(element.customerId);
          });

          const reqCodes = {
            codes: stockists
          }
          this.apiService.post('/api/user/getUserByCodes', reqCodes).subscribe((resp: any) => {
            if (resp.status === 200) {
              if (response.data) {
                const userCode = [];
                resp.data.forEach(element => {
                  userCode.push(element.code);
                });

                this.userPlantStockists[plant.plant] = userCode;
              }
            }
          });
        }
      }
    });
  }

  getDistributors() {
    this.distributors = [];
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

  getStockiest() {
    let stockists = [];
    const distributor = this.selectedFields.distributor;
    const stockist = this.userPlantStockists[distributor];

    if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
      stockist.forEach(element => {
        stockists.push(Number(element));
      });
    } else if (this.sessionData.type === 'stockist') {
      stockists.push(Number(stockist));
    } else if (this.sessionData.type === 'distributor') {
      stockists = stockist;
    }

    this.apiService.post('/api/getStockiest', stockists).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.stockiests = response.data;

          if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
            // If user has access to approve claim of the distributor (self)
            if (stockists.includes(distributor)) {
              const self = {
                customerId: 1,
                organization: '-- SELF --'
              }
              this.stockiests.push(self);
            }
            // EOF If user has access to approve claim of the distributor (self)
          }

          if (this.urlData.urlStockist) {
            this.selectedFields['stockiest'] = this.urlData.urlStockist;
          } else {
            this.selectedFields['stockiest'] = parseInt(this.stockiests[0].customerId);
          }

          $('#stockiest_loader').hide();
          $('#stockiest').show();

          // To show data directly without clicking 'Search' button.
          if (this.urlData.urlDistributor && this.urlData.urlStockist && this.urlData.urlYear && this.urlData.urlMonth) {
            this.getData();
          }
        }
      }
    });
  }

  getDivisions() {
    let divisions = [];
    this.divisions = [];
    const distributor = this.selectedFields.distributor;
    const division = this.userPlantDivisions[distributor];
    division.forEach(element => {
      divisions.push(Number(element));
    });

    this.apiService.post('/api/getDivision', divisions).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions = response.data;
        }
      }
    });
  }

  getUserDistStockistDivision() {
    this.apiService.get('/api/user/getDistStockistDivision', this.sessionData.id).subscribe((response: any) => {
      if (response.status === 200) {
        console.log('response.data---', response.data);
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

          //this.delay(500).then(any => {
          this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);

          //$("#distributor").val($("#distributor option:eq(1)").val());
          $('#distributor_loader').hide();
          $('#distributor').show();

          this.getStockiest();
          this.getDivisions();
          //});
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

          //this.delay(500).then(any => {
            this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
            $('#distributor_loader').hide();
            $('#distributor').show();

            this.getStockiest();
            this.getDivisions();
          //});
        }
      }
    });
  }

  distributorChange() {
    this.getStockiest();
    this.getDivisions();
  }

  async getData() {
    this.loading = this.showData = true;
    this.accField = false;
    this.allField = false;
    this.optionField = false;
    this.records = this.tempRecords = [];
    this.totalAmount = 0;
    this.accAmount = 0;

    $('#err_stockiest').hide();
    $('#err_status').hide();
    $('#err_month').hide();

    const distributor = this.selectedFields['distributor'];
    const stockiest = this.selectedFields['stockiest'];
    const type = this.selectedFields['type'];
    const division = this.selectedFields['division'];
    const month = this.selectedFields['month'];
    const year = this.selectedFields['year'];
    const status = this.selectedFields['status'];

    if (!stockiest || !status) {
      if (!distributor) $('#err_distributor').text('it\'s a required field.').show();
      if (!stockiest) $('#err_stockiest').text('it\'s a required field.').show();
      if (!status) $('#err_status').text('it\'s a required field.').show();
      return;
    }

    /* if ((month > this.currentMonth) && (year >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
      return;
    } */

    const requestData = {
      plant: distributor,
      customerId: stockiest,
      month: month,
      year: year,
      status: status
    };

    if (type) requestData['claimType'] = type;

    const userDivision = [];
    if (division) {
      userDivision.push(parseInt(division));
    } else {
      this.userPlantDivisions[distributor].forEach(element => {
        userDivision.push(parseInt(element));
      });
    }
    requestData['division'] = userDivision;

    this.apiService.post('/api/tempGetApprovedClaim', requestData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;
          this.tempRecords = response.data;

          this.tempRecords.forEach(element => {
            this.totalAmount = this.totalAmount + element.amount;
            this.accAmount = this.accAmount + element.approvedAmount;
          });

          this.loading = false;
          this.showData = true;

          if (status === 'approved') {
            this.accField = true;
          } else if (status === 'rejected') {
            this.optionField = true;
          }

          if (stockiest === 'all') {
            this.allField = true;
          }
        } else {
          this.loading = this.showData = false;
        }
      } else {
        this.toast('error', response.message);
      }
    });
  }

  exportToExcel() {
    let fileName = 'StockistClaim_' + moment().format('DDMMYYYY_hhmmss') + '_' + this.selectedFields['stockiest'];
    let finalData = [];
    this.tempRecords.forEach((data, index) => {
      const invoiceData = {
        'Sl.No.': parseInt(index) + 1,
        'Month': data.claimMonth,
        'Year': data.claimYear,
        'Stockiest': data.customerId,
        'Claim Type': data.claimType,
        'Reference No': data.invoice,
        'Division': data.divisionName,
        'Material': data.material,
        'Material Name': data.materialName,
        'Batch': data.batch,
        'MRP': data.mrp,
        'PTS': data.pts,
        'Billing Rate': data.billingRate,
        'Free QTY': data.freeQuantity,
        'Sale QTY': data.saleQuantity
      }

      if (data.ftStatus === 1 && data.suhStatus === 1 && data.hoStatus === 1 && data.ho1Status === 1) {
        if (data.approvedQty) invoiceData['Accepted QTY'] = data.approvedQty;
        if (data.approvedAmount) invoiceData['Accepted Amount'] = data.approvedAmount;
      }

      finalData.push(invoiceData);
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(finalData);
    // Set colum width
    ws['!cols'] = [
      { wch: 6 },
      { wch: 7 },
      { wch: 5 },
      { wch: 8 },
      { wch: 10 },
      { wch: 13 },
      { wch: 17 },
      { wch: 10 },
      { wch: 42 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 9 },
      { wch: 9 }
    ];
    for (var i in ws) {
      if (typeof ws[i] != 'object') continue;
      let cell = XLSX.utils.decode_cell(i);

      ws[i].s = {
        alignment: {
          vertical: 'center',
          wrapText: 1
        }
      };

      if (cell.r == 0) {
        // first row
        ws[i].s.alignment = { vertical: "center", wrapText: true };
        ws[i].s.fill = { fgColor: { rgb: "999999" } };
        ws[i].s.font = { bold: true, color: { rgb: "000000" } };
        //ws[i].s.border.bottom = { style: 'thin', color: '000000' };
      }
    }
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, fileName + '.xlsx');
  }

  viewPopup(content, data) {
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

  comments(data) {
    this.clickedRecord = data;

    var modal = document.getElementById("modalComments");
    modal.style.display = "block";
  }

  closeCommentsModal() {
    var modal = document.getElementById("modalComments");
    modal.style.display = "none";
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
