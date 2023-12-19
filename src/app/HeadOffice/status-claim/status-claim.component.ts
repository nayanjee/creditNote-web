import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import * as XLSX from 'xlsx-js-style';
import * as moment from 'moment';

import { environment } from './../../../environments/environment';
import { AppServicesService } from '../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-status-claim',
  templateUrl: './status-claim.component.html',
  styleUrls: ['./status-claim.component.css']
})
export class StatusClaimComponent implements OnInit {
  private apiURL: any = environment.apiURL;

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Claim Status';
  subheading = 'Approved and Un-approved claim.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';

  claimForm: FormGroup;
  loading = false;
  showData = true;
  submitted = false;
  btnLoader = false;

  types: any = [
    { id: 'scheme', name: 'Scheme and Rate Difference' },
    { id: 'sample', name: 'Sample Sales' }
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
  currentYear: any;
  currentMonth: any;
  closeResult: any;
  records: any = [];
  modalReference: any;
  fileNames: any = [];
  divisions: any = [];
  stockiests: any = [];
  clickedFile: any = [];
  uploadFile: any;
  tempRecords: any = [];
  loggedUserId: any = '';
  loggedInUser: any = [];
  selectedFields: any = [];
  alignedStockiest: any = [];
  requiredFileType: string;
  pdfSource: string = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService
  ) {

  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.loggedInUser = JSON.parse(sessionData);

    // Number of stockists aligned with the user
    this.alignedStockiest = JSON.parse(sessionData).stockiest;

    this.getStockiest();
    this.getDivision();

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

    this.delay(1000).then(any => {
      // To show this data as predefined in the form
      $('#month').val(parseInt(currentMonth) - 1);
      $('#year').val(currentYear);
      $("#stockiest").val();  // Keep second option selected from the stockist's select box
      $('#stockiest_loader').hide();
      $('#stockiest').show();

      /* const stockiest = $("#stockiest option:selected").val();
      const month = $("#month option:selected").val();
      const year = $("#year option:selected").val();

      this.getData(stockiest, month, year);

      // Put default selected field value
      this.selectedFields['stockiest'] = stockiest;
      this.selectedFields['type'] = '';
      this.selectedFields['division'] = '';
      this.selectedFields['month'] = month;
      this.selectedFields['year'] = year; */
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

  validateMonth(e) {
    $('#err_month').hide();

    const selectedYear = $("#year option:selected").val();
    const selectedMonth = $("#month option:selected").val();

    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
    } else {
      this.filterData(e);
    }
  }

  getStockiest() {
    this.apiService.get('/api/stockiest/all', '').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          const results = response.data.sort((a, b) => (a.organization.trim() > b.organization.trim()) ? 1 : -1);
          this.stockiests = results;
        }
      }
    });
  }

  getDivision() {
    this.apiService.fetch('/api/division/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions = response.data;
        }
      }
    });
  }

  clear() {
    const currentMonth = moment().format("MM");
    const currentYear = moment().format("YYYY");

    $("#stockiest").val('');
    $("#type").val('');
    $("#division").val('');
    $('#month').val(parseInt(currentMonth) - 1);
    $('#year').val(currentYear);
    $("#status").val('');

    $('#stockiest_loader').hide();
    $('#stockiest').show();
  }

  getData() {
    this.loading = this.showData = true;
    this.records = this.tempRecords = [];

    $('#err_stockiest').hide();
    $('#err_status').hide();
    $('#err_month').hide();

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
      customerId: stockiest,
      month: month,
      year: year,
      status: status
    };

    if (type) requestData['claimType'] = type;
    if (division) requestData['divisionName'] = division;

    this.apiService.post('/api/getApprovedClaim', requestData).subscribe((response: any) => {
      console.log(response.data);
      if (response.status === 200) {
        if (response.data.length) {
          response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;
          this.tempRecords = response.data;
          console.log('records---', this.records);

          /* this.selectedFields.stockiest = stockiest;
          this.selectedFields.month = month;
          this.selectedFields.year = year;

          $("#stockiest").val(this.selectedFields.stockiest);
          $("#month").val(this.selectedFields.month);
          $("#year").val(this.selectedFields.year); */

          if (type || division) {
            this.filterDataTwice(type, division);
          }

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

  filterData(e) {
    const targetId = e.target.id;
    this.selectedFields[targetId] = e.target.value;

    const type = this.selectedFields.type;
    const division = this.selectedFields.division;

    if (targetId === 'stockiest' || targetId === 'month' || targetId === 'year') {
      //this.getData(this.selectedFields.stockiest, this.selectedFields.month, this.selectedFields.year);

      this.selectedFields.type = '';
      this.selectedFields.division = '';

      $("#type").val(this.selectedFields.type);
      $("#division").val(this.selectedFields.division);
    }

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

  exportToExcel() {
    // console.log('this.tempRecords---', this.tempRecords);
    let fileName = 'ClaimStatus';
    let finalData = [];
    this.tempRecords.forEach(data => {
      const invoiceData = {
        'Stockiest': data.customerId,
        'Claim Type': data.claimType,
        'Month': data.claimMonth,
        'Year': data.claimYear,
        'Reference No': data.invoice,
        'Batch': data.batch,
        'Division': data.divisionName,
        'Material': data.material,
        'Material Name': data.materialName,
        'MRP': data.mrp,
        'PTS': data.pts,
        'PTR': data.ptr,
        'PTD': data.ptd,
        'Billing Rate': data.billingRate,
        'Margin': data.margin,
        'Free QTY': data.freeQuantity,
        'Sale QTY': data.saleQuantity,
        'Difference': data.difference,
        'Total Difference': data.totalDifference,
        'Amount': data.amount
      }
      finalData.push(invoiceData);
    });
    // console.log('final---', finalData);

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(finalData);
    // Set colum width
    ws['!cols'] = [
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
      { wch: 5 },
      { wch: 15 },
      { wch: 10 },
      { wch: 20 },
      { wch: 15 },
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 }
    ];
    for (var i in ws) {
      // console.log(ws[i]);
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
        ws[i].s.fill = { fgColor: { rgb: "585858" } };
        ws[i].s.font = { bold: true, color: { rgb: "FFFFFF" } };
        //ws[i].s.border.bottom = { style: 'thin', color: '000000' };
      }

      // if (cell.c == 6) {
      //   // first column
      //   ws[i].s.numFmt = 'DD-MM-YYYY'; // for dates
      //   ws[i].z = 'DD-MM-YYYY';
      // } else {
      //   ws[i].s.numFmt = '00'; // other numbers
      // }

      // if (cell.r % 2) {
      //   // every other row
      //   ws[i].s.fill = {
      //     // background color
      //     patternType: 'solid',
      //     fgColor: { rgb: 'b2b2b2' },
      //     bgColor: { rgb: 'b2b2b2' },
      //   };
      // }
    }
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, fileName + '.xlsx');
  }

  viewPopup(content, data, invoice, id) {
    // console.log(data);
    this.pdfSource = '';
    this.clickedFile = data;
    this.clickedFile.invoice = invoice;
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

  confirmBoxDelete(id) {
    Swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this record!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        const type = this.selectedFields.type;
        const division = this.selectedFields.division;

        let reqData = { _id: id };
        this.apiService.update('/api/claim/delete', reqData).subscribe((response: any) => {
          if (response.status === 200) {
            //this.getData(this.selectedFields.stockiest, this.selectedFields.month, this.selectedFields.year, type, division);
            Swal.fire(
              'Deleted!',
              'Your imaginary record has been deleted.',
              'success'
            )
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire(
          'Cancelled',
          'Your imaginary record is safe :)',
          'error'
        )
      }
    })
  }

  confirmBoxDeleteFile(file) {
    Swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this image/file!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        const type = this.selectedFields.type;
        const division = this.selectedFields.division;

        let reqData = { _id: file._id };
        this.apiService.update('/api/claim/deleteFile', reqData).subscribe((response: any) => {
          if (response.status === 200) {
            //this.getData(this.selectedFields.stockiest, this.selectedFields.month, this.selectedFields.year, type, division);
            Swal.fire(
              'Deleted!',
              'Your imaginary record has been deleted.',
              'success'
            )
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire(
          'Cancelled',
          'Your imaginary record is safe :)',
          'error'
        )
      }
      this.modalReference.close();
    })
  }

  uploadwPopup(content, id) {
    this.uploadFile = id;
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

  onFileSelected(event, id) {
    const frmData = new FormData();
    // formData.append("file", event.target.files[0]);
    for (var i = 0; i < event.target.files.length; i++) {
      frmData.append("file", event.target.files[i]);
    }

    this.apiService.upload('/api/UploadClaimInvoices', frmData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          let images = [];
          response.data.forEach(element => {
            const img = {
              claimId: id,
              filename: element.filename,
              originalFilename: element.originalname,
              createdBy: this.loggedUserId
            }
            images.push(img);
          });
          this.apiService.post('/api/claim/fileUpload', images).subscribe((response: any) => {
            if (response.status === 200) {
              this.modalReference.close();
              //this.getData(this.selectedFields.stockiest, this.selectedFields.month, this.selectedFields.year);
              Swal.fire(
                'Uploaded!',
                'Your image/file has been uploaded.',
                'success'
              );
            } else {
              this.modalReference.close();
              Swal.fire(
                'Cancelled',
                'Something went wrong. Try refreshing the page or try again later.',
                'error'
              )
            }
          });
        }
      } else {
        this.modalReference.close();
        Swal.fire(
          'Cancelled',
          'Something went wrong. Try refreshing the page or try again later.',
          'error'
        )
      }
    })
  }

  postClaim() {
    let error = 0;
    let invoiceFiles = [];
    this.records.forEach(element => {
      if (element.files.length) {
        const invFile = {
          invoice: element.invoice,
          file: element.files[0].filename
        }
        invoiceFiles.push(invFile);
      }
    });

    const uniqueAuthors = [...new Map(invoiceFiles.map(v => [v.invoice, v])).values()]; // Remove duplicate invoices
    const remainInvoices = this.records.filter(({ invoice: id1 }) => !uniqueAuthors.some(({ invoice: id2 }) => id2 === id1));
    const uniqueremainInvoices = [...new Map(remainInvoices.map(v => [v.invoice, v])).values()]; // Remove duplicate invoices
    if (uniqueremainInvoices) {
      uniqueremainInvoices.forEach(element => {
        error = 1;
        $('.' + element['invoice']).show();
        // $(".att_3:first").text('Hello')
        this.toast('error', 'All invoices must have at least one file uploaded.');
      });
    }

    if (this.tempRecords.length <= 0) {
      error = 1;
      this.toast('error', 'Currently there are no claims on the list.');
    }

    if (error === 0) {
      let reqData = [];
      this.tempRecords.forEach((element, index) => {
        const temp = {
          _id: element._id,
          isDraft: false,
          isSubmit: true,
          submittedBy: this.loggedUserId,
          submittedOn: moment().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        };
        reqData.push(temp);
        // reqData[index]['submittedBy'] = this.loggedUserId;
      });

      this.apiService.post('/api/claim/submit', reqData).subscribe((response: any) => {
        // console.log('resp--', response);
        if (response.status === 200) {
          this.toast('success', 'Successfully submitted.');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    }
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
