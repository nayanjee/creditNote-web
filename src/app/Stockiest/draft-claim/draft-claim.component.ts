import { Component, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
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

  // toggle webcam on/off
  public showWebcam = false;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  //closeResult: string;
  selectedwebcamrow: any;
  public videoOptions: MediaTrackConstraints = {
    // width: {ideal: 1024},
    // height: {ideal: 576}
  };
  public errors: WebcamInitError[] = [];

  // latest snapshot
  public webcamImage: WebcamImage = null;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<boolean | string>();


  faStar = faStar;
  faPlus = faPlus;
  heading = 'Drafts';
  subheading = 'Temporarily saved claim. The claim can be corrected (if necessary) and finally submitted for acceptance.';
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
    //{ id: 'special', name: 'Special Discount' }
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
  totalAmount: number = 0;
  urlData: any = [];

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

    const currentYear = moment().format("YYYY");
    const currentMonth = moment().format("MM");

    this.urlData = {
      urlYear: this.activatedRoute.snapshot.params['year'],
      urlMonth: this.activatedRoute.snapshot.params['month'],
      urlStockist: this.activatedRoute.snapshot.params['stockist'],
      urlDistributor: this.activatedRoute.snapshot.params['distributor']
    }

    this.currentMonth = this.urlData.urlMonth ? parseInt(this.urlData.urlMonth) : parseInt(currentMonth);
    this.currentYear = this.urlData.urlYear ? parseInt(this.urlData.urlYear) : parseInt(currentYear);
    for (var i = this.currentYear; i > this.currentYear - 3; i--) {
      const year = { id: i, name: i };
      this.years.push(year);
    }

    // To show this data as predefined in the form
    if (this.currentMonth - 1 <= 0) {
      this.selectedYear = this.currentYear - 1;
      this.selectedMonth = 12;
    } else {
      this.selectedYear = this.currentYear;
      this.selectedMonth = this.currentMonth;
    }

    this.selectedFields['month'] = this.selectedMonth;
    this.selectedFields['year'] = this.selectedYear;
    this.selectedFields['division'] = 0;
    this.selectedFields['type'] = 0;

    this.getDistributors();

    this.delay(1000).then(any => {
      this.isDistributors();
    });

    WebcamUtil.getAvailableVideoInputs().then((mediaDevices: MediaDeviceInfo[]) => {
      this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
    });
  }

  public triggerSnapshot(): void {
    this.trigger.next();
    //let serow = this.selectedwebcamrow;
    const row = this.selectedwebcamrow;
    const reqData = {};
    // console.log("selected web cam row===", this.selectedwebcamrow);
    //const frmData = new FormData();

    //console.log(this.webcamImage.imageAsBase64);
    //frmData.append("file", this.webcamImage.imageAsBase64);
    reqData['camimg'] = this.webcamImage.imageAsBase64;


    this.apiService.upload('/api/UploadClaimInvoicesWebcam', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          let images = [];
          response.data.forEach(element => {
            const img = {
              claimId: row,
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
    //console.log("=========", this.fileNames);

  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
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

  validateMonth(value, targetId) {
    $('#err_month').hide();

    const selectedYear = this.selectedFields.year;
    const selectedMonth = this.selectedFields.month;

    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
    } else {
      this.filterData(value, targetId);
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

            //this.delay(500).then(any => {
            this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
            $('#distributor_loader').hide();
            $('#distributor').show();

            const self = {
              customerId: 1,
              organization: '-- SELF --'
            }
            this.stockiests.push(self);

            this.selectedFields['stockiest'] = parseInt(this.stockiests[0].customerId);
            $('#stockiest_loader').hide();
            $('#stockiest').show();

            this.getDivisions();

            this.delay(1000).then(any => {
              this.getData();
            });
            //});
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

          //this.delay(500).then(any => {
          if (this.urlData.urlDistributor) {
            this.selectedFields['distributor'] = this.urlData.urlDistributor;
          } else {
            this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
          }


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
    const distributor = this.selectedFields['distributor'];
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

          if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
            // If user has access to approve claim of the distributor (self)
            if (stockist.includes(distributor.toString())) {
              const self = {
                customerId: 1,
                organization: '-- SELF --'
              }
              this.stockiests.push(self);
            }
            // EOF If user has access to approve claim of the distributor (self)
          }

          //this.delay(5).then(any => {
          if (this.urlData.urlStockist) {
            this.selectedFields['stockiest'] = this.urlData.urlStockist;
          } else {
            this.selectedFields['stockiest'] = parseInt(this.stockiests[0].customerId);
          }

          $('#stockiest_loader').hide();
          $('#stockiest').show();

          this.getData();
          //});
        }
      }
    });
  }

  getDivisions() {
    let divisions = [];
    this.divisions = [];

    const distributor = this.selectedFields['distributor'];
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
    this.totalAmount = 0;

    const distributor = this.selectedFields['distributor'];
    const stockiest = this.selectedFields['stockiest'];
    const month = this.selectedFields['month'];
    const year = this.selectedFields['year'];
    const type = this.selectedFields['type'];
    const division = this.selectedFields['division'];

    const requestData = {
      plant: distributor,
      customerId: stockiest,
      month: month,
      year: year
    };

    this.apiService.post('/api/getClaim', requestData).subscribe((response: any) => {
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

  filterData(value, targetId) {
    this.loading = true;
    this.showData = true;

    if (targetId === 'type') {
      this.selectedFields[targetId] = value;
    } else {
      this.selectedFields[targetId] = parseInt(value);
    }

    if (targetId === 'distributor') {
      this.selectedFields.type = 0;
      this.selectedFields.division = 0;

      this.getStockiest();
      this.getDivisions();

      this.delay(1000).then(any => {
        this.getData();
      });
    }

    if (targetId === 'stockiest' || targetId === 'month' || targetId === 'year') {
      this.selectedFields.type = 0;
      this.selectedFields.division = 0;

      this.getData();
    }

    const type = this.selectedFields.type;
    const division = this.selectedFields.division;
    console.log(type, division, this.records);

    if (division) {
      const div = this.divisions.filter(function (el) {
        return el.division == Number(division);
      });
      const divisionCode = div[0].division;
      $("#divisionCode").text('(' + divisionCode + ')');
    }

    if (type && division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.claimType == type && el.divisionId == division;
      });
    } else if (type && !division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.claimType == type;
      });
    } else if (!type && division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.divisionId == division;
      });
    } else if (!type && !division) {
      this.tempRecords = this.records;
    }

    if (this.tempRecords.length) {
      this.totalAmount = 0;
      this.tempRecords.forEach(element => {
        this.totalAmount = this.totalAmount + element.amount;
      });

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

        /* To check whether the file is uploaded with each invoice or not. */
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
        /* EOF To check whether the file is uploaded with each invoice or not. */

        if (this.tempRecords.length <= 0) {
          error = 1;
          this.toast('error', 'Currently there are no claims on the list.');
        }

        if (error === 0) {
          let reqData = [];
          this.tempRecords.forEach((element, index) => {
            console.log('element--', element);
            const temp = {
              _id: element._id,
              plant: element.plant,
              customerId: element.customerId,
              divisionId: element.divisionId,
              claimMonth: element.claimMonth,
              claimYear: element.claimYear,
              isDraft: false,
              isSubmit: true,
              submittedBy: this.sessionData.id,
              submittedOn: moment().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
              ftStatus: 1,  //Temporarily (FT and SUH need not approval)
              suhStatus: 1  //Temporarily (FT and SUH need not approval)
            };

            reqData.push(temp);
          });

          const uniqueStockist = [];
          const map = new Map();
          for (const item of reqData) {
            if (!map.has(item.divisionId)) {
              map.set(item.divisionId, true);
              uniqueStockist.push({
                msgType: "newPost",
                division: item.divisionId,
                distributorId: item.plant,
                stockistId: item.customerId,
                claimMonth: item.claimMonth,
                claimYear: item.claimYear
              });
            }
          }

          this.apiService.post('/api/claim/submit', reqData).subscribe((response: any) => {
            if (response.status === 200) {
              this.apiService.post('/api/user/insertMessages', uniqueStockist).subscribe((response: any) => {
                //this.toast('success', 'Successfully submitted.');
              });

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

  openWebcam(event, recordId, content) {
    //const rowId = (row === -1) ? 'def' : row;
    this.showWebcam = true;
    this.selectedwebcamrow = recordId;
    this.modalService.open(content, {
      size: 'lg'
    }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
      this.showWebcam = false;
      this.webcamImage = null;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      this.showWebcam = false;
      this.webcamImage = null;
    });
  }





}
