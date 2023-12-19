import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { environment } from './../../../environments/environment';

declare var $: any;

@Component({
	selector: 'app-uploads',
	templateUrl: './uploads.component.html',
	styleUrls: ['./uploads.component.css']
})
export class UploadDistComponent implements OnInit {
	loggedUserId: any = '';
	heading = 'Sales Distributor (9000)';
	subheading = 'Upload distributor sales.';
	icon = 'pe-7s-network icon-gradient bg-premium-dark';

	// isLoading = false;

	constructor(
		private router: Router,
	) {

	}

	ngOnInit() {
		const sessionData = sessionStorage.getItem("laUser");
		if (!sessionData) this.router.navigateByUrl('/login');

		// Logged-in user id
		this.loggedUserId = JSON.parse(sessionData).id;

		// this.isLoading = true;

		$(document).ready(function() {
			$('#file').change(function () {
				var data = new FormData($('#uploadForm')[0]);
				$('#file').attr('disabled', 'disabled');
				$.ajax({
					url: environment.apiURL + '/api/upload',
					type: 'POST',
					contentType: false,
					processData: false,
					cache: false,
					data: data,
					success: function(res){
						const originalname = res['data']['originalname'];
						$('#preview').append('<span style="margin:5px 20px; font-size:15px; font-weight:500; width:100%; float:left;">&#x2022;&nbsp;'+originalname+'</span>');

						$('#message').show();
						setTimeout(function() {
							$('#message').fadeOut('slow');
						}, 1000);

						// this.isLoading = false;
						$('#file').removeAttr('disabled');
					},
					error: function(){
						setTimeout(function() {
							$('#error').fadeOut('slow');
						}, 1000);

						// this.isLoading = false;
						$('#file').removeAttr('disabled');
					}
				});
			});
		});
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
