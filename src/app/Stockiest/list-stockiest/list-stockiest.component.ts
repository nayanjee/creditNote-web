import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';
declare var $: any;
@Component({
  selector: 'app-list-stockiest',
  templateUrl: './list-stockiest.component.html',
  styleUrls: ['./list-stockiest.component.css']
})
export class ListStockiestComponent implements OnInit {

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Stockist';
  subheading = 'Stockist List';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  loading = false;

  loggedUserId: any = '';
  sessionData: any;
  stockiest: any = [];
  selectedFiles: any = [];
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  closeResult: string;



  constructor(private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService, private modalService: NgbModal) { }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');
    this.sessionData = JSON.parse(sessionData);

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.dtOptions = {
      pagingType: 'full_numbers'
    };
    this.getallstockiest();
  }


  // ngAfterViewInit(): void {
  //   this.dtTrigger.next();
  // }

  // ngOnDestroy(): void {
  //   // Do not forget to unsubscribe the event
  //   this.dtTrigger.unsubscribe();
  // }

  addNewStockiest() {
    this.router.navigateByUrl('/stockiest/add');
  }
  getallstockiest() {
    this.loading = true;
    this.apiService.fetch('/api/stockiest/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          //this.temp = [...response.data];
          this.stockiest = response.data;

          this.dtTrigger.next();

        }
        this.loading = false;
      }
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
  /****Modal Standard Code Start */
  open(content) {


    this.modalService.open(content).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
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
  /****Modal Standard Code End */

  onFileSelected(event) {

    this.selectedFiles = event.target.files;

  }

  uploadStockiest() {
    const frmData = new FormData();
    for (var i = 0; i < this.selectedFiles.length; i++) {
      frmData.append("file", this.selectedFiles[i]);
    }
    console.log('Test 2===', frmData);
    this.loading = true;
    $('#uploadstockiestid').attr("disabled", true);
    this.apiService.upload('/api/stockiestImport', frmData).subscribe((response: any) => {
      if (response.status === 200) {
        this.loading = false;
        this.closeResult = 'success';
        //this.toast('success', 'Stockiest Uploaded Successfully')
        Swal.fire({
          icon: 'success',
          title: 'Stockiest Uploaded Successfully',
          showConfirmButton: false,
          timer: 1500
        });
        this.modalService.dismissAll();
        window.location.reload();
        //this.ngOnInit();
      }
    });
  }
}
