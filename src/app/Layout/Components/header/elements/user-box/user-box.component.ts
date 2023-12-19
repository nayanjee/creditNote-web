import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import {ThemeOptions} from '../../../../../theme-options';

@Component({
  selector: 'app-user-box',
  templateUrl: './user-box.component.html',
})
export class UserBoxComponent implements OnInit {
  userName: string = '';
  userImg: string = '8.jpg'

  constructor(
    private router: Router,
    public globals: ThemeOptions
  ) {
  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    if (sessionData) {
      const parseSession = JSON.parse(sessionData);
      this.userName = parseSession.name ? parseSession.name : '';
      this.userImg = parseSession.img ? parseSession.img : '8.jpg';
    }
    
  }

  logout() {
    // localStorage.setItem('laUserId', null);

    sessionStorage.removeItem('laUser')
    sessionStorage.clear();
    this.router.navigateByUrl('/login');
  }

  changePassword() {
    this.router.navigateByUrl('/change/password');
  }
}
