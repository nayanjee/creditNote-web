import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import * as moment from 'moment';

import { environment } from './../../../environments/environment';
import { AppServicesService } from '../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-draft-claim',
  templateUrl: './draft-claim.component.html',
  styleUrls: ['./draft-claim.component.css']
})
export class DraftClaimComponent implements OnInit {
  private apiURL: any = environment.apiURL;

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Drafts';
  subheading = 'Temporarily saved claim. The claim can be corrected (if necessary) and finally submitted for approval.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';

  claimForm: FormGroup;
  loading = true;
  showData = true;
  submitted = false;
  btnLoader = false;
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
  selectedFields: any = [];
  alignedStockiest: any = [];
  requiredFileType: string;
  pdfSource: string = '';
  distributors: any = [];
  userDistributors: any = [];
  userPlantStockists: any = [];
  userPlantDivisions: any = [];

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
    this.sessionData = JSON.parse(sessionData);

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
      $('#month').val(this.selectedMonth);
      $('#year').val(this.selectedYear);

      this.selectedFields['month'] = this.selectedMonth;
      this.selectedFields['year'] = this.selectedYear;
    });

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

            this.delay(500).then(any => {
              $("#distributor").val($("#distributor option:eq(1)").val());
              $('#distributor_loader').hide();
              $('#distributor').show();

              $("#stockiest").val($("#stockiest option:eq(1)").val());
              $('#stockiest_loader').hide();
              $('#stockiest').show();

              this.getDivisions();

              this.delay(1000).then(any => {
                this.getData();
              });
            });
          }
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

          this.delay(500).then(any => {
            $("#distributor").val($("#distributor option:eq(1)").val());
            $('#distributor_loader').hide();
            $('#distributor').show();

            this.getStockiest();
            this.getDivisions();
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

          this.delay(500).then(any => {
            $("#distributor").val($("#distributor option:eq(1)").val());
            $('#distributor_loader').hide();
            $('#distributor').show();

            this.getStockiest();
            this.getDivisions();
          });
        }
      }
    });
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

  getStockiest() {
    let stockists = [];
    const distributor = $("#distributor option:selected").val();
    const stockist = this.userPlantStockists[distributor];
    console.log(33333333333333)
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

            const stockiest = $("#stockiest option:selected").val();
            this.selectedFields['stockiest'] = stockiest;

            this.getData();
          });
        }
      }
    });
  }

  getDivisions() {
    let divisions = [];
    this.divisions = [];
    const distributor = $("#distributor option:selected").val();
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

  getData() {
    this.loading = this.showData = true;
    this.records = this.tempRecords = [];

    const distributor = $("#distributor option:selected").val();
    const stockiest = $("#stockiest option:selected").val();
    const month = $("#month option:selected").val();
    const year = $("#year option:selected").val();
    const type = $("#type option:selected").val();
    const division = $("#division option:selected").val();

    const requestData = {
      plant: distributor,
      customerId: stockiest,
      month: month,
      year: year
    };

    /* if (this.sessionData.type === 'distributor') {
      requestData['plant'] = distributor;
    } */
    console.log(requestData)

    this.apiService.post('/api/getClaim', requestData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;
          this.tempRecords = response.data;

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
    this.loading = true;
    this.showData = true;

    const targetId = e.target.id;
    this.selectedFields[targetId] = e.target.value;

    const type = this.selectedFields.type;
    const division = this.selectedFields.division;

    if (targetId === 'distributor') {
      this.getStockiest();
      this.getDivisions();

      this.delay(1000).then(any => {
        this.getData();

        this.selectedFields.type = '';
        this.selectedFields.division = '';

        $("#type").val(this.selectedFields.type);
        $("#division").val(this.selectedFields.division);
      });
    }

    if (targetId === 'stockiest' || targetId === 'month' || targetId === 'year') {
      this.getData();

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

    if (this.tempRecords.length) {
      this.loading = false;
      this.showData = true;
    } else {
      this.loading = false;
      this.showData = false;
    }
  }

  viewPopup(content, data, invoice, id) {
    console.log(data);
    this.pdfSource = '';
    this.clickedFile = data;
    this.clickedFile.invoice = invoice;
    const fileExtension = this.clickedFile.filename.substring(this.clickedFile.filename.length - 4);
    if (fileExtension === '.pdf' || fileExtension === '.PDF') {
      this.pdfSource = this.apiURL + '/uploads/files/' + this.clickedFile.filename;
    }

    console.log(this.clickedFile);
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
            this.getData();
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
            this.getData();
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
              createdBy: this.sessionData.id
            }
            images.push(img);
          });
          console.log('images---', images);
          this.apiService.post('/api/claim/fileUpload', images).subscribe((response: any) => {
            console.log('response---', response.status);
            if (response.status === 200) {
              this.modalReference.close();
              this.getData();
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
    Swal.fire({
      title: 'Are you sure want to submit?',
      text: 'You will not be able to recover this record!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
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
              submittedBy: this.sessionData.id,
              submittedOn: moment().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            };
            reqData.push(temp);
            // reqData[index]['submittedBy'] = this.sessionData.id;
          });

          this.apiService.post('/api/claim/submit', reqData).subscribe((response: any) => {
            if (response.status === 200) {
              this.toast('success', 'Successfully submitted.');
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          });
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire(
          'Cancelled',
          'Your imaginary record is safe :)',
          'error'
        )
      }
    })
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
